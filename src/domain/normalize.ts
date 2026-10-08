/** Pure normalizers used for comparison and evidence grounding. */

/** Uppercase alphanumerics only: "GB82 west-1234" → "GB82WEST1234". */
export function normalizeAccount(value: string): string {
  return value.normalize("NFKC").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const COMPANY_SUFFIXES = new Set([
  "ltd",
  "limited",
  "inc",
  "incorporated",
  "co",
  "company",
  "llc",
  "plc",
  "corp",
  "corporation",
  "gmbh",
  "the",
]);

/** "Kilima Fresh Produce Co." and "Kilima Fresh Produce Company" → "kilima fresh produce". */
export function normalizeCompanyName(value: string): string {
  const tokens = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  while (tokens.length > 1 && COMPANY_SUFFIXES.has(tokens[tokens.length - 1])) tokens.pop();
  while (tokens.length > 1 && tokens[0] === "the") tokens.shift();
  return tokens.join(" ");
}

/** Extract a lowercase domain from "Name <a@b.example>" / "a@b.example" / "b.example". */
export function extractDomain(sender: string): string | null {
  const trimmed = sender.trim().replace(/^.*</, "").replace(/>.*$/, "").trim();
  const at = trimmed.lastIndexOf("@");
  const domain = (at >= 0 ? trimmed.slice(at + 1) : trimmed).toLowerCase().replace(/\.$/, "");
  if (!domain || !domain.includes(".") || /\s/.test(domain)) return null;
  return domain;
}

/** Text normalization for "does this excerpt occur in the source?" checks. */
export function normalizeForMatch(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐-―]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Alphanumeric-only (unicode-aware) lowercase form, for value-in-excerpt checks. */
export function alnum(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** Reduce a domain to an ASCII "skeleton" so visual confusables collapse together. */
export function domainSkeleton(domain: string): string {
  return domain
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[аạ]/g, "a")
    .replace(/[еė]/g, "e")
    .replace(/[оο0]/g, "o")
    .replace(/[іı]/g, "i")
    .replace(/[1|]/g, "l")
    .replace(/rn/g, "m")
    .replace(/vv/g, "w")
    .replace(/[^a-z0-9.]/g, "");
}

function registrableLabel(domain: string): string {
  const parts = domain.split(".");
  return parts.length >= 2 ? parts[parts.length - 2] : domain;
}

/**
 * True when `domain` differs from `trusted` but plausibly imitates it:
 * confusable characters, small edit distance, punycode, or the trusted name
 * embedded with extra tokens / a different TLD.
 */
export function isLookalikeDomain(domain: string, trusted: string): boolean {
  const d = domain.toLowerCase();
  const t = trusted.toLowerCase();
  if (d === t) return false;
  if (domainSkeleton(d) === domainSkeleton(t)) return true;
  if (levenshtein(d, t) <= 2) return true;
  const trustedLabel = registrableLabel(t);
  const label = registrableLabel(d);
  if (trustedLabel.length >= 5) {
    const skel = domainSkeleton(label);
    const trustedSkel = domainSkeleton(trustedLabel);
    if (skel.includes(trustedSkel)) return true;
    if (d.startsWith("xn--") || d.includes(".xn--")) return levenshtein(skel, trustedSkel) <= 3;
  }
  return false;
}

/** Map common currency symbols/codes in an excerpt to ISO codes. */
export function currencyCodesIn(text: string): Set<string> {
  const codes = new Set<string>();
  const upper = text.toUpperCase();
  for (const m of upper.matchAll(/\b[A-Z]{3}\b/g)) codes.add(m[0]);
  if (text.includes("£")) codes.add("GBP");
  if (text.includes("€")) codes.add("EUR");
  if (text.includes("$")) codes.add("USD");
  if (/\bKSH\b|\bKSHS\b/.test(upper)) codes.add("KES");
  return codes;
}

// ---- Money: decimal strings only, never floating point -------------------

/**
 * Canonical 2-dp decimal string, or null if not a plain amount.
 * "4,860" → "4860.00", "0012.5" → "12.50", "4.860,00" → null (unsupported format).
 */
export function canonicalDecimal(value: string): string | null {
  const s = value.trim().replace(/,(?=\d{3}(?:\D|$))/g, "");
  const m = /^(\d{1,15})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const int = m[1].replace(/^0+(?=\d)/, "");
  return `${int}.${(m[2] ?? "").padEnd(2, "0")}`;
}

/** Minor units (cents) as BigInt for exact comparison. Input must be canonical. */
export function toMinorUnits(canonical: string): bigint {
  const [int, frac] = canonical.split(".");
  return BigInt(int) * BigInt(100) + BigInt(frac);
}

/** Canonical decimals of every amount-like number written in `text`. */
export function amountsIn(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?(?!\d)|\d+(?:\.\d{1,2})?(?![\d,])/g)) {
    const c = canonicalDecimal(m[0]);
    if (c) out.push(c);
  }
  return out;
}

