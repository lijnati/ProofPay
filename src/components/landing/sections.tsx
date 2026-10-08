import Link from "next/link";
import { TRUSTED_SUPPLIERS } from "@/fixtures/suppliers";
import { SITE } from "@/site";
import { IconArrow, IconCheck, IconGitHub, IconLock, IconX, Logo } from "../icons";

/* ------------------------------------------------------------------ Problem */

/** Character-level comparison: differing characters are marked, nothing hidden. */
function IbanDiff({ observed, expected }: { observed: string; expected: string }) {
  return (
    <div className="grid gap-3 font-mono text-[18px] tracking-[0.06em] sm:text-[22px]">
      <div>
        <p className="mb-1 font-sans text-[11px] uppercase tracking-[0.14em] text-ink-3">Invoice says</p>
        <p className="break-all" aria-label={observed}>
          {observed.split("").map((c, i) => (
            <span key={i} className={c !== expected[i] ? "rounded-[3px] bg-hold px-[1px] text-white" : "text-ink"}>
              {c}
            </span>
          ))}
        </p>
      </div>
      <div>
        <p className="mb-1 font-sans text-[11px] uppercase tracking-[0.14em] text-ink-3">You verified</p>
        <p className="break-all text-ink-3">{expected}</p>
      </div>
    </div>
  );
}

