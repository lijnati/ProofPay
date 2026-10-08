import { generateText, NoObjectGeneratedError, Output } from "ai";
import { RawExtractionSchema } from "@/domain/types";
import { ExtractionError, type Extractor } from "./extractor";
import { buildExtractionPrompt, EXTRACTION_SYSTEM_PROMPT } from "./prompt";

/**
 * LLM extractor via the Vercel AI Gateway ("provider/model" strings).
 * Auth: AI_GATEWAY_API_KEY locally, or OIDC automatically on Vercel.
 * Swap providers by changing PROOFPAY_MODEL (or this file only).
 *
 * No sampling parameters are forced (some models reject them); determinism
 * comes from the schema + grounding, not temperature.
 */
export const DEFAULT_MODEL = "anthropic/claude-sonnet-5.5";

/** Attempts when the model returns output that fails the schema. Transport retries are separate (maxRetries). */
const SCHEMA_ATTEMPTS = 2;

export function createLlmExtractor(model = process.env.PROOFPAY_MODEL || DEFAULT_MODEL): Extractor {
  return {
    name: model,
    async extract(text, signal) {
      let lastError: unknown;
      for (let attempt = 1; attempt <= SCHEMA_ATTEMPTS; attempt++) {
        try {
          const { output } = await generateText({
            model,
            system: EXTRACTION_SYSTEM_PROMPT,
            prompt: buildExtractionPrompt(text),
            output: Output.object({ schema: RawExtractionSchema }),
            maxRetries: 1,
            abortSignal: signal,
          });
          // Re-validate: never trust the transport layer alone.
          return RawExtractionSchema.parse(output);
        } catch (error) {
          lastError = error;
          const schemaFailure = NoObjectGeneratedError.isInstance(error) || (error as Error)?.name === "ZodError";
          if (!schemaFailure || signal?.aborted) break;
        }
      }
      throw new ExtractionError(describeError(lastError));
    },
  };
}

/** Safe, content-free description (never includes prompt or request text). */
function describeError(error: unknown): string {
  if (!(error instanceof Error)) return "Unknown extraction error";
  const status = (error as { statusCode?: number }).statusCode;
  return `${error.name}${status ? ` (HTTP ${status})` : ""}`;
}
