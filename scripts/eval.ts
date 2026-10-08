/**
 * Live evaluation against the REAL model. Nothing here is hard-coded: every
 * number printed or written comes from this run.
 *
 *   pnpm eval                 # labeled eval set (eval/cases.ts)
 *   pnpm eval -- --set=demo   # the six UI demo samples
 *
 * Scores two things separately:
 *   A. extraction quality (after grounding — what the engine actually used)
 *   B. verification correctness (verdict + required findings)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createLlmExtractor } from "../src/ai/llm-extractor";
import { groundExtraction } from "../src/domain/evidence";
import { alnum, canonicalDecimal, normalizeAccount } from "../src/domain/normalize";
import type { GroundedExtraction, RawExtraction, VerificationResult } from "../src/domain/types";
import { verifyRequest } from "../src/domain/verify";
import { SAMPLES } from "../src/fixtures/samples";
import { TRUSTED_SUPPLIERS } from "../src/fixtures/suppliers";
import { EVAL_CASES, type EvalCase } from "../eval/cases";

const set = process.argv.find((a) => a.startsWith("--set="))?.split("=")[1] ?? "eval";
const CONCURRENCY = 2;

const demoAsCases: EvalCase[] = SAMPLES.map((s) => ({
  id: s.id,
  category: "legitimate",
  style: "demo sample",
  text: s.text,
  label: {
    verdict: s.expectedVerdict,
    supplierId: null,
    account: null,
    beneficiary: null,
    amount: null,
    currency: null,
  },
}));
const cases = set === "demo" ? demoAsCases : EVAL_CASES;
const scoreFields = set !== "demo";

type FieldScore = "correct" | "wrong" | "skipped";
interface CaseResult {
  id: string;
  category: string;
  expected: string;
  got: string | null;
  verdictOk: boolean;
  missingFindings: string[];
  fields: Record<"supplier" | "account" | "beneficiary" | "amount" | "currency", FieldScore>;
  unsupportedFields: string[];
  rawAccount: string | null;
  ms: number;
  error?: string;
}

function scoreText(g: GroundedExtraction[keyof GroundedExtraction], label: string | null, norm: (s: string) => string): FieldScore {
  if (!("status" in g)) return "skipped";
  if (label === null) return g.status === "found" ? "wrong" : "correct";
  return g.status === "found" && g.value != null && norm(String(g.value)) === norm(label) ? "correct" : "wrong";
}

function scoreCase(c: EvalCase, raw: RawExtraction, g: GroundedExtraction, r: VerificationResult, ms: number): CaseResult {
  const codes = r.findings.map((f) => f.code);
  const L = c.label;
  return {
    id: c.id,
    category: c.category,
    expected: L.verdict,
    got: r.verdict,
    verdictOk: r.verdict === L.verdict,
    missingFindings: (L.mustInclude ?? []).filter((m) => !codes.includes(m)),
    fields: scoreFields
      ? {
          supplier: (r.matchedSupplier?.id ?? null) === L.supplierId ? "correct" : "wrong",
          account: L.account === "any" ? "skipped" : scoreText(g.accountIdentifier, L.account, normalizeAccount),
          beneficiary: scoreText(g.beneficiaryName, L.beneficiary, alnum),
          amount: scoreText(g.amount, L.amount, (s) => canonicalDecimal(s) ?? s),
          currency: scoreText(g.currency, L.currency, (s) => s.toUpperCase()),
        }
      : { supplier: "skipped", account: "skipped", beneficiary: "skipped", amount: "skipped", currency: "skipped" },
    unsupportedFields: Object.entries(g)
      .filter(([, f]) => "status" in f && f.status === "unsupported")
      .map(([k]) => k),
    rawAccount: raw.accountIdentifier.value,
    ms,
  };
}

async function runOne(c: EvalCase, extractor: ReturnType<typeof createLlmExtractor>): Promise<CaseResult> {
  const started = Date.now();
  try {
    const raw = await extractor.extract(c.text, AbortSignal.timeout(90_000));
    const g = groundExtraction(raw, c.text);
    const r = verifyRequest({ extraction: g, source: c.text, registry: TRUSTED_SUPPLIERS });
    return scoreCase(c, raw, g, r, Date.now() - started);
  } catch (err) {
    return {
      id: c.id, category: c.category, expected: c.label.verdict, got: null, verdictOk: false, missingFindings: [],
      fields: { supplier: "skipped", account: "skipped", beneficiary: "skipped", amount: "skipped", currency: "skipped" },
      unsupportedFields: [], rawAccount: null, ms: Date.now() - started,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

async function main() {
  const extractor = createLlmExtractor();
  const startedAt = new Date().toISOString();
  console.log(`Model: ${extractor.name} · set: ${set} · cases: ${cases.length} · started ${startedAt}\n`);

  const results: CaseResult[] = new Array(cases.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < cases.length) {
        const i = next++;
        results[i] = await runOne(cases[i], extractor);
        const r = results[i];
        console.log(
          `${r.error ? "ERROR" : r.verdictOk && !r.missingFindings.length ? "PASS " : "FAIL "} ${r.id.padEnd(36)} expected ${r.expected.padEnd(17)} got ${String(r.got).padEnd(17)} ${String(r.ms).padStart(6)}ms` +
            (r.missingFindings.length ? `  missing: ${r.missingFindings.join(",")}` : "") +
            (r.unsupportedFields.length ? `  ungrounded: ${r.unsupportedFields.join(",")}` : "") +
            (r.error ? `  ${r.error}` : ""),
        );
      }
    }),
  );

  // ---- Aggregate ----------------------------------------------------------
  const ok = results.filter((r) => !r.error);
  const pct = (n: number, d: number) => (d ? `${n}/${d} (${Math.round((n / d) * 100)}%)` : "n/a");
  const fieldNames = ["supplier", "account", "beneficiary", "amount", "currency"] as const;
  const fieldLines = fieldNames.map((f) => {
    const scored = ok.filter((r) => r.fields[f] !== "skipped");
    return `| ${f} | ${pct(scored.filter((r) => r.fields[f] === "correct").length, scored.length)} |`;
  });
  const holdCases = ok.filter((r) => r.expected === "HOLD");
  const legit = ok.filter((r) => r.expected === "NO_MISMATCH_FOUND");
  const review = ok.filter((r) => r.expected === "REVIEW");
  const lat = ok.map((r) => r.ms).sort((a, b) => a - b);
  const median = lat.length ? lat[Math.floor(lat.length / 2)] : 0;

  const summary = [
    `Model: \`${extractor.name}\` · set: \`${set}\` · ${cases.length} cases · run started ${startedAt}`,
    "",
    "**B. Verification correctness**",
    "",
    "| Metric | Result |",
    "|---|---|",
    `| Expected verdict | ${pct(ok.filter((r) => r.verdictOk).length, ok.length)} |`,
    `| Expected verdict + all required findings | ${pct(ok.filter((r) => r.verdictOk && !r.missingFindings.length).length, ok.length)} |`,
    `| Critical cases held (expected HOLD → HOLD) | ${pct(holdCases.filter((r) => r.got === "HOLD").length, holdCases.length)} |`,
    `| Legitimate cases wrongly HELD | ${legit.filter((r) => r.got === "HOLD").length} of ${legit.length} |`,
    `| Legitimate cases passed (NO_MISMATCH_FOUND) | ${pct(legit.filter((r) => r.got === "NO_MISMATCH_FOUND").length, legit.length)} |`,
    `| Incomplete/unknown cases → REVIEW | ${pct(review.filter((r) => r.got === "REVIEW").length, review.length)} |`,
    `| Any non-legitimate case wrongly passed | ${ok.filter((r) => r.expected !== "NO_MISMATCH_FOUND" && r.got === "NO_MISMATCH_FOUND").length} |`,
    `| Extraction errors (model/API) | ${results.filter((r) => r.error).length} |`,
    "",
    ...(scoreFields
      ? [
          "**A. Extraction quality (after grounding)**",
          "",
          "| Field | Correct |",
          "|---|---|",
          ...fieldLines,
          `| Model claims rejected by grounding | ${ok.reduce((n, r) => n + r.unsupportedFields.length, 0)} field(s) across ${ok.filter((r) => r.unsupportedFields.length).length} case(s) |`,
          "",
        ]
      : []),
    `Latency per request (extraction + verification): median ${median} ms, max ${lat[lat.length - 1] ?? 0} ms (concurrency ${CONCURRENCY}).`,
  ].join("\n");

  console.log(`\n${summary}`);
  mkdirSync("eval/results", { recursive: true });
  const stamp = startedAt.replace(/[:.]/g, "-");
  writeFileSync(`eval/results/${set}-${stamp}.json`, JSON.stringify({ model: extractor.name, set, startedAt, results }, null, 2));
  writeFileSync(`eval/results/${set}-latest.md`, `${summary}\n`);
  console.log(`\nWrote eval/results/${set}-${stamp}.json and eval/results/${set}-latest.md`);
}

main();
