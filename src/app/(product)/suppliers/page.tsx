import type { Metadata } from "next";
import { TRUSTED_SUPPLIERS } from "@/fixtures/suppliers";
import { formatAmount } from "@/domain/normalize";

export const metadata: Metadata = { title: "Trusted records" };

export default function SuppliersPage() {
  return (
    <main className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:py-8">
      <div className="max-w-2xl">
        <h1 className="text-[1.375rem] font-semibold tracking-tight">Trusted supplier records</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-3 text-pretty">
          The reference ProofPay compares every request against. In a real deployment these come from your own
          onboarding process, such as a call-back to a known contact. AI never creates or edits them.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-review-line bg-review-soft px-2.5 py-1 text-xs text-review">
          Synthetic demo data — fictional companies, <span className="font-mono">.example</span> domains, and accounts
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {TRUSTED_SUPPLIERS.map((s) => (
          <article key={s.id} className="rounded-xl border border-line bg-surface">
            <header className="border-b border-line px-5 py-4">
              <h2 className="font-semibold tracking-tight">{s.legalName}</h2>
              <p className="mt-0.5 text-xs text-ink-4">Last confirmed {s.lastConfirmed}</p>
            </header>
            <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-2.5 px-5 py-4 text-[13px]">
              <dt className="text-ink-4">Sender</dt>
              <dd className="break-words font-mono">{s.senderDomains.map((d) => `@${d}`).join(", ")}</dd>
              <dt className="text-ink-4">Beneficiary</dt>
              <dd>{s.beneficiaryName}</dd>
              <dt className="text-ink-4">{s.account.kind === "IBAN" ? "IBAN" : "Account"}</dt>
              <dd className="break-words font-mono">{s.account.value}</dd>
              <dt className="text-ink-4">Bank</dt>
              <dd>{s.account.bankName}</dd>
              <dt className="text-ink-4">Currency</dt>
              <dd className="font-mono">{s.currency}</dd>
              <dt className="text-ink-4">Typical</dt>
              <dd className="font-mono">
                {formatAmount(s.typicalAmount.min, null)} – {formatAmount(s.typicalAmount.max, null)}
              </dd>
            </dl>
            <p className="border-t border-line px-5 py-3 text-[11px] leading-snug text-ink-4">{s.referenceSource}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
