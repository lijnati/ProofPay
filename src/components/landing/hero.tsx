import Link from "next/link";
import { TRUSTED_SUPPLIERS } from "@/fixtures/suppliers";
import { IconArrow, IconLock } from "../icons";
import { exampleResponse, sampleText } from "./examples";

/** Pick lines verbatim from the synthetic sample so the hero never drifts from the product. */
function line(text: string, startsWith: string): string {
  return text.split("\n").find((l) => l.trim().startsWith(startsWith))?.trim() ?? "";
}

export function Hero() {
  const text = sampleText("substituted-account");
  const northwind = TRUSTED_SUPPLIERS.find((s) => s.id === "sup_northwind")!;
  const critical = exampleResponse("substituted-account").result.findings.filter((f) => f.severity === "critical").length;
  const rows: { text: string; note?: { tone: "hold" | "muted"; label: string; detail: string } }[] = [
    { text: line(text, "From:"), note: { tone: "hold", label: "Lookalike domain", detail: `registered: @${northwind.senderDomains[0]}` } },
    { text: line(text, "Subject:") },
    { text: "Following our recent banking migration, we have updated our bank details. …", note: { tone: "muted", label: "Payment-change language", detail: "context, not proof" } },
    { text: line(text, "Amount due:") },
    { text: line(text, "Beneficiary:"), note: { tone: "hold", label: "Different account holder", detail: `registered: ${northwind.beneficiaryName}` } },
    { text: line(text, "IBAN:"), note: { tone: "hold", label: "Account ≠ registered", detail: northwind.account.value } },
  ];

  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* Fine ledger grid — the only background ornament. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(to_right,var(--color-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-line)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-[1240px] gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:pb-24 lg:pt-20">
        <div className="flex flex-col justify-center">
          <p className="animate-rise font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
            Pre-payment verification · {`ForgeHacks 2026`}
          </p>
          <h1 className="animate-rise mt-5 font-display text-[44px] leading-[1.02] tracking-[-0.01em] text-ink [animation-delay:60ms] sm:text-[60px] lg:text-[68px]">
            Catch the payment fraud hiding in <em className="italic text-hold">plain sight.</em>
          </h1>
          <p className="animate-rise mt-6 max-w-[34rem] text-[17px] leading-relaxed text-ink-2 [animation-delay:120ms]">
            ProofPay uses AI to extract payment details, compare them against trusted supplier records, and surface
            suspicious changes before money moves.
          </p>
          <div className="animate-rise mt-8 flex flex-wrap items-center gap-3 [animation-delay:180ms]">
            <Link
              href="/app"
              className="group inline-flex h-11 items-center gap-2 rounded-md bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-ink-2"
            >
              Try Live Demo
              <IconArrow className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how"
              className="inline-flex h-11 items-center rounded-md border border-line-strong bg-surface px-5 text-sm font-medium text-ink transition-colors hover:bg-sunken"
            >
              Explore How It Works
            </a>
          </div>
          <p className="animate-rise mt-6 text-xs text-ink-3 [animation-delay:240ms]">
            Prototype · synthetic supplier records · simulated payments only
          </p>
        </div>

        {/* The annotated invoice */}
        <figure className="animate-rise relative [animation-delay:140ms]" aria-label="Example: a payment request annotated by ProofPay">
          <div className="rounded-lg border border-line bg-surface shadow-[0_1px_0_rgba(0,0,0,0.03),0_24px_48px_-24px_rgba(23,24,26,0.18)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">Incoming payment request</span>
              <span className="font-mono text-[11px] text-ink-4">synthetic</span>
            </div>
            <ol className="divide-y divide-line/70">
              {rows.map((r) => (
                <li key={r.text} className="grid gap-x-4 gap-y-1.5 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,13rem)] sm:items-center">
                  <p
                    className={`break-words font-mono text-[12.5px] leading-relaxed ${r.note?.tone === "hold" ? "text-ink decoration-hold/70 decoration-wavy decoration-1 underline-offset-4 [text-decoration-line:underline]" : "text-ink-2"}`}
                  >
                    {r.text}
                  </p>
                  {r.note && (
                    <p className={`border-l-2 pl-3 text-[12px] leading-snug ${r.note.tone === "hold" ? "border-hold" : "border-line-strong"}`}>
                      <span className={`block font-medium ${r.note.tone === "hold" ? "text-hold" : "text-ink-2"}`}>{r.note.label}</span>
                      <span className="block break-words font-mono text-[11px] text-ink-3">{r.note.detail}</span>
                    </p>
                  )}
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hold-line bg-hold-soft px-5 py-3.5">
              <span className="flex items-center gap-2 text-sm font-semibold text-hold">
                <IconLock className="size-4" /> Payment held
              </span>
              <span className="text-[12px] text-ink-2">{critical} critical mismatches with the trusted record</span>
            </div>
          </div>
          <figcaption className="mt-3 text-[11px] text-ink-3">
            The “Changed bank details” sample from the demo, as ProofPay’s rules flag it. Synthetic data.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
