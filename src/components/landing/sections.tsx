import Link from "next/link";
import { TRUSTED_SUPPLIERS } from "@/fixtures/suppliers";
import { SITE } from "@/site";
import { IconGitHub, IconLock, LogoLockup } from "../icons";
import { SplitField } from "./split-field";

/* ------------------------------------------------------------------ Problem */

/** Evaluation case S4 (synthetic): an otherwise genuine invoice with two IBAN digits swapped. */
export function Problem() {
  const nw = TRUSTED_SUPPLIERS.find((s) => s.id === "sup_northwind")!;
  const registered = nw.account.value; // GB82 WEST 1234 5698 7654 32
  const invoiceIban = registered.replace(/32$/, "23");
  const head = invoiceIban.slice(0, -2);
  const tail = invoiceIban.slice(-2);

  return (
    <section aria-labelledby="problem-h" className="bg-paper">
      <div className="mx-auto grid max-w-[1320px] grid-cols-[minmax(0,1fr)] items-center gap-16 px-5 py-28 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-36">
        <div>
          <h2 id="problem-h" className="text-[40px] font-semibold leading-[1.02] tracking-[-0.04em] text-ink sm:text-[56px]">
            An invoice can be right in every way but one.
          </h2>
          <p className="mt-6 max-w-[30rem] text-[17px] leading-[1.6] text-ink-3">
            Same supplier, same format, same amount. Only the account the money goes to has changed, and that is the
            line nobody rereads.
          </p>
        </div>

        <figure className="relative" aria-label="Synthetic invoice with a changed account number">
          <div className="rounded-[20px] bg-white p-7 shadow-[0_1px_0_rgba(10,20,40,0.04),0_30px_60px_-30px_rgba(10,20,40,0.25)] ring-1 ring-black/5 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[18px] font-semibold tracking-[-0.02em]">{nw.legalName}</p>
                <p className="mt-1 text-[13px] text-ink-3">@{nw.senderDomains[0]}</p>
              </div>
              <div className="text-right">
                <p className="text-[13px] text-ink-3">Invoice</p>
                <p className="font-mono text-[14px]">NWP-2026-0458</p>
              </div>
            </div>
            <div className="mt-8 flex items-baseline justify-between border-y border-line py-4 text-[15px]">
              <span>October cartons</span>
              <span className="font-mono">GBP 5,140.00</span>
            </div>
            <dl className="mt-6 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-y-3 text-[14px]">
              <dt className="text-ink-3">Pay to</dt>
              <dd>{nw.beneficiaryName}</dd>
              <dt className="text-ink-3">Bank</dt>
              <dd>{nw.account.bankName}</dd>
              <dt className="text-ink-3">IBAN</dt>
              <dd className="break-all font-mono text-[15px]">
                {head}
                <mark className="rounded-[4px] bg-[#c2362c] px-0.5 text-white">{tail}</mark>
              </dd>
            </dl>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl bg-abyss px-5 py-4 text-[13px] text-white sm:ml-16">
            <span className="inline-flex items-center gap-2 font-semibold text-[#ff8a80]">
              <IconLock className="size-4" /> Held by ProofPay
            </span>
            <span className="text-white/70">
              Your record ends <span className="font-mono text-white">{registered.slice(-7)}</span>
            </span>
          </div>
          <figcaption className="mt-3 text-[12px] text-ink-4 sm:ml-16">Synthetic invoice from the ProofPay evaluation set.</figcaption>
        </figure>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- How it works */

const STEPS = [
  { title: "Extract", body: "AI reads the request and quotes the payee, account, and amount word for word.", who: "AI", token: "GB33 HRBR 6016 1331…" },
  { title: "Reference", body: "Your trusted supplier records, set up when you onboarded them, are the source of truth.", who: "Records", token: "GB82 WEST 1234 5698…" },
  { title: "Verify", body: "Deterministic rules check every quote against the record and keep the evidence.", who: "Rules", token: "account ≠ record" },
  { title: "Hold", body: "A mismatch is held in a simulated approval step until someone confirms it.", who: "Rules", token: "release locked" },
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-h" className="relative overflow-hidden bg-abyss text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 [background:radial-gradient(40%_60%_at_0%_100%,rgb(31_179_154/0.35),transparent_70%),radial-gradient(35%_50%_at_100%_0%,rgb(58_109_240/0.35),transparent_70%)]" />
      <div className="relative mx-auto max-w-[1320px] px-5 py-28 sm:px-8 lg:py-36">
        <h2 id="how-h" className="max-w-[18ch] text-[40px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[56px]">
          Four steps between a request and a payment.
        </h2>

        <ol className="relative mt-20 grid gap-12 lg:grid-cols-4 lg:gap-8">
          {/* The track the request travels along */}
          <div aria-hidden className="absolute left-0 right-0 top-[11px] hidden h-px bg-gradient-to-r from-cyan/70 via-white/25 to-[#ff8a80]/70 lg:block" />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <span
                className={`relative z-10 grid size-6 place-items-center rounded-full text-[11px] font-semibold ${
                  s.who === "AI" ? "bg-cyan text-abyss" : i === 3 ? "bg-[#ff8a80] text-abyss" : "bg-white text-abyss"
                }`}
              >
                {i + 1}
              </span>
              <div className="mt-6 flex items-baseline gap-3">
                <h3 className="text-[24px] font-semibold tracking-[-0.03em]">{s.title}</h3>
                <span className={`text-[12px] ${s.who === "AI" ? "text-cyan" : "text-white/50"}`}>{s.who}</span>
              </div>
              <p className="mt-3 max-w-[30ch] text-[15px] leading-[1.6] text-white/65">{s.body}</p>
              <p className="mt-5 inline-block rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 font-mono text-[12px] text-white/80">
                {s.token}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-16 max-w-[52ch] text-[14px] leading-[1.6] text-white/50">
          Only the first step uses AI, and it never sees the verdict. Text hidden inside an invoice can’t talk its way
          past the rules.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- AI reads, rules decide */

const AI_DOES = [
  ["Reads any format", "Emails, forwarded threads, invoice tables, chat messages."],
  ["Quotes its evidence", "Every value comes with the exact words it was taken from."],
  ["Treats the invoice as data", "Instructions aimed at AI tools are flagged as findings."],
];
const RULES_DECIDE = [
  ["Trusted supplier comparison", "Account, payee, bank, and sender checked against your record."],
  ["Grounded or discarded", "A value that isn’t in the text is thrown away, not trusted."],
  ["Lookalike senders", "Swapped letters, extra words, and other domain endings are caught."],
  ["Evidence for every finding", "The request’s value next to the record’s value, with its source."],
  ["Simulated payment holds", "Held requests stay locked; unclear ones need a reviewer note."],
];

export function Capabilities() {
  return (
    <section id="capabilities" aria-labelledby="cap-h" className="bg-paper">
      <div className="mx-auto max-w-[1320px] px-5 py-28 sm:px-8 lg:py-36">
        <h2 id="cap-h" className="max-w-[16ch] text-[40px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[56px]">
          The AI reads. The rules decide.
        </h2>
        <div className="mt-16 grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <div className="rounded-3xl bg-abyss p-8 text-white sm:p-10">
            <p className="text-[14px] text-cyan">What the AI does</p>
            <ul className="mt-8 space-y-7">
              {AI_DOES.map(([t, d]) => (
                <li key={t}>
                  <p className="text-[19px] font-medium tracking-[-0.02em]">{t}</p>
                  <p className="mt-1.5 text-[14px] leading-[1.6] text-white/60">{d}</p>
                </li>
              ))}
            </ul>
          </div>
          {/* Offset from the AI panel, like the halves of the mark. */}
          <div className="rounded-3xl bg-white p-8 ring-1 ring-black/5 sm:p-10 lg:mt-14">
            <p className="text-[14px] text-teal">What the rules decide</p>
            <ul className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
              {RULES_DECIDE.map(([t, d]) => (
                <li key={t}>
                  <p className="text-[19px] font-medium tracking-[-0.02em]">{t}</p>
                  <p className="mt-1.5 text-[14px] leading-[1.6] text-ink-3">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-12 max-w-[64ch] text-[13px] leading-[1.6] text-ink-4">
          ProofPay doesn’t check email authentication or confirm account ownership with a bank. A clean result means no
          mismatch against your records, not a guarantee.
        </p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- Closing + footer */

export function Closing() {
  return (
    <section aria-labelledby="cta-h" className="relative overflow-hidden bg-abyss text-white">
      <SplitField split={0.55} />
      <div className="relative z-10 mx-auto max-w-[1320px] px-5 pb-16 pt-32 sm:px-8 lg:pt-44">
        <h2 id="cta-h" className="text-[44px] font-semibold leading-[0.98] tracking-[-0.045em] sm:text-[72px] lg:text-[88px]">
          <span className="block">Know what you’re paying.</span>
          <span className="block text-white/75 sm:pl-[0.9em]">Before you pay.</span>
        </h2>
        <Link
          href="/app"
          className="mt-12 inline-flex h-12 items-center rounded-full bg-white px-7 text-[15px] font-medium text-abyss shadow-[0_10px_30px_-10px_rgba(63,208,224,0.6)] transition-[background-color,transform] hover:-translate-y-px hover:bg-white/95 focus-visible:outline-white"
        >
          Launch Interactive Demo
        </Link>

        <footer className="mt-32 border-t border-white/15 pt-8 lg:mt-44">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <Link href="/" aria-label="ProofPay home" className="rounded-md">
              <LogoLockup reversed />
            </Link>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-2 text-[14px] text-white/70">
              <Link href="/app" className="hover:text-white">Demo</Link>
              <Link href="/suppliers" className="hover:text-white">Trusted records</Link>
              <a href="#how" className="hover:text-white">How it works</a>
              {SITE.githubUrl && (
                <a href={SITE.githubUrl} className="inline-flex items-center gap-1.5 hover:text-white">
                  <IconGitHub className="size-4" /> GitHub
                </a>
              )}
            </nav>
          </div>
          <p className="mt-6 max-w-[70ch] text-[12px] leading-[1.6] text-white/45">
            Built for {SITE.hackathon}, {SITE.track} track. A prototype using synthetic supplier records and simulated
            payments. It is not connected to any bank, and no money moves.
          </p>
        </footer>
      </div>
    </section>
  );
}
