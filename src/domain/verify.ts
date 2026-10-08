import {
  extractDomain,
  formatAmount,
  isLookalikeDomain,
  normalizeAccount,
  normalizeCompanyName,
} from "./normalize";
import { detectInjection, detectPaymentChange, detectUrgency, findAccountCandidates } from "./signals";
import {
  FIELD_LABELS,
  type ComparisonRow,
  type Expected,
  type FieldKey,
  type Finding,
  type GroundedExtraction,
  type GroundedField,
  type Observed,
  type TrustedSupplier,
  type Verdict,
  type VerificationResult,
} from "./types";

/**
 * Deterministic verification. The verdict is computed ONLY from grounded
 * observations and the trusted registry. No model output can set it.
 */

export function decideVerdict(findings: Finding[]): Verdict {
  if (findings.some((f) => f.severity === "critical")) return "HOLD";
  if (findings.some((f) => f.severity === "warning")) return "REVIEW";
  return "NO_MISMATCH_FOUND";
}

const usable = <T>(f: GroundedField<T>): f is GroundedField<T> & { value: T } =>
  f.status === "found" && f.value != null;

function observe<T>(f: GroundedField<T>, display?: (v: T) => string): Observed | null {
  if (!usable(f)) return null;
  return { value: display ? display(f.value) : String(f.value), excerpt: f.excerpt, origin: f.origin };
}

function expectFrom(s: TrustedSupplier, value: string): Expected {
  return { value, source: `${s.referenceSource} (last confirmed ${s.lastConfirmed})` };
}

function nameMatches(name: string, candidates: readonly string[]): boolean {
  const n = normalizeCompanyName(name);
  return candidates.some((c) => normalizeCompanyName(c) === n);
}

const CRITICAL_FIELDS: FieldKey[] = ["accountIdentifier", "beneficiaryName", "amount"];

const ALWAYS_NOT_PERFORMED = [
  "Email authentication (SPF, DKIM, DMARC) — only the pasted text was inspected",
  "Account ownership — ProofPay does not contact banks; the account is compared only with your trusted records",
];

export interface VerifyInput {
  extraction: GroundedExtraction;
  source: string;
  registry: readonly TrustedSupplier[];
}

