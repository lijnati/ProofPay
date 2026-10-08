import type { TrustedSupplier } from "@/domain/types";

/**
 * SYNTHETIC demo registry. These suppliers, domains (RFC 2606 `.example`),
 * and accounts are fictional. They represent records a business would have
 * established out-of-band (e.g. a call-back during onboarding) — ProofPay
 * treats them as the reference, never anything the AI produces.
 */
const SUPPLIERS: readonly TrustedSupplier[] = [
  {
    id: "sup_northwind",
    legalName: "Northwind Packaging Ltd",
    aliases: ["Northwind Packaging", "Northwind"],
    senderDomains: ["northwind-packaging.example"],
    beneficiaryName: "Northwind Packaging Ltd",
    beneficiaryAliases: ["Northwind Packaging Limited"],
    account: { kind: "IBAN", value: "GB82 WEST 1234 5698 7654 32", bankName: "West Example Bank" },
    currency: "GBP",
    typicalAmount: { min: "1500.00", max: "9000.00" },
    referenceSource: "Synthetic record · confirmed by call-back to onboarding contact",
    lastConfirmed: "2026-03-14",
  },
  {
    id: "sup_kilima",
    legalName: "Kilima Fresh Produce Co.",
    aliases: ["Kilima Fresh Produce", "Kilima Fresh"],
    senderDomains: ["kilimafresh.example"],
    beneficiaryName: "Kilima Fresh Produce Company",
    beneficiaryAliases: ["Kilima Fresh Produce Co."],
    account: { kind: "LOCAL", value: "0100 2233 4455", bankName: "Example Bank Kenya" },
    currency: "KES",
    typicalAmount: { min: "150000.00", max: "600000.00" },
    referenceSource: "Synthetic record · confirmed by signed supplier onboarding form",
    lastConfirmed: "2026-05-02",
  },
  {
    id: "sup_atlas",
    legalName: "Atlas Cloud Hosting Inc.",
    aliases: ["Atlas Cloud Hosting", "Atlas Cloud"],
    senderDomains: ["atlascloud.example"],
    beneficiaryName: "Atlas Cloud Hosting Inc",
    beneficiaryAliases: ["Atlas Cloud Hosting Incorporated"],
    account: { kind: "LOCAL", value: "7712 0090 3318", bankName: "Demo Federal Bank" },
    currency: "USD",
    typicalAmount: { min: "1000.00", max: "6000.00" },
    referenceSource: "Synthetic record · confirmed by call-back to onboarding contact",
    lastConfirmed: "2026-01-20",
  },
];

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === "object") {
    Object.values(obj).forEach(deepFreeze);
    Object.freeze(obj);
  }
  return obj;
}

export const TRUSTED_SUPPLIERS: readonly TrustedSupplier[] = deepFreeze(SUPPLIERS);
