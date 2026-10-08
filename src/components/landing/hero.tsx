import Link from "next/link";
import { formatAmount } from "@/domain/normalize";
import { TRUSTED_SUPPLIERS } from "@/fixtures/suppliers";
import { IconLock, LogoLockup } from "../icons";
import { exampleResponse } from "./examples";
import { SplitField } from "./split-field";

function Nav() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-8 px-5 sm:px-8">
        <Link href="/" aria-label="ProofPay home" className="rounded-md">
          <LogoLockup reversed />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-7 text-[14px] text-white/70 md:flex">
          <a href="#how" className="transition-colors hover:text-white">How it works</a>
          <a href="#product" className="transition-colors hover:text-white">Product</a>
          <Link href="/suppliers" className="transition-colors hover:text-white">Trusted records</Link>
        </nav>
        <Link
          href="/app"
          className="ml-auto inline-flex h-9 items-center rounded-full bg-white px-4 text-[13px] font-medium text-abyss transition-[background-color,transform] hover:bg-white/90 active:scale-[0.98] focus-visible:outline-white"
        >
          Try ProofPay
        </Link>
      </div>
    </header>
  );
}

export function Hero() {
  const ex = exampleResponse("substituted-account");
  const x = ex.extraction;
  const record = TRUSTED_SUPPLIERS.find((s) => s.id === "sup_northwind")!;
  const row = (f: string) => ex.result.comparisons.find((c) => c.field === f)!;
  const amount = x.amount.value ? formatAmount(x.amount.value, x.currency.value) : "";
  const rows = [row("senderEmail"), row("beneficiaryName"), row("accountIdentifier")];

  return (
    <section className="relative overflow-hidden bg-abyss text-white">
      <SplitField split={0.64} />
      <Nav />

      <div className="relative z-10 mx-auto grid max-w-[1320px] grid-cols-[minmax(0,1fr)] gap-14 px-5 pb-24 pt-14 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:pb-36 lg:pt-24">
        <div>
          <h1 className="animate-rise text-[44px] font-semibold leading-[0.96] tracking-[-0.045em] sm:text-[64px] lg:text-[82px]">
            <span className="block">Catch the payment fraud</span>
            {/* The second line sits out of line with the first: the brand's split. */}
            <span className="block text-white/80 sm:pl-[0.9em]">hiding in plain sight.</span>
          </h1>
          <p className="animate-rise mt-8 max-w-[34rem] text-[17px] leading-[1.6] text-white/70 [animation-delay:100ms] sm:text-[18px]">
            ProofPay uses AI to analyze payment requests, compare them with trusted supplier records, and reveal
            suspicious changes before money moves.
          </p>
          <div className="animate-rise mt-10 flex flex-wrap items-center gap-3 [animation-delay:180ms]">
            <Link
              href="/app"
              className="inline-flex h-12 items-center rounded-full bg-white px-7 text-[15px] font-medium text-abyss shadow-[0_10px_30px_-10px_rgba(63,208,224,0.6)] transition-[background-color,transform,box-shadow] hover:-translate-y-px hover:bg-white/95 hover:shadow-[0_16px_40px_-12px_rgba(63,208,224,0.75)] focus-visible:outline-white"
            >
              Try ProofPay
            </Link>
            <a
              href="#how"
              className="inline-flex h-12 items-center rounded-full border border-white/25 px-6 text-[15px] font-medium text-white/90 transition-colors hover:border-white/50 hover:bg-white/5 focus-visible:outline-white"
            >
              See how it works
            </a>
          </div>
          <p className="animate-rise mt-8 text-[13px] text-white/45 [animation-delay:240ms]">
            Hackathon prototype with synthetic data. Payments are simulated.
          </p>
        </div>

        {/* Request vs. record: the product's whole idea in one composition. */}
        <figure
          className="relative mx-auto w-full max-w-[520px] lg:mt-6 lg:h-[500px]"
          aria-label="Example: an incoming request compared with the trusted record"
        >
          <div className="animate-rise rounded-2xl border border-white/15 bg-white/[0.07] p-5 text-white backdrop-blur-md [animation-delay:200ms] lg:absolute lg:right-0 lg:top-0 lg:w-[330px]">
            <p className="text-[12px] text-white/55">Your trusted record</p>
            <p className="mt-1 text-[15px] font-medium">{record.legalName}</p>
            <dl className="mt-4 space-y-2.5 text-[12.5px]">
              <div>
                <dt className="text-white/45">Account</dt>
                <dd className="font-mono text-white">{record.account.value}</dd>
              </div>
              <div>
                <dt className="text-white/45">Payee</dt>
                <dd>{record.beneficiaryName}</dd>
              </div>
            </dl>
            <p className="mt-4 text-[11px] text-white/40">Synthetic record, confirmed by call-back {record.lastConfirmed}</p>
          </div>

          <div className="animate-rise relative mt-4 overflow-hidden rounded-2xl bg-white text-ink shadow-[0_40px_80px_-30px_rgba(5,10,25,0.8)] [animation-delay:320ms] lg:absolute lg:bottom-0 lg:left-0 lg:mt-0 lg:w-[420px]">
            <div className="px-5 pb-3 pt-5">
              <p className="text-[12px] text-ink-3">Incoming payment request</p>
              <p className="mt-1 text-[15px] font-medium">
                {x.invoiceId.value} <span className="font-normal text-ink-3">for</span> {amount}
              </p>
            </div>
            <ul className="border-t border-line text-[12.5px]">
              {rows.map((r, i) => (
                <li
                  key={r.field}
                  className="row-in grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 border-b border-line px-5 py-3"
                  style={{ animationDelay: `${700 + i * 220}ms` }}
                >
                  <span className="text-ink-3">{r.label}</span>
                  <span className="min-w-0">
                    <span className="block break-words font-mono text-[#c2362c]">{r.observed?.value}</span>
                    <span className="mt-0.5 block break-words font-mono text-[11px] text-ink-4">≠ {r.expected?.value}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="verdict-in flex items-center gap-3 bg-[#c2362c] px-5 py-3.5 text-white">
              <IconLock className="size-4" />
              <span className="text-[14px] font-semibold">Payment held</span>
              <span className="ml-auto text-[12px] text-white/80">Simulated release locked</span>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