export function verifyRequest({ extraction: x, source, registry }: VerifyInput): VerificationResult {
  const findings: Finding[] = [];
  const performed: string[] = [];
  const notPerformed: string[] = [...ALWAYS_NOT_PERFORMED];
  const add = (f: Finding) => findings.push(f);

  // ---- Identity -----------------------------------------------------------
  const senderDomain = usable(x.senderEmail) ? extractDomain(x.senderEmail.value) : null;
  const byName = usable(x.supplierName)
    ? registry.find((s) => nameMatches(x.supplierName.value!, [s.legalName, ...s.aliases]))
    : undefined;
  const byDomain = senderDomain ? registry.find((s) => s.senderDomains.includes(senderDomain)) : undefined;

  const supplier = byName ?? byDomain ?? null;
  const matchBasis: VerificationResult["matchBasis"] =
    byName && byDomain && byName === byDomain ? "name+domain" : byName ? "name" : byDomain ? "domain" : null;

  const senderObserved = observe(x.senderEmail);
  const identityConflict = !!(byName && byDomain && byName !== byDomain);

  if (identityConflict) {
    add({
      code: "IDENTITY_CONFLICT",
      severity: "critical",
      field: "senderEmail",
      title: "Sender belongs to a different supplier",
      explanation: `The request names ${byName!.legalName}, but the sender domain ${senderDomain} is registered to ${byDomain!.legalName}. One supplier's mailbox should not be requesting payment for another.`,
      observed: senderObserved,
      expected: expectFrom(byName!, byName!.senderDomains.join(", ")),
    });
  }

  if (!supplier) {
    add({
      code: "UNKNOWN_SUPPLIER",
      severity: "warning",
      field: "supplierName",
      title: "No trusted record for this supplier",
      explanation: usable(x.supplierName)
        ? `“${x.supplierName.value}” is not in your trusted supplier registry, so there are no previously verified payment details to compare against. Verify the supplier through an independent channel before paying.`
        : "The request does not clearly identify a supplier in your registry, so there are no previously verified payment details to compare against.",
      observed: observe(x.supplierName),
      expected: null,
    });
    notPerformed.push("Payment account and beneficiary — no trusted record exists to compare against");
  } else {
    performed.push(
      `Supplier identity matched to trusted record “${supplier.legalName}” by ${matchBasis === "name+domain" ? "name and sender domain" : matchBasis === "name" ? "name" : "sender domain"}`,
    );
  }

  // ---- Sender domain ------------------------------------------------------
  if (!usable(x.senderEmail)) {
    add({
      code: "SENDER_NOT_PROVIDED",
      severity: "info",
      field: "senderEmail",
      title: "No sender address available",
      explanation: "The request did not include a sender address, so the sender domain could not be compared with trusted records.",
      observed: null,
      expected: supplier ? expectFrom(supplier, supplier.senderDomains.join(", ")) : null,
    });
    notPerformed.push("Sender domain — no sender address was provided");
  } else if (!senderDomain) {
    add({
      code: "SENDER_DOMAIN_UNREGISTERED",
      severity: "warning",
      field: "senderEmail",
      title: "Sender address could not be parsed",
      explanation: "The sender address is not a valid email address, so its domain could not be compared with trusted records.",
      observed: senderObserved,
      expected: supplier ? expectFrom(supplier, supplier.senderDomains.join(", ")) : null,
    });
  } else if (!identityConflict) {
    const candidates = supplier ? [supplier] : registry;
    const imitated = candidates.find((s) =>
      s.senderDomains.some((d) => d !== senderDomain && isLookalikeDomain(senderDomain, d)),
    );
    if (supplier && supplier.senderDomains.includes(senderDomain)) {
      performed.push(`Sender domain ${senderDomain} matches the registered domain`);
    } else if (imitated) {
      const trusted = imitated.senderDomains.join(", ");
      add({
        code: "SENDER_DOMAIN_LOOKALIKE",
        severity: "critical",
        field: "senderEmail",
        title: "Sender domain imitates a registered domain",
        explanation: `${senderDomain} closely resembles ${trusted}, the registered domain for ${imitated.legalName}, but it is a different domain. Lookalike domains are a common way to impersonate a known supplier.`,
        observed: senderObserved,
        expected: expectFrom(imitated, trusted),
      });
      performed.push("Sender domain compared with registered domains");
    } else if (supplier) {
      add({
        code: "SENDER_DOMAIN_UNREGISTERED",
        severity: "warning",
        field: "senderEmail",
        title: "Sender domain is not registered for this supplier",
        explanation: `${senderDomain} is not a domain on file for ${supplier.legalName}. The supplier may be using a new address, or someone else may be writing on their behalf.`,
        observed: senderObserved,
        expected: expectFrom(supplier, supplier.senderDomains.join(", ")),
      });
      performed.push("Sender domain compared with registered domains");
    } else {
      performed.push("Sender domain checked against all registered supplier domains for lookalikes");
    }
  }

  // ---- Grounding failures & missing critical fields -----------------------
  for (const key of Object.keys(FIELD_LABELS) as FieldKey[]) {
    const field = x[key];
    if (field.status === "unsupported") {
      const critical = CRITICAL_FIELDS.includes(key) || key === "supplierName" || key === "senderEmail";
      add({
        code: "UNGROUNDED_EXTRACTION",
        severity: critical ? "warning" : "info",
        field: key,
        title: `${FIELD_LABELS[key]} could not be confirmed in the request`,
        explanation: `The AI reported a ${FIELD_LABELS[key].toLowerCase()} value${field.claimedValue != null ? ` (“${String(field.claimedValue)}”)` : ""} that could not be located in the request text. It was discarded and treated as missing.`,
        observed: null,
        expected: null,
      });
    } else if (CRITICAL_FIELDS.includes(key) && field.status !== "found") {
      add({
        code: "MISSING_CRITICAL_FIELD",
        severity: "warning",
        field: key,
        title: `${FIELD_LABELS[key]} ${field.status === "ambiguous" ? "is ambiguous" : "not found"}`,
        explanation:
          field.status === "ambiguous"
            ? `The request contains conflicting or unclear ${FIELD_LABELS[key].toLowerCase()} information. A person should confirm it before any payment.`
            : `The request does not state a ${FIELD_LABELS[key].toLowerCase()}. Without it, the payment cannot be checked against trusted records.`,
        observed: null,
        expected: null,
      });
    }
  }

  // ---- Comparisons against the trusted record -----------------------------
  if (supplier) {
    if (usable(x.accountIdentifier)) {
      const obs = normalizeAccount(x.accountIdentifier.value);
      if (obs !== normalizeAccount(supplier.account.value)) {
        add({
          code: "ACCOUNT_MISMATCH",
          severity: "critical",
          field: "accountIdentifier",
          title: "Payment account differs from the registered account",
          explanation: `This request directs payment to ${x.accountIdentifier.value}, but the account on file for ${supplier.legalName} is ${supplier.account.value}. A changed destination account is the central pattern of payment-diversion fraud. This is a mismatch, not proof of fraud — confirm by calling the supplier on a number you already have, not one from this request.`,
          observed: observe(x.accountIdentifier),
          expected: expectFrom(supplier, supplier.account.value),
        });
      }
      performed.push("Payment account compared with the registered account");
    }

    if (usable(x.beneficiaryName)) {
      if (!nameMatches(x.beneficiaryName.value, [supplier.beneficiaryName, ...supplier.beneficiaryAliases])) {
        add({
          code: "BENEFICIARY_MISMATCH",
          severity: "critical",
          field: "beneficiaryName",
          title: "Account holder name differs from the registered beneficiary",
          explanation: `Payment is addressed to “${x.beneficiaryName.value}”, but the registered beneficiary for ${supplier.legalName} is “${supplier.beneficiaryName}”. Funds sent to a different account holder may not reach the supplier.`,
          observed: observe(x.beneficiaryName),
          expected: expectFrom(supplier, supplier.beneficiaryName),
        });
      }
      performed.push("Beneficiary name compared with the registered beneficiary");
    }

    if (usable(x.bankName) && normalizeCompanyName(x.bankName.value) !== normalizeCompanyName(supplier.account.bankName)) {
      add({
        code: "BANK_MISMATCH",
        severity: "warning",
        field: "bankName",
        title: "Bank differs from the registered bank",
        explanation: `The request names ${x.bankName.value}; the registered bank for ${supplier.legalName} is ${supplier.account.bankName}.`,
        observed: observe(x.bankName),
        expected: expectFrom(supplier, supplier.account.bankName),
      });
    }

    if (usable(x.currency) && x.currency.value.toUpperCase() !== supplier.currency) {
      add({
        code: "CURRENCY_MISMATCH",
        severity: "warning",
        field: "currency",
        title: "Currency differs from the supplier's usual currency",
        explanation: `The request is in ${x.currency.value.toUpperCase()}; ${supplier.legalName} normally invoices in ${supplier.currency}.`,
        observed: observe(x.currency),
        expected: expectFrom(supplier, supplier.currency),
      });
    }

    if (usable(x.amount)) {
      const { min, max } = supplier.typicalAmount;
      if (x.amount.value < min || x.amount.value > max) {
        add({
          code: "AMOUNT_OUTSIDE_TYPICAL",
          severity: "info",
          field: "amount",
          title: "Amount is outside this supplier's typical range",
          explanation: `${formatAmount(x.amount.value, supplier.currency)} is outside the usual range of ${formatAmount(min, supplier.currency)}–${formatAmount(max, null)}. Unusual amounts are context, not evidence of fraud on their own.`,
          observed: observe(x.amount, (v) => formatAmount(v, usable(x.currency) ? x.currency.value : null)),
          expected: expectFrom(supplier, `${formatAmount(min, supplier.currency)} – ${formatAmount(max, null)}`),
        });
      }
    }
  }

  // ---- Source-text signals (model-independent) ----------------------------
  const accounts = findAccountCandidates(source);
  if (accounts.length > 1) {
    add({
      code: "MULTIPLE_ACCOUNTS",
      severity: "warning",
      field: "accountIdentifier",
      title: "More than one payment account in the request",
      explanation: `The request mentions ${accounts.length} different account identifiers. Requests offering alternative destinations should be confirmed before paying.`,
      observed: { value: accounts.join(", "), excerpt: null, origin: "request_text" },
      expected: supplier ? expectFrom(supplier, supplier.account.value) : null,
    });
  }

  const injection = detectInjection(source);
  if (injection.length) {
    add({
      code: "INSTRUCTION_INJECTION",
      severity: "warning",
      field: "request",
      title: "Request contains instructions aimed at automated systems",
      explanation:
        "This text tries to instruct an AI or automated checker. ProofPay treats it as data and it cannot change the result, but legitimate invoices rarely address software — treat it as a manipulation attempt.",
      observed: { value: injection[0], excerpt: injection[0], origin: "request_text" },
      expected: null,
    });
  }

  const change = unique([...detectPaymentChange(source), ...x.paymentChangeLanguage.excerpts]);
  if (change.length) {
    add({
      code: "PAYMENT_CHANGE_LANGUAGE",
      severity: "warning",
      field: "request",
      title: "Request announces changed payment details",
      explanation:
        "Requests to pay a new or different account are the most common setup for invoice fraud. Confirm any change with the supplier using contact details you already hold.",
      observed: { value: change[0], excerpt: change[0], origin: "request_text" },
      expected: null,
    });
  }

  const urgency = unique([...detectUrgency(source), ...x.urgencyLanguage.excerpts]);
  if (urgency.length) {
    add({
      code: "URGENCY_LANGUAGE",
      severity: "info",
      field: "request",
      title: "Time-pressure language",
      explanation:
        "Pressure to pay quickly is common in fraud, but also in ordinary reminders. It is context, not evidence on its own.",
      observed: { value: urgency[0], excerpt: urgency[0], origin: "request_text" },
      expected: null,
    });
  }
  performed.push("Request text scanned for payment-change, urgency, and embedded-instruction language");
  performed.push("AI-extracted values confirmed against the request text");

  return {
    verdict: decideVerdict(findings),
    matchedSupplier: supplier,
    matchBasis,
    findings: sortFindings(findings),
    comparisons: buildComparisons(x, supplier, findings, matchBasis),
    checksPerformed: performed,
    checksNotPerformed: notPerformed,
  };
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 } as const;
// Within a severity, lead with what matters most to the payer.
const CODE_PRIORITY: Finding["code"][] = [
  "ACCOUNT_MISMATCH",
  "BENEFICIARY_MISMATCH",
  "IDENTITY_CONFLICT",
  "SENDER_DOMAIN_LOOKALIKE",
  "UNKNOWN_SUPPLIER",
  "MISSING_CRITICAL_FIELD",
  "UNGROUNDED_EXTRACTION",
  "PAYMENT_CHANGE_LANGUAGE",
  "INSTRUCTION_INJECTION",
  "BANK_MISMATCH",
  "MULTIPLE_ACCOUNTS",
  "SENDER_DOMAIN_UNREGISTERED",
  "CURRENCY_MISMATCH",
];
const priority = (c: Finding["code"]) => {
  const i = CODE_PRIORITY.indexOf(c);
  return i === -1 ? CODE_PRIORITY.length : i;
};
function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || priority(a.code) - priority(b.code),
  );
}

