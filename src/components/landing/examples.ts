import { groundExtraction } from "@/domain/evidence";
import { verifyRequest } from "@/domain/verify";
import { SAMPLES } from "@/fixtures/samples";
import { TRUSTED_SUPPLIERS } from "@/fixtures/suppliers";
import type { VerifyResponse } from "@/server/verify-handler";

/**
 * Landing-page examples: the REAL deterministic engine run on the synthetic
 * demo samples with their stored reference extraction. No AI call is made on
 * the landing page; the label says so.
 */
export function exampleResponse(sampleId: string): VerifyResponse {
  const sample = SAMPLES.find((s) => s.id === sampleId);
  if (!sample) throw new Error(`Unknown sample ${sampleId}`);
  const extraction = groundExtraction(sample.fallbackExtraction, sample.text);
  const result = verifyRequest({ extraction, source: sample.text, registry: TRUSTED_SUPPLIERS });
  return {
    requestId: `example-${sampleId}`,
    extractionMode: "replay",
    model: null,
    extractionLabel: "Example · stored reference extraction, not live AI",
    extraction,
    result,
  };
}

export function sampleText(sampleId: string): string {
  return SAMPLES.find((s) => s.id === sampleId)?.text ?? "";
}
