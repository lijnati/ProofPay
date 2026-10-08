import { normalizeAccount } from "./normalize";

/**
 * Deterministic text signals. These run on the raw source independently of
 * the model, so a manipulated model cannot suppress them.
 */

const INJECTION_PATTERNS: RegExp[] = [
  /\bignore\s+(?:all\s+|any\s+)?(?:previous|prior|above|earlier|preceding)\s+(?:instructions|rules|prompts?|directions)/i,
  /\b(?:disregard|override|bypass)\s+(?:all\s+|any\s+)?(?:previous\s+|prior\s+|your\s+|the\s+)?(?:instructions|rules|checks|policies|verification)/i,
  /\b(?:system|developer)\s+(?:prompt|message|instructions?)\b/i,
  /^\s*(?:system|assistant)\s*:/im,
  /\b(?:note|message|instructions?)\s+(?:to|for)\s+(?:the\s+)?(?:ai|automated|llm|assistant|model|bot)\b/i,
  /\b(?:ai|llm|automated)\s+(?:assistant|system|reviewer|checker|agent|invoice\s+assistant)\b/i,
  /\bmark\s+(?:this|the|it)(?:\s+\w+){0,3}\s+as\s+(?:verified|safe|legitimate|approved|trusted|genuine)/i,
  /\b(?:approve|release|authori[sz]e)\s+(?:the\s+|this\s+)?payment\s+(?:automatically|immediately|without)/i,
  /\bwithout\s+(?:flagging|being\s+flagged|verification|further\s+checks)\b/i,
  /\bdo\s+not\s+(?:flag|report|mention|alert|escalate|hold)\b/i,
  /\byou\s+are\s+(?:an?\s+|the\s+)?(?:ai|assistant|language\s+model|model|chatbot)\b/i,
];

const PAYMENT_CHANGE_PATTERNS: RegExp[] = [
  /\b(?:new|updated|changed|different|revised)\s+(?:bank(?:ing)?|payment|remittance|account)\s+(?:details|information|info|instructions|account|number)\b/i,
  /\b(?:updated|changed|update|change|amended)\s+(?:our|the|its)\s+(?:bank(?:ing)?|payment|remittance)\s+(?:details|account|information|instructions)/i,
  /\b(?:previous|old|former|usual)\s+(?:bank\s+)?account\b/i,
  /\bupdate\s+your\s+(?:records|vendor\s+(?:records|file|master)|payee\s+details)/i,
  /\b(?:we\s+have|we've)\s+(?:moved|changed|switched)\s+(?:banks|bank\s+accounts?|our\s+bank)/i,
  /\bbank(?:ing)?\s+migration\b/i,
];

const URGENCY_PATTERNS: RegExp[] = [
  /\burgent(?:ly)?\b/i,
  /\bimmediately\b/i,
  /\b(?:asap|as\s+soon\s+as\s+possible)\b/i,
  /\bdue[:\s]+today\b/i,
  /\b(?:by|before)\s+end\s+of\s+(?:day|today)\b/i,
  /\bwithin\s+(?:the\s+)?(?:hour|next\s+hour|24\s+hours)\b/i,
  /\bpay\s+(?:\w+\s+)?today\b/i,
  /\bavoid\s+(?:a\s+|any\s+)?(?:hold|delay|suspension|penalt|disruption)/i,
  /\b(?:final|last)\s+(?:notice|reminder|warning)\b/i,
  /\bunable\s+to\s+take\s+calls\b/i,
];

function lineFor(source: string, index: number): string {
  const start = source.lastIndexOf("\n", index - 1) + 1;
  const endIdx = source.indexOf("\n", index);
  const line = source.slice(start, endIdx === -1 ? undefined : endIdx).trim();
  return line.length > 240 ? `${line.slice(0, 237)}…` : line;
}

function scan(source: string, patterns: RegExp[]): string[] {
  const hits = new Set<string>();
  for (const pattern of patterns) {
    const m = pattern.exec(source);
    if (m) hits.add(lineFor(source, m.index));
  }
  return [...hits];
}

export const detectInjection = (source: string) => scan(source, INJECTION_PATTERNS);
export const detectPaymentChange = (source: string) => scan(source, PAYMENT_CHANGE_PATTERNS);
export const detectUrgency = (source: string) => scan(source, URGENCY_PATTERNS);

const IBAN_RE = /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,3})?\b/g;
const KEYWORD_ACCOUNT_RE =
  /\b(?:iban|account(?:\s+(?:number|no\.?|#))?|acct\.?(?:\s*no\.?)?|a\/c)\s*[:#]?\s*([A-Z0-9][A-Z0-9 \t-]{5,40})/gi;

/**
 * Distinct account-like identifiers in the source (IBANs and numbers that
 * follow an account keyword). Used to detect requests offering multiple
 * destinations, independent of the model.
 */
export function findAccountCandidates(source: string): string[] {
  const found = new Set<string>();
  for (const m of source.matchAll(IBAN_RE)) found.add(normalizeAccount(m[0]));
  for (const m of source.matchAll(KEYWORD_ACCOUNT_RE)) {
    const n = normalizeAccount(m[1]);
    if ((n.match(/\d/g) ?? []).length >= 6) found.add(n);
  }
  // Drop candidates that are substrings of another (same account captured twice).
  const list = [...found];
  return list.filter((a) => !list.some((b) => b !== a && b.includes(a)));
}