export function Problem() {
  const registered = TRUSTED_SUPPLIERS.find((s) => s.id === "sup_northwind")!.account.value;
  // Evaluation case S4: two digits swapped at the end of the registered IBAN.
  const swapped = registered.replace(/32$/, "23");
  const checks = ["The supplier looks familiar.", "The invoice looks legitimate.", "The amount looks right."];
  return (
    <section aria-labelledby="problem-h" className="border-b border-line">
      <div className="mx-auto grid max-w-[1240px] gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:py-28">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">The problem</p>
          <h2 id="problem-h" className="sr-only">
            Why invoice payment fraud works
          </h2>
          <ul className="mt-6 space-y-3">
            {checks.map((c) => (
              <li key={c} className="flex items-baseline gap-3 font-display text-[30px] leading-tight text-ink-3 sm:text-[38px]">
                <IconCheck className="size-5 shrink-0 translate-y-[-2px] text-clear" />
                {c}
              </li>
            ))}
            <li className="flex items-baseline gap-3 pt-2 font-display text-[30px] leading-tight text-ink sm:text-[38px]">
              <IconX className="size-5 shrink-0 translate-y-[-2px] text-hold" />
              <span>
                But the payment destination <em className="italic text-hold">has changed.</em>
              </span>
            </li>
          </ul>
          <p className="mt-8 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">
            Payment-redirection fraud changes one line of an otherwise genuine request. Often it’s sent from a
            lookalike domain, or from the supplier’s own compromised mailbox. Fluent, AI-written text removes the old
            warning signs.
          </p>
        </div>

        <div className="flex flex-col justify-center">
          <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">
            <p className="text-[13px] font-medium text-ink-2">Would you spot it?</p>
            <div className="mt-5">
              <IbanDiff observed={swapped} expected={registered} />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <span className="flex items-center gap-2 text-sm font-semibold text-hold">
                <IconLock className="size-4" /> ProofPay: payment held
              </span>
              <span className="text-[12px] text-ink-3">Two swapped digits · evaluation case S4 (synthetic)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- How it works */

const STEPS = [
  {
    n: "01",
    title: "Extract",
    body: "AI reads the payment request and identifies the supplier, payee, account, amount, and sender, quoting each one.",
    artifact: ['account: "GB33 HRBR 6016 1331 9268 19"', 'quote:   "IBAN: GB33 HRBR 6016…"'],
    ai: true,
  },
  {
    n: "02",
    title: "Compare",
    body: "Every quote is checked against the original text, then compared with the supplier record you registered earlier.",
    artifact: ["GB33 HRBR 6016 1331 9268 19", "≠ GB82 WEST 1234 5698 7654 32"],
  },
  {
    n: "03",
    title: "Explain",
    body: "Independent verification rules flag each inconsistency and show the request value next to the trusted value.",
    artifact: ["ACCOUNT_MISMATCH · critical", "BENEFICIARY_MISMATCH · critical"],
  },
  {
    n: "04",
    title: "Protect",
    body: "Suspicious requests are held in a simulated approval workflow. Release is locked; the next step is calling the supplier on a number you already have.",
    artifact: ["verdict: HOLD", "release: locked (simulation)"],
  },
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-h" className="border-b border-line bg-surface">
      <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">How it works</p>
            <h2 id="how-h" className="mt-3 font-display text-[36px] leading-[1.05] sm:text-[46px]">
              AI reads. <em className="italic">Rules decide.</em>
            </h2>
          </div>
          <p className="max-w-[48ch] text-[15px] leading-relaxed text-ink-2 lg:justify-self-end">
            The model only handles step 01. It never sees the verdict, so text inside an invoice can’t talk its way
            past the checks in steps 02–04.
          </p>
        </div>

        <ol className="mt-14 grid border-t border-ink lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className={`relative flex flex-col gap-4 border-b border-line py-7 lg:border-b-0 lg:py-8 ${i > 0 ? "lg:border-l lg:pl-7" : ""} ${i < 3 ? "lg:pr-7" : ""}`}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[12px] text-ink-3">{s.n}</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${s.ai ? "bg-review-soft text-review" : "bg-clear-soft text-clear"}`}
                >
                  {s.ai ? "AI · untrusted" : "Deterministic code"}
                </span>
              </div>
              <h3 className="font-display text-[30px] leading-none">{s.title}</h3>
              <p className="text-[14px] leading-relaxed text-ink-2">{s.body}</p>
              <div className="mt-auto rounded-md border border-line bg-canvas px-3 py-2.5 font-mono text-[11px] leading-relaxed text-ink-2">
                {s.artifact.map((a) => (
                  <p key={a} className={`break-words ${a.startsWith("≠") || a.includes("critical") || a.includes("HOLD") ? "text-hold" : ""}`}>
                    {a}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Capabilities */

const AI_CAPS = [
  ["Structured extraction", "A typed schema: supplier, sender, invoice, amount, currency, payee, account, bank. No verdict field exists."],
  ["Quoted evidence", "Each value comes with a word-for-word quote from the request."],
  ["Prompt-injection aware", "The request is treated as data. Instructions aimed at AI tools are flagged as findings and can’t change the verdict."],
];
const CODE_CAPS = [
  ["Evidence grounding", "Quotes must exist in the source and contain the value as a whole token. Anything else is discarded."],
  ["Trusted supplier matching", "Identity comes from registered names. Ambiguous or unknown suppliers go to review."],
  ["Account mismatch detection", "Any destination that isn’t the registered account is held, even one the AI missed."],
  ["Beneficiary verification", "The labelled payee is compared with the registered account holder."],
  ["Lookalike sender domains", "Extra words, swapped characters, and other TLDs are caught. Claimed senders are never treated as authenticated."],
  ["Simulated payment holds", "HOLD locks release. REVIEW needs a reviewer note and independent confirmation."],
];

export function Capabilities() {
  return (
    <section id="capabilities" aria-labelledby="cap-h" className="border-b border-line">
      <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6 lg:py-28">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">Capabilities</p>
        <h2 id="cap-h" className="mt-3 max-w-[24ch] font-display text-[36px] leading-[1.05] sm:text-[46px]">
          Built so the attacker’s text can’t make the decision.
        </h2>

        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="bg-surface p-6 sm:p-8">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-review">
              <span className="size-1.5 rounded-full bg-review" /> What the AI does
            </p>
            <dl className="mt-6 divide-y divide-line">
              {AI_CAPS.map(([t, d]) => (
                <div key={t} className="py-4 first:pt-0">
                  <dt className="text-[15px] font-medium">{t}</dt>
                  <dd className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="bg-surface p-6 sm:p-8">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-clear">
              <span className="size-1.5 rounded-full bg-clear" /> What deterministic code decides
            </p>
            <dl className="mt-6 grid gap-x-8 sm:grid-cols-2">
              {CODE_CAPS.map(([t, d]) => (
                <div key={t} className="border-b border-line py-4 sm:[&:nth-last-child(-n+2)]:border-b-0">
                  <dt className="text-[15px] font-medium">{t}</dt>
                  <dd className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-6 grid gap-4 text-[13px] text-ink-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-baseline">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">Honest limits</p>
          <p className="leading-relaxed">
            ProofPay compares requests with records you already trust. It does not check email authentication
            (SPF/DKIM), does not contact banks to confirm account ownership, and cannot guarantee a request is
            legitimate. A clean result reads “No mismatch against registered records”, never “safe”.
          </p>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Final CTA */

export function FinalCta() {
  return (
    <section aria-labelledby="cta-h" className="bg-ink text-white">
      <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-8 px-4 py-20 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:py-24">
        <div>
          <h2 id="cta-h" className="font-display text-[40px] leading-[1.02] sm:text-[56px]">
            Know what you’re paying.
            <br />
            <em className="italic text-[#e0705f]">Before you pay.</em>
          </h2>
          <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-white/70">
            See how evidence-backed verification can reveal suspicious payment changes.
          </p>
        </div>
        <Link
          href="/app"
          className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-md bg-white px-6 text-sm font-medium text-ink transition-colors hover:bg-white/90 focus-visible:outline-white"
        >
          Launch Interactive Demo
          <IconArrow className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Footer */

export function Footer() {
  return (
    <footer className="bg-canvas">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-4 py-12 text-[13px] sm:px-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="max-w-[56ch]">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
            <Logo className="size-5" /> ProofPay
          </Link>
          <p className="mt-3 leading-relaxed text-ink-3">
            Prototype built for {SITE.hackathon} · {SITE.track} track. ProofPay currently uses synthetic supplier
            records and simulated payment actions. It is not connected to any bank, and no money moves.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-start gap-x-6 gap-y-2 text-ink-2">
          <Link href="/app" className="hover:text-ink">Demo</Link>
          <Link href="/suppliers" className="hover:text-ink">Trusted records</Link>
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#capabilities" className="hover:text-ink">Features</a>
          {SITE.githubUrl && (
            <a href={SITE.githubUrl} className="inline-flex items-center gap-1.5 hover:text-ink">
              <IconGitHub className="size-4" /> GitHub
            </a>
          )}
        </nav>
      </div>
    </footer>
  );
}
