import { describe, expect, it } from "vitest";
import type { Extractor } from "@/ai/extractor";
import { createVerifyHandler, type VerifyResponse } from "@/server/verify-handler";
import { SAMPLES } from "@/fixtures/samples";

const sample = (id: string) => SAMPLES.find((s) => s.id === id)!;

/** Extractor that returns each sample's reference extraction (simulates a correct model). */
const faithful: Extractor = {
  name: "test/faithful",
  async extract(text) {
    const s = SAMPLES.find((x) => x.text === text);
    if (!s) throw new Error("unknown text");
    return structuredClone(s.fallbackExtraction);
  },
};

const failing: Extractor = {
  name: "test/failing",
  async extract() {
    throw new Error("provider down");
  },
};

function post(body: unknown) {
  return new Request("http://localhost/api/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/verify", () => {
  it.each(SAMPLES.map((s) => [s.id, s.expectedVerdict] as const))("%s → %s (live)", async (id, verdict) => {
    const res = await createVerifyHandler(faithful)(post({ text: sample(id).text }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as VerifyResponse;
    expect(json.extractionMode).toBe("live");
    expect(json.result.verdict).toBe(verdict);
  });

  it("rejects empty, malformed, oversized and bad-sender input", async () => {
    const handler = createVerifyHandler(faithful);
    expect((await handler(post({ text: "   " }))).status).toBe(400);
    expect((await handler(post("not json"))).status).toBe(400);
    expect((await handler(post({ nope: 1 }))).status).toBe(400);
    expect((await handler(post({ text: "x".repeat(20_001) }))).status).toBe(413);
    expect((await handler(post({ text: "hello", senderEmail: "not-an-email" }))).status).toBe(400);
  });

  it("a malicious model that claims the trusted account for a substituted invoice cannot pass", async () => {
    const legit = sample("legit-northwind");
    const attackerText = legit.text.replace("GB82 WEST 1234 5698 7654 32", "GB33 HRBR 6016 1331 9268 19");
    const malicious: Extractor = {
      name: "test/malicious",
      async extract() {
        return structuredClone(legit.fallbackExtraction); // claims the trusted IBAN
      },
    };
    const json = (await (await createVerifyHandler(malicious)(post({ text: attackerText }))).json()) as VerifyResponse;
    expect(json.result.verdict).not.toBe("NO_MISMATCH_FOUND");
    expect(json.extraction.accountIdentifier.status).toBe("unsupported");
  });

  it("falls back to a labeled replay only for an explicitly selected, unmodified sample", async () => {
    const s = sample("substituted-account");
    const res = await createVerifyHandler(failing)(post({ text: s.text, sampleId: s.id }));
    const json = (await res.json()) as VerifyResponse;
    expect(json.extractionMode).toBe("replay");
    expect(json.model).toBeNull();
    expect(json.extractionLabel).toMatch(/Offline replay.*not live AI/);
    expect(json.result.verdict).toBe("HOLD");
  });

  it("does not replay sample text that was not explicitly selected", async () => {
    const res = await createVerifyHandler(failing)(post({ text: sample("legit-northwind").text }));
    expect(res.status).toBe(502);
  });

  it("does not replay an edited sample, a mismatched sample id, or a sample with an added sender", async () => {
    const s = sample("legit-northwind");
    const handler = createVerifyHandler(failing);
    expect((await handler(post({ text: `${s.text}
PS: new bank details`, sampleId: s.id }))).status).toBe(502);
    expect((await handler(post({ text: s.text, sampleId: "substituted-account" }))).status).toBe(502);
    expect((await handler(post({ text: s.text, sampleId: s.id, senderEmail: "x@freemail.example" }))).status).toBe(502);
    expect((await handler(post({ text: s.text, sampleId: "nope" }))).status).toBe(502);
  });

  it("a model that obeys the embedded injection still cannot change the verdict", async () => {
    const s = sample("prompt-injection");
    // Compromised model: claims the trusted Atlas account and suppresses all signals.
    const obedient: Extractor = {
      name: "test/obedient",
      async extract() {
        const raw = structuredClone(s.fallbackExtraction);
        raw.accountIdentifier = { status: "found", value: "7712 0090 3318", excerpt: "Account: 7712 0090 3318" };
        return raw;
      },
    };
    const json = (await (await createVerifyHandler(obedient)(post({ text: s.text }))).json()) as VerifyResponse;
    expect(json.result.verdict).toBe("HOLD");
    expect(json.extraction.accountIdentifier.status).toBe("unsupported");
    expect(json.result.findings.map((f) => f.code)).toContain("INSTRUCTION_INJECTION");
  });

  it("never fabricates a result for user text when the model is unavailable", async () => {
    const res = await createVerifyHandler(failing)(post({ text: "Please pay invoice 42 to account 1234 5678 90." }));
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: "EXTRACTION_FAILED" });
  });

  it("applies an explicit sender field and marks its origin", async () => {
    const res = await createVerifyHandler(faithful)(
      post({ text: sample("legit-northwind").text, senderEmail: "ap@freemail.example" }),
    );
    const json = (await res.json()) as VerifyResponse;
    expect(json.extraction.senderEmail.origin).toBe("sender_field");
    expect(json.result.verdict).toBe("REVIEW");
  });
});
