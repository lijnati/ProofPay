import { z } from "zod";

/**
 * Data contracts for ProofPay.
 *
 * RawExtraction is what the LLM is allowed to return. It contains ONLY facts
 * observed in the source text (with excerpts) — no decisions, risk scores, or
 * reference data. Everything downstream treats it as untrusted.
 */

const MAX_TEXT = 500;

export const FieldStatusSchema = z.enum(["found", "missing", "ambiguous"]);

const extractedField = <T extends z.ZodType>(value: T) =>
  z.object({
    status: FieldStatusSchema,
    value: value.nullable(),
    excerpt: z.string().max(MAX_TEXT).nullable(),
  });

const languageSignal = z.object({
  present: z.boolean(),
  excerpts: z.array(z.string().max(MAX_TEXT)).max(10),
});

export const RawExtractionSchema = z.object({
  supplierName: extractedField(z.string().max(200)),
  senderEmail: extractedField(z.string().max(320)),
  invoiceId: extractedField(z.string().max(100)),
  amount: extractedField(z.number().finite().nonnegative()),
  currency: extractedField(z.string().max(10)),
  beneficiaryName: extractedField(z.string().max(200)),
  accountIdentifier: extractedField(z.string().max(64)),
  bankName: extractedField(z.string().max(200)),
  paymentChangeLanguage: languageSignal,
  urgencyLanguage: languageSignal,
});

export type RawExtraction = z.infer<typeof RawExtractionSchema>;

export const FIELD_KEYS = [
  "supplierName",
  "senderEmail",
  "invoiceId",
  "amount",
  "currency",
  "beneficiaryName",
  "accountIdentifier",
  "bankName",
] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];

export const FIELD_LABELS: Record<FieldKey, string> = {
  supplierName: "Supplier",
  senderEmail: "Sender",
  invoiceId: "Invoice",
  amount: "Amount",
  currency: "Currency",
  beneficiaryName: "Beneficiary",
  accountIdentifier: "Payment account",
  bankName: "Bank",
};

/** Where an observed value came from. */
export type Origin = "request_text" | "sender_field";

/**
 * A field after evidence grounding. "unsupported" means the model claimed a
 * value we could not locate in the source; it is treated as missing.
 */
export type GroundedStatus = "found" | "missing" | "ambiguous" | "unsupported";

export interface GroundedField<T> {
  status: GroundedStatus;
  value: T | null;
  excerpt: string | null;
  origin: Origin;
  /** Original model claim, kept for transparency when unsupported. */
  claimedValue?: T | null;
}

export interface GroundedSignal {
  present: boolean;
  excerpts: string[];
}

export interface GroundedExtraction {
  supplierName: GroundedField<string>;
  senderEmail: GroundedField<string>;
  invoiceId: GroundedField<string>;
  amount: GroundedField<number>;
  currency: GroundedField<string>;
  beneficiaryName: GroundedField<string>;
  accountIdentifier: GroundedField<string>;
  bankName: GroundedField<string>;
  paymentChangeLanguage: GroundedSignal;
  urgencyLanguage: GroundedSignal;
}

export interface TrustedSupplier {
  id: string;
  legalName: string;
  aliases: readonly string[];
  senderDomains: readonly string[];
  beneficiaryName: string;
  beneficiaryAliases: readonly string[];
  account: {
    kind: "IBAN" | "LOCAL";
    /** Display form. Compared after normalization. */
    value: string;
    bankName: string;
  };
  currency: string;
  typicalAmount: { min: number; max: number };
  /** How the record was originally established (synthetic for the demo). */
  referenceSource: string;
  lastConfirmed: string;
}

export type Severity = "critical" | "warning" | "info";
export type Verdict = "HOLD" | "REVIEW" | "NO_MISMATCH_FOUND";

export type FindingCode =
  | "UNKNOWN_SUPPLIER"
  | "IDENTITY_CONFLICT"
  | "ACCOUNT_MISMATCH"
  | "BENEFICIARY_MISMATCH"
  | "BANK_MISMATCH"
  | "SENDER_DOMAIN_LOOKALIKE"
  | "SENDER_DOMAIN_UNREGISTERED"
  | "MISSING_CRITICAL_FIELD"
  | "UNGROUNDED_EXTRACTION"
  | "MULTIPLE_ACCOUNTS"
  | "PAYMENT_CHANGE_LANGUAGE"
  | "CURRENCY_MISMATCH"
  | "INSTRUCTION_INJECTION"
  | "URGENCY_LANGUAGE"
  | "SENDER_NOT_PROVIDED"
  | "AMOUNT_OUTSIDE_TYPICAL";

export interface Observed {
  value: string;
  excerpt: string | null;
  origin: Origin;
}

export interface Expected {
  value: string;
  source: string;
}

export interface Finding {
  code: FindingCode;
  severity: Severity;
  field: FieldKey | "request";
  title: string;
  explanation: string;
  observed: Observed | null;
  expected: Expected | null;
}

export type ComparisonStatus = "match" | "mismatch" | "note" | "missing" | "not_compared";

export interface ComparisonRow {
  field: FieldKey;
  label: string;
  observed: Observed | null;
  /** Status of the observed field after grounding. */
  observedStatus: GroundedStatus;
  expected: Expected | null;
  status: ComparisonStatus;
}

export interface VerificationResult {
  verdict: Verdict;
  matchedSupplier: TrustedSupplier | null;
  matchBasis: "name" | "domain" | "name+domain" | null;
  findings: Finding[];
  comparisons: ComparisonRow[];
  checksPerformed: string[];
  checksNotPerformed: string[];
}

export const VerifyRequestSchema = z.object({
  text: z.string(),
  senderEmail: z.string().max(320).optional(),
});

export const MAX_REQUEST_CHARS = 20_000;
