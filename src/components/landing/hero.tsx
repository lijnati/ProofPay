import Link from "next/link";
import { formatAmount } from "@/domain/normalize";
import { IconLock, LogoLockup } from "../icons";
import { exampleResponse, sampleText } from "./examples";
import { FRAME, GRID } from "./grid";


export function Nav() {
  return (
    <header className="border-b border-rule">
      <div className={`${FRAME} flex h-16 items-center gap-8`}>
        <Link href="/" aria-label="ProofPay home" className="rounded-md">
          <LogoLockup />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-7 whitespace-nowrap text-[14px] text-graphite lg:flex">
          <a href="#problem" className="transition-colors hover:text-ink">The problem</a>
          <a href="#how" className="transition-colors hover:text-ink">How it works</a>
          <a href="#product" className="transition-colors hover:text-ink">Product</a>
          <Link href="/suppliers" className="transition-colors hover:text-ink">Trusted records</Link>
        </nav>
        <Link
          href="/app"
          className="ml-auto inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-md bg-ink px-4 text-[14px] font-medium text-paper transition-[background-color,transform] hover:bg-cobalt active:scale-[0.98]"
        >
          Open the demo
        </Link>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="hero-h" className={`${FRAME} pb-20 pt-12 sm:pt-16 lg:pb-28 lg:pt-20`}>
      <h1
        id="hero-h"
        className="animate-rise text-[clamp(2.75rem,8.6vw,7.75rem)] font-semibold leading-[0.92] tracking-[-0.055em] text-ink"
      >
        <span className="block">One changed account.</span>
        <span className="block">One costly mistake.</span>
      </h1>

      <div className={`${GRID} mt-12 gap-y-14 border-t border-ink pt-8 lg:mt-16`}>
        <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:pr-6">
          <p className="max-w-[36ch] text-[19px] leading-[1.5] text-ink sm:text-[21px]">
            ProofPay reads a payment request, checks the payee and account against the supplier records you already
            trust, and holds the payment when they don’t match.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/app"
              className="inline-flex h-12 items-center rounded-md bg-ink px-6 text-[15px] font-medium text-paper transition-[background-color,transform] hover:bg-cobalt active:scale-[0.98]"
            >
              Open the demo
            </Link>
            <a
              href="#how"
              className="text-[15px] font-medium text-ink underline decoration-rule decoration-2 underline-offset-[6px] transition-colors hover:decoration-ink"
            >
              How it works
            </a>
          </div>
          <p className="mt-10 max-w-[40ch] border-t border-rule pt-4 text-[13px] leading-[1.55] text-graphite">
            A hackathon prototype. Suppliers and requests are synthetic, payments are simulated, and nothing connects to
            a bank.
          </p>
        </div>

        <div className="col-span-4 md:col-span-8 lg:col-span-8">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- Product preview */

const ROW_FIELDS = ["senderEmail", "beneficiaryName", "bankName", "accountIdentifier"] as const;
const REQUEST_LINES = /^(From|Subject|Amount due|Beneficiary|Bank|IBAN):/;

/**
 * A compact rendering of the real engine result for the synthetic
 * "substituted account" sample. Every value below comes from verifyRequest.
 */
function HeroPreview() {
  const ex = exampleResponse("substituted-account");
  const { result, extraction: x } = ex;
  const rows = ROW_FIELDS.map((f) => result.comparisons.find((c) => c.field === f)!);
  const critical = result.findings.filter((f) => f.severity === "critical").length;
  const amount = x.amount.value ? formatAmount(x.amount.value, x.currency.value) : "";
  const excerpts = new Set(rows.map((r) => r.observed?.excerpt).filter(Boolean));
  const lines = sampleText("substituted-account")
    .split("\n")
    .filter((l) => REQUEST_LINES.test(l));

  return (
    <figure
      aria-label="Example result: a synthetic payment request compared with the trusted supplier record"
      className="overflow-hidden rounded-[10px] border border-ink/80 bg-surface shadow-[12px_12px_0_0_var(--color-paper-2)]"
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-rule px-5 py-3.5 sm:px-6">
        <p className="text-[14px] font-semibold tracking-[-0.01em]">
          Invoice {x.invoiceId.value}
        </p>
        <p className="font-mono text-[13px] text-graphite">{amount}</p>
        <p className="ml-auto text-[12px] text-graphite">Synthetic example, stored extraction</p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* The request as received; cobalt marks what extraction quoted. */}
        <div className="hidden border-r border-rule bg-paper/60 px-6 py-5 lg:block">
          <p className="text-[12px] text-graphite">As received</p>
          <ul className="mt-3 space-y-2 font-mono text-[11.5px] leading-[1.55] text-ink">
            {lines.map((l) => (
              <li key={l} className="break-words">
                {excerpts.has(l) ? (
                  <span className="underline decoration-cobalt decoration-[1.5px] underline-offset-[3px]">{l}</span>
                ) : (
                  l
                )}
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-center gap-2 text-[12px] text-cobalt">
            <span aria-hidden className="h-[1.5px] w-4 bg-cobalt" />
            Quoted by AI extraction
          </p>
        </div>

        <div className="min-w-0 px-5 py-5 sm:px-6">
          <div className="flex items-baseline justify-between gap-4 text-[12px] text-graphite">
            <p>Compared with trusted record</p>
            <p className="hidden sm:block">{result.matchedSupplier?.legalName}</p>
          </div>
          <ul className="mt-3 border-t border-rule">
            {rows.map((r, i) => (
              <li
                key={r.field}
                className="row-in grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b border-rule py-3 sm:grid-cols-[7rem_minmax(0,1fr)_auto]"
                style={{ animationDelay: `${450 + i * 180}ms` }}
              >
                <span className="text-[13px] text-graphite">{r.label}</span>
                <span className="col-span-2 row-start-2 min-w-0 font-mono text-[12.5px] leading-[1.45] sm:col-span-1 sm:row-start-auto">
                  <span className="block break-words text-ink">{r.observed?.value}</span>
                  <span className="mt-1 block break-words text-graphite">
                    <span className="font-sans text-[11.5px]">Record </span>
                    {r.expected?.value}
                  </span>
                </span>
                <span className="text-[12px] font-medium text-hold">
                  {r.status === "mismatch" ? "Differs" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="verdict-in flex flex-wrap items-center gap-x-4 gap-y-1 bg-hold px-5 py-4 text-white sm:px-6">
        <IconLock className="size-[18px]" />
        <p className="text-[15px] font-semibold">Hold</p>
        <p className="text-[13.5px] text-white/85">
          {critical} critical mismatches with registered records
        </p>
        <p className="w-full text-[12.5px] text-white/75 sm:ml-auto sm:w-auto">Simulated release locked</p>
      </div>
    </figure>
  );
}
