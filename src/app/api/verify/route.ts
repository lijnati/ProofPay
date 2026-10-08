import { createLlmExtractor } from "@/ai/llm-extractor";
import { createVerifyHandler } from "@/server/verify-handler";

export const maxDuration = 60;

export const POST = createVerifyHandler(createLlmExtractor());
