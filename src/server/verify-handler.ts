import type { Extractor } from "@/ai/extractor";
import { groundExtraction } from "@/domain/evidence";
import { extractDomain } from "@/domain/normalize";
import {
  MAX_REQUEST_CHARS,
  VerifyRequestSchema,
  type GroundedExtraction,
  type RawExtraction,
  type VerificationResult,
} from "@/domain/types";
import { verifyRequest } from "@/domain/verify";
import { findSampleByText } from "@/fixtures/samples";
import { TRUSTED_SUPPLIERS } from "@/fixtures/suppliers";

export type ExtractionMode = "live" | "replay";

export interface VerifyResponse {
  requestId: string;
  extractionMode: ExtractionMode;
  model: string | null;
  extraction: GroundedExtraction;
  result: VerificationResult;
}

export type VerifyErrorCode = "INVALID_BODY" | "EMPTY_INPUT" | "TOO_LONG" | "INVALID_SENDER" | "EXTRACTION_FAILED";

const EXTRACTION_TIMEOUT_MS = 30_000;

function error(code: VerifyErrorCode, status: number, message: string) {
  return Response.json({ error: code, message }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST handler factory. Nothing is persisted: the request text lives only in
 * memory for the duration of this call.
 */
export function createVerifyHandler(extractor: Extractor) {
  return async function POST(req: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return error("INVALID_BODY", 400, "Request body must be JSON.");
    }
    const parsed = VerifyRequestSchema.safeParse(body);
    if (!parsed.success) return error("INVALID_BODY", 400, "Request body must include a text field.");

    const text = parsed.data.text.replace(/\r\n/g, "\n");
    if (!text.trim()) return error("EMPTY_INPUT", 400, "Paste a payment request to verify.");
    if (text.length > MAX_REQUEST_CHARS)
      return error("TOO_LONG", 413, `Requests are limited to ${MAX_REQUEST_CHARS.toLocaleString()} characters.`);

    const sender = parsed.data.senderEmail?.trim() || undefined;
    if (sender && !extractDomain(sender)) return error("INVALID_SENDER", 400, "Sender must be an email address.");

    let raw: RawExtraction;
    let mode: ExtractionMode = "live";
    try {
      raw = await extractor.extract(text, AbortSignal.timeout(EXTRACTION_TIMEOUT_MS));
    } catch (err) {
      console.error("[verify] extraction failed:", err instanceof Error ? (err.cause ?? err.message) : err);
      // Labeled offline replay only for the bundled synthetic samples.
      const sample = findSampleByText(text);
      if (!sample) {
        return error("EXTRACTION_FAILED", 502, "The extraction service is unavailable. Nothing was approved — try again.");
      }
      raw = sample.fallbackExtraction;
      mode = "replay";
    }

    const extraction = groundExtraction(raw, text, { senderOverride: sender });
    const result = verifyRequest({ extraction, source: text, registry: TRUSTED_SUPPLIERS });

    const payload: VerifyResponse = {
      requestId: crypto.randomUUID(),
      extractionMode: mode,
      model: mode === "live" ? extractor.name : null,
      extraction,
      result,
    };
    return Response.json(payload, { headers: { "Cache-Control": "no-store" } });
  };
}
