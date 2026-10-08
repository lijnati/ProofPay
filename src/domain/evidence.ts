import { alnum, currencyCodesIn, normalizeAccount, normalizeForMatch } from "./normalize";
import type {
  GroundedExtraction,
  GroundedField,
  GroundedSignal,
  RawExtraction,
} from "./types";

/**
 * Evidence grounding: every value the model claims to have "found" must be
 * backed by an excerpt that occurs in the source, and the value must occur in
 * that excerpt. Anything else is demoted to "unsupported" (treated as missing).
 * This is what stops a manipulated or hallucinating model from injecting facts.
 */

type Kind = "text" | "email" | "account" | "amount" | "currency";

type RawField<T> = { status: "found" | "missing" | "ambiguous"; value: T | null; excerpt: string | null };

function excerptInSource(excerpt: string, normSource: string): boolean {
  const e = normalizeForMatch(excerpt);
  return e.length > 0 && normSource.includes(e);
}

function amountsIn(excerpt: string): number[] {
  return [...excerpt.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/,/g, "")));
}

function valueSupported<T>(value: T, excerpt: string, kind: Kind, source: string): boolean {
  switch (kind) {
    case "amount":
      return typeof value === "number" && amountsIn(excerpt).some((n) => Math.abs(n - value) < 0.005);
    case "currency":
      return typeof value === "string" && currencyCodesIn(excerpt).has(value.toUpperCase().trim());
    case "account": {
      if (typeof value !== "string") return false;
      const v = normalizeAccount(value);
      return v.length >= 6 && normalizeAccount(excerpt).includes(v) && normalizeAccount(source).includes(v);
    }
    case "email":
      return typeof value === "string" && value.trim().length > 0 && excerpt.toLowerCase().includes(value.trim().toLowerCase());
    case "text": {
      if (typeof value !== "string") return false;
      const v = alnum(value);
      return v.length > 0 && alnum(excerpt).includes(v);
    }
  }
}

function groundField<T>(raw: RawField<T>, kind: Kind, source: string, normSource: string): GroundedField<T> {
  const origin = "request_text" as const;
  if (raw.status === "missing") return { status: "missing", value: null, excerpt: null, origin };

  const excerptOk = raw.excerpt != null && excerptInSource(raw.excerpt, normSource);

  if (raw.status === "ambiguous") {
    return { status: "ambiguous", value: null, excerpt: excerptOk ? raw.excerpt : null, origin };
  }

  if (raw.value != null && raw.excerpt != null && excerptOk && valueSupported(raw.value, raw.excerpt, kind, source)) {
    return { status: "found", value: raw.value, excerpt: raw.excerpt, origin };
  }
  return { status: "unsupported", value: null, excerpt: null, origin, claimedValue: raw.value };
}

function groundSignal(raw: { present: boolean; excerpts: string[] }, normSource: string): GroundedSignal {
  const excerpts = raw.excerpts.filter((e) => excerptInSource(e, normSource));
  return { present: excerpts.length > 0, excerpts };
}

export interface GroundOptions {
  /** Sender supplied explicitly by the user in a separate field. */
  senderOverride?: string;
}

export function groundExtraction(raw: RawExtraction, source: string, opts: GroundOptions = {}): GroundedExtraction {
  const norm = normalizeForMatch(source);
  const override = opts.senderOverride?.trim();

  return {
    supplierName: groundField(raw.supplierName, "text", source, norm),
    senderEmail: override
      ? { status: "found", value: override, excerpt: null, origin: "sender_field" }
      : groundField(raw.senderEmail, "email", source, norm),
    invoiceId: groundField(raw.invoiceId, "text", source, norm),
    amount: groundField(raw.amount, "amount", source, norm),
    currency: groundField(raw.currency, "currency", source, norm),
    beneficiaryName: groundField(raw.beneficiaryName, "text", source, norm),
    accountIdentifier: groundField(raw.accountIdentifier, "account", source, norm),
    bankName: groundField(raw.bankName, "text", source, norm),
    paymentChangeLanguage: groundSignal(raw.paymentChangeLanguage, norm),
    urgencyLanguage: groundSignal(raw.urgencyLanguage, norm),
  };
}
