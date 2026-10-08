import {
  alnum,
  amountsIn,
  canonicalDecimal,
  containsWholeAccount,
  containsWholeEmail,
  containsWholePhrase,
  currencyCodesIn,
  normalizeForMatch,
} from "./normalize";
import { findLabeledBeneficiaries } from "./signals";
import type {
  GroundedExtraction,
  GroundedField,
  GroundedSignal,
  RawExtraction,
} from "./types";

/**
 * Evidence grounding: every value the model claims to have "found" must be
 * backed by an excerpt that occurs in the source, and the value must be
 * supported by that excerpt. Anything else is demoted to "unsupported"
 * (treated as missing → REVIEW). This stops a manipulated or hallucinating
 * model from injecting facts.
 */

type Kind = "text" | "phrase" | "beneficiary" | "email" | "account" | "amount" | "currency";

type RawField = { status: "found" | "missing" | "ambiguous"; value: string | null; excerpt: string | null };

/** Full source lines spanned by each occurrence of `excerpt` (whitespace-flexible, case-insensitive). */
function excerptLines(source: string, excerpt: string): string[] {
  const parts = excerpt.normalize("NFKC").trim().split(/\s+/).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!parts[0]) return [];
  const text = source.normalize("NFKC").replace(/\r\n/g, "\n");
  const lines: string[] = [];
  for (const m of text.matchAll(new RegExp(parts.join("\\s+"), "gi"))) {
    const start = text.lastIndexOf("\n", m.index - 1) + 1;
    const endIdx = text.indexOf("\n", m.index + m[0].length);
    lines.push(text.slice(start, endIdx === -1 ? undefined : endIdx));
  }
  return lines;
}

function excerptInSource(excerpt: string, normSource: string): boolean {
  const e = normalizeForMatch(excerpt);
  return e.length > 0 && normSource.includes(e);
}

/** Returns the normalized value if supported by the excerpt, else null. */
function supportedValue(value: string, excerpt: string, kind: Kind, source: string): string | null {
  const v = value.trim();
  if (!v) return null;
  switch (kind) {
    case "amount": {
      const c = canonicalDecimal(v);
      return c && amountsIn(excerpt).includes(c) ? c : null;
    }
    case "currency": {
      const code = v.toUpperCase();
      return /^[A-Z]{3}$/.test(code) && currencyCodesIn(excerpt).has(code) ? code : null;
    }
    case "account":
      // Must be a complete identifier both in the excerpt and in the source.
      return containsWholeAccount(excerpt, v) && containsWholeAccount(source, v) ? v : null;
    case "email":
      return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v) && containsWholeEmail(excerpt, v) ? v : null;
    case "phrase":
    case "beneficiary": {
      // Names that drive decisions must be a complete segment on the line the
      // excerpt was quoted from — not a fragment of a longer name.
      const a = alnum(v);
      if (!a || !alnum(excerpt).includes(a)) return null;
      if (!excerptLines(source, excerpt).some((line) => containsWholePhrase(line, v))) return null;
      if (kind === "beneficiary") {
        // If the request labels a payee, the extracted beneficiary must be exactly one of those labels.
        const labeled = findLabeledBeneficiaries(source);
        if (labeled.length && !labeled.some((l) => alnum(l) === a)) return null;
      }
      return v;
    }
    case "text": {
      const a = alnum(v);
      return a.length > 0 && alnum(excerpt).includes(a) ? v : null;
    }
  }
}

function groundField(raw: RawField, kind: Kind, source: string, normSource: string): GroundedField<string> {
  const origin = "request_text" as const;
  if (raw.status === "missing") return { status: "missing", value: null, excerpt: null, origin };

  const excerptOk = raw.excerpt != null && excerptInSource(raw.excerpt, normSource);

  if (raw.status === "ambiguous") {
    return { status: "ambiguous", value: null, excerpt: excerptOk ? raw.excerpt : null, origin };
  }

  const value = raw.value != null && raw.excerpt != null && excerptOk
    ? supportedValue(raw.value, raw.excerpt, kind, source)
    : null;
  if (value != null) return { status: "found", value, excerpt: raw.excerpt, origin };
  return { status: "unsupported", value: null, excerpt: null, origin, claimedValue: raw.value };
}

function groundSignal(raw: { present: boolean; excerpts: string[] }, normSource: string): GroundedSignal {
  const excerpts = raw.excerpts.filter((e) => excerptInSource(e, normSource));
  return { present: excerpts.length > 0, excerpts };
}

export interface GroundOptions {
  /**
   * Sender typed by the user in a separate field. It is a CLAIMED identity
   * (origin "sender_field"), not proof of where the message came from.
   */
  senderOverride?: string;
}

export function groundExtraction(raw: RawExtraction, source: string, opts: GroundOptions = {}): GroundedExtraction {
  const norm = normalizeForMatch(source);
  const override = opts.senderOverride?.trim();

  return {
    supplierName: groundField(raw.supplierName, "phrase", source, norm),
    senderEmail: override
      ? { status: "found", value: override, excerpt: null, origin: "sender_field" }
      : groundField(raw.senderEmail, "email", source, norm),
    invoiceId: groundField(raw.invoiceId, "text", source, norm),
    amount: groundField(raw.amount, "amount", source, norm),
    currency: groundField(raw.currency, "currency", source, norm),
    beneficiaryName: groundField(raw.beneficiaryName, "beneficiary", source, norm),
    accountIdentifier: groundField(raw.accountIdentifier, "account", source, norm),
    bankName: groundField(raw.bankName, "phrase", source, norm),
    paymentChangeLanguage: groundSignal(raw.paymentChangeLanguage, norm),
    urgencyLanguage: groundSignal(raw.urgencyLanguage, norm),
  };
}
