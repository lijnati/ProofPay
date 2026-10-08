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