function buildComparisons(
  x: GroundedExtraction,
  supplier: TrustedSupplier | null,
  findings: Finding[],
  matchBasis: VerificationResult["matchBasis"],
): ComparisonRow[] {
  const flagged = (field: FieldKey, severities: Finding["severity"][] = ["critical", "warning"]) =>
    findings.some((f) => f.field === field && severities.includes(f.severity) && f.code !== "MULTIPLE_ACCOUNTS");

  const row = (
    field: FieldKey,
    expected: Expected | null,
    display?: (v: never) => string,
  ): ComparisonRow => {
    const f = x[field] as GroundedField<unknown>;
    const observed = observe(f, display as ((v: unknown) => string) | undefined);
    let status: ComparisonRow["status"];
    if (!observed) status = "missing";
    else if (!expected) status = "not_compared";
    else status = flagged(field) ? "mismatch" : "match";
    return { field, label: FIELD_LABELS[field], observed, observedStatus: f.status, expected, status };
  };

  const currency = usable(x.currency) ? x.currency.value : null;
  if (!supplier) {
    return (
      ["supplierName", "senderEmail", "beneficiaryName", "accountIdentifier", "bankName", "amount", "invoiceId"] as FieldKey[]
    ).map((k) => {
      const r = row(k, null, k === "amount" ? ((v: number) => formatAmount(v, currency)) as never : undefined);
      if (k === "senderEmail" && flagged("senderEmail", ["critical"])) r.status = "mismatch";
      return r;
    });
  }

  const supplierRow = row("supplierName", expectFrom(supplier, supplier.legalName));
  if (supplierRow.observed && matchBasis === "domain") supplierRow.status = "not_compared";
  if (findings.some((f) => f.code === "IDENTITY_CONFLICT")) supplierRow.status = "mismatch";

  const amountRow = row(
    "amount",
    expectFrom(supplier, `${formatAmount(supplier.typicalAmount.min, supplier.currency)} – ${formatAmount(supplier.typicalAmount.max, null)} typical`),
    ((v: number) => formatAmount(v, currency)) as never,
  );
  if (amountRow.status === "match" && flagged("amount", ["info"])) amountRow.status = "note";

  return [
    supplierRow,
    row("senderEmail", expectFrom(supplier, supplier.senderDomains.map((d) => `@${d}`).join(", "))),
    row("beneficiaryName", expectFrom(supplier, supplier.beneficiaryName)),
    row("accountIdentifier", expectFrom(supplier, supplier.account.value)),
    row("bankName", expectFrom(supplier, supplier.account.bankName)),
    row("currency", expectFrom(supplier, supplier.currency)),
    amountRow,
    row("invoiceId", null),
  ];
}
