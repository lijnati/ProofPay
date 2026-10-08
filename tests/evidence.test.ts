import { describe, expect, it } from "vitest";
import { groundExtraction } from "@/domain/evidence";
import { SAMPLES } from "@/fixtures/samples";
import type { RawExtraction } from "@/domain/types";

const legit = SAMPLES.find((s) => s.id === "legit-northwind")!;

function clone(raw: RawExtraction): RawExtraction {
  return structuredClone(raw);
}

describe("groundExtraction", () => {
  it.each(SAMPLES.map((s) => [s.id, s] as const))(
    "every found field in sample %s is grounded in its text",
    (_id, sample) => {
      const grounded = groundExtraction(sample.fallbackExtraction, sample.text);
      for (const [key, field] of Object.entries(grounded)) {
        if ("status" in field) {
          expect(field.status, key).not.toBe("unsupported");
        }
      }
    },
  );

  it("demotes an account number that does not appear in the source", () => {
    const raw = clone(legit.fallbackExtraction);
    raw.accountIdentifier = { status: "found", value: "GB00 FAKE 0000 0000 0000 00", excerpt: "IBAN: GB82 WEST 1234 5698 7654 32" };
    const g = groundExtraction(raw, legit.text);
    expect(g.accountIdentifier.status).toBe("unsupported");
    expect(g.accountIdentifier.value).toBeNull();
    expect(g.accountIdentifier.claimedValue).toBe("GB00 FAKE 0000 0000 0000 00");
  });

  it("demotes a fabricated excerpt even when the value looks right", () => {
    const raw = clone(legit.fallbackExtraction);
    raw.beneficiaryName = { status: "found", value: "Northwind Packaging Ltd", excerpt: "Verified beneficiary: Northwind Packaging Ltd" };
    expect(groundExtraction(raw, legit.text).beneficiaryName.status).toBe("unsupported");
  });

  it("demotes a found field with no excerpt", () => {
    const raw = clone(legit.fallbackExtraction);
    raw.invoiceId = { status: "found", value: "NWP-2026-0412", excerpt: null };
    expect(groundExtraction(raw, legit.text).invoiceId.status).toBe("unsupported");
  });

  it("demotes an amount not present in its excerpt", () => {
    const raw = clone(legit.fallbackExtraction);
    raw.amount = { status: "found", value: "486.00", excerpt: "Amount due: GBP 4,860.00" };
    expect(groundExtraction(raw, legit.text).amount.status).toBe("unsupported");
  });

  it("tolerates whitespace and line-ending differences in excerpts", () => {
    const raw = clone(legit.fallbackExtraction);
    raw.accountIdentifier = { status: "found", value: "GB82WEST12345698765432", excerpt: "IBAN:   GB82 WEST 1234 5698 7654 32" };
    const g = groundExtraction(raw, legit.text.replace(/\n/g, "\r\n"));
    expect(g.accountIdentifier.status).toBe("found");
  });

  it("uses an explicitly supplied sender over the text, and labels its origin", () => {
    const g = groundExtraction(legit.fallbackExtraction, legit.text, { senderOverride: "ap@other.example" });
    expect(g.senderEmail).toMatchObject({ status: "found", value: "ap@other.example", origin: "sender_field" });
  });

  it("drops language-signal excerpts that are not in the source", () => {
    const raw = clone(legit.fallbackExtraction);
    raw.urgencyLanguage = { present: true, excerpts: ["pay within the hour"] };
    const g = groundExtraction(raw, legit.text);
    expect(g.urgencyLanguage).toEqual({ present: false, excerpts: [] });
  });
});
