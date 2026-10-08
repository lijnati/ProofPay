import type { RawExtraction } from "@/domain/types";

/**
 * Provider-agnostic extraction adapter. Implementations return UNTRUSTED
 * data; callers must ground and validate before use.
 */
export interface Extractor {
  readonly name: string;
  extract(text: string, signal?: AbortSignal): Promise<RawExtraction>;
}

export class ExtractionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ExtractionError";
  }
}
