import { generateText, Output } from "ai";
import { RawExtractionSchema } from "@/domain/types";
import { ExtractionError, type Extractor } from "./extractor";
import { buildExtractionPrompt, EXTRACTION_SYSTEM_PROMPT } from "./prompt";

/**
 * LLM extractor via the Vercel AI Gateway ("provider/model" strings).
 * Auth: AI_GATEWAY_API_KEY locally, or OIDC automatically on Vercel.
 * Swap providers by changing PROOFPAY_MODEL (or this file only).
 */
export const DEFAULT_MODEL = "anthropic/claude-sonnet-5.5";

export function createLlmExtractor(model = process.env.PROOFPAY_MODEL || DEFAULT_MODEL): Extractor {
  return {
    name: model,
    async extract(text, signal) {
      try {
        const { output } = await generateText({
          model,
          system: EXTRACTION_SYSTEM_PROMPT,
          prompt: buildExtractionPrompt(text),
          output: Output.object({ schema: RawExtractionSchema }),
          temperature: 0,
          maxRetries: 1,
          abortSignal: signal,
        });
        // Re-validate: never trust the transport layer alone.
        return RawExtractionSchema.parse(output);
      } catch (error) {
        throw new ExtractionError("Live extraction failed", { cause: error });
      }
    },
  };
}