export function formatAmount(canonical: string, currency: string | null): string {
  const [int, frac] = (canonicalDecimal(canonical) ?? canonical).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted = frac != null ? `${grouped}.${frac}` : grouped;
  return currency ? `${currency} ${formatted}` : formatted;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * True when `value` appears in `text` as a COMPLETE name segment: it starts at
 * a line start or after a label delimiter (":", ",", "—", …) and ends at a line
 * end or delimiter. "Northwind Packaging Ltd" is NOT complete inside
 * "Northwind Packaging Ltd Holdings" or "Not Northwind Packaging Ltd".
 */
export function containsWholePhrase(text: string, value: string): boolean {
  const tokens = value.normalize("NFKC").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (!tokens.length) return false;
  const body = tokens.map(escapeRe).join("[^\\p{L}\\p{N}\\n]{1,3}");
  const re = new RegExp(
    `(?<=(?:^|\\n|[:,;|(\\u2013\\u2014-])[ \\t]*)${body}(?=[ \\t]*(?:$|\\n|[,;|()<\\u2013\\u2014]|\\.(?:\\s|$)|-\\s))`,
    "iu",
  );
  return re.test(text.normalize("NFKC").replace(/\r\n/g, "\n"));
}

/** True when the words of `name` (legal suffixes ignored) appear consecutively, with word boundaries. */
export function containsWords(text: string, name: string): boolean {
  const tokens = normalizeCompanyName(name).split(" ").filter(Boolean);
  if (!tokens.length) return false;
  // Not inside an email address, domain, or URL (e.g. "@northwind-packaging.example").
  const re = new RegExp(
    `(?<![\\p{L}\\p{N}@./_-])${tokens.map(escapeRe).join("[ \\t,.&]{1,3}")}(?![\\p{L}\\p{N}])(?![.@_-][\\p{L}\\p{N}])`,
    "iu",
  );
  return re.test(text.normalize("NFKC"));
}

/** True when `email` appears in `text` as a complete address (domain not extended). */
export function containsWholeEmail(text: string, email: string): boolean {
  const re = new RegExp(`(?<![A-Za-z0-9._%+\\-])${escapeRe(email.trim())}(?![A-Za-z0-9\\-]|\\.[A-Za-z0-9])`, "i");
  return re.test(text);
}

// ---- Account identifiers ---------------------------------------------------

/**
 * True when `value` occurs in `text` as a COMPLETE account identifier, allowing
 * single spaces/dashes between characters. A value that is only part of a
 * longer identifier (e.g. extra digits appended or prepended) does not count.
 */
export function containsWholeAccount(text: string, value: string): boolean {
  const chars = normalizeAccount(value).split("");
  if (chars.length < 6) return false;
  const body = chars.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[ \\-]?");
  // Not glued to other alphanumerics, and not continued by digits after a single separator.
  const re = new RegExp(`(?<![A-Za-z0-9])(?<![0-9][ \\-])${body}(?![A-Za-z0-9])(?![ \\-][0-9])`, "i");
  return re.test(text.normalize("NFKC"));
}
