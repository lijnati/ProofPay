/**
 * Live evaluation: runs every bundled synthetic sample through the REAL model
 * and the deterministic engine, and prints observed vs expected verdicts.
 * Results are only what this run produced — never hard-coded.
 *
 *   AI_GATEWAY_API_KEY=... pnpm eval
 */
import { createLlmExtractor } from "../src/ai/llm-extractor";
import { groundExtraction } from "../src/domain/evidence";
import { verifyRequest } from "../src/domain/verify";
import { SAMPLES } from "../src/fixtures/samples";
import { TRUSTED_SUPPLIERS } from "../src/fixtures/suppliers";

async function main() {
  const extractor = createLlmExtractor();
  console.log(`Model: ${extractor.name}\n`);
  let pass = 0;
  for (const s of SAMPLES) {
    const started = Date.now();
    try {
      const raw = await extractor.extract(s.text, AbortSignal.timeout(60_000));
      const extraction = groundExtraction(raw, s.text);
      const result = verifyRequest({ extraction, source: s.text, registry: TRUSTED_SUPPLIERS });
      const ok = result.verdict === s.expectedVerdict;
      if (ok) pass++;
      const unsupported = Object.entries(extraction)
        .filter(([, f]) => "status" in f && f.status === "unsupported")
        .map(([k]) => k);
      console.log(
        `${ok ? "PASS" : "FAIL"}  ${s.id.padEnd(22)} expected ${s.expectedVerdict.padEnd(17)} got ${result.verdict.padEnd(17)} ${Date.now() - started}ms` +
          `  [${result.findings.map((f) => f.code).join(", ")}]` +
          (unsupported.length ? `  ungrounded: ${unsupported.join(",")}` : ""),
      );
    } catch (err) {
      console.log(`ERROR ${s.id}: ${err instanceof Error ? String(err.cause ?? err.message) : err}`);
    }
  }
  console.log(`\n${pass}/${SAMPLES.length} samples produced the expected verdict.`);
}

main();
