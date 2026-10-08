import { describe, expect, it } from "vitest";
import {
  extractDomain,
  isLookalikeDomain,
  normalizeAccount,
  normalizeCompanyName,
} from "@/domain/normalize";

describe("normalizeAccount", () => {
  it("ignores spacing, dashes and case", () => {
    expect(normalizeAccount("gb82 west-1234 5698 7654 32")).toBe("GB82WEST12345698765432");
  });
});

describe("normalizeCompanyName", () => {
  it("strips legal suffixes and punctuation", () => {
    expect(normalizeCompanyName("Kilima Fresh Produce Co.")).toBe("kilima fresh produce");
    expect(normalizeCompanyName("Kilima Fresh Produce Company")).toBe("kilima fresh produce");
    expect(normalizeCompanyName("Atlas Cloud Hosting, Inc.")).toBe("atlas cloud hosting");
  });
  it("does not collapse genuinely different names", () => {
    expect(normalizeCompanyName("Northwind Packaging Services")).not.toBe(
      normalizeCompanyName("Northwind Packaging Ltd"),
    );
    expect(normalizeCompanyName("K. Fresh Trading")).not.toBe(normalizeCompanyName("Kilima Fresh Produce Company"));
  });
});

describe("extractDomain", () => {
  it("handles display-name addresses", () => {
    expect(extractDomain("Priya Shah <Accounts@Northwind-Packaging.example>")).toBe("northwind-packaging.example");
    expect(extractDomain("billing@atlascloud.example")).toBe("atlascloud.example");
  });
  it("returns null for garbage", () => {
    expect(extractDomain("not an email")).toBeNull();
    expect(extractDomain("")).toBeNull();
  });
});

describe("isLookalikeDomain", () => {
  const trusted = "northwind-packaging.example";
  it("flags extra tokens around the trusted name", () => {
    expect(isLookalikeDomain("northwind-packaging-billing.example", trusted)).toBe(true);
  });
  it("flags confusable characters", () => {
    expect(isLookalikeDomain("northwind-packagíng.example", trusted)).toBe(true);
    expect(isLookalikeDomain("n0rthwind-packaging.example", trusted)).toBe(true);
  });
  it("flags a different TLD", () => {
    expect(isLookalikeDomain("northwind-packaging.co", trusted)).toBe(true);
  });
  it("does not flag the exact domain or unrelated domains", () => {
    expect(isLookalikeDomain(trusted, trusted)).toBe(false);
    expect(isLookalikeDomain("freemail.example", trusted)).toBe(false);
  });
});

import { amountsIn, canonicalDecimal, containsWholeAccount, containsWholeEmail, containsWholePhrase, formatAmount, toMinorUnits } from "@/domain/normalize";

describe("decimal money", () => {
  it("canonicalizes decimal strings without floats", () => {
    expect(canonicalDecimal("4,860")).toBe("4860.00");
    expect(canonicalDecimal("0012.5")).toBe("12.50");
    expect(canonicalDecimal("312,500.00")).toBe("312500.00");
    expect(canonicalDecimal("4.860,00")).toBeNull();
    expect(canonicalDecimal("12.345")).toBeNull();
    expect(canonicalDecimal("-5")).toBeNull();
  });
  it("compares exactly in minor units", () => {
    expect(toMinorUnits("0.10") + toMinorUnits("0.20")).toBe(toMinorUnits("0.30"));
    expect(toMinorUnits("9000.01") > toMinorUnits("9000.00")).toBe(true);
  });
  it("finds amounts in text and formats them", () => {
    expect(amountsIn("Amount due: GBP 18,450.00")).toContain("18450.00");
    expect(formatAmount("312500.00", "KES")).toBe("KES 312,500.00");
  });
});

describe("whole-token matching", () => {
  it("accounts must be complete identifiers", () => {
    expect(containsWholeAccount("IBAN: GB82 WEST 1234 5698 7654 32", "GB82WEST12345698765432")).toBe(true);
    expect(containsWholeAccount("IBAN GB82 WEST 1234 5698 7654 32", "GB82 WEST 1234 5698 7654 32")).toBe(true);
    expect(containsWholeAccount("IBAN: GB82 WEST 1234 5698 7654 3299", "GB82 WEST 1234 5698 7654 32")).toBe(false);
    expect(containsWholeAccount("IBAN: GB82 WEST 1234 5698 7654 32 99", "GB82 WEST 1234 5698 7654 32")).toBe(false);
    expect(containsWholeAccount("Account: 12 7712 0090 3318", "7712 0090 3318")).toBe(false);
  });
  it("names must be complete segments", () => {
    expect(containsWholePhrase("Beneficiary: Northwind Packaging Ltd\n", "Northwind Packaging Ltd")).toBe(true);
    expect(containsWholePhrase("Beneficiary: Northwind Packaging Ltd Holdings\n", "Northwind Packaging Ltd")).toBe(false);
    expect(containsWholePhrase("Beneficiary: Not Northwind Packaging Ltd\n", "Northwind Packaging Ltd")).toBe(false);
    expect(containsWholePhrase("Account name: K. Fresh Trading", "K. Fresh Trading")).toBe(true);
    expect(containsWholePhrase("Atlas Cloud Hosting Inc. — Billing", "Atlas Cloud Hosting Inc.")).toBe(true);
  });
  it("emails must not have an extended domain", () => {
    expect(containsWholeEmail("<accounts@northwind-packaging.example>", "accounts@northwind-packaging.example")).toBe(true);
    expect(containsWholeEmail("<accounts@northwind-packaging.example.evil.example>", "accounts@northwind-packaging.example")).toBe(false);
    expect(containsWholeEmail("<xaccounts@northwind-packaging.example>", "accounts@northwind-packaging.example")).toBe(false);
  });
});
