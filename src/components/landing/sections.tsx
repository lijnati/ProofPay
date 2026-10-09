import Link from "next/link";
import { TRUSTED_SUPPLIERS } from "@/fixtures/suppliers";
import { SITE } from "@/site";
import { IconGitHub, IconLock, LogoLockup } from "../icons";
import { exampleResponse, sampleText } from "./examples";
import { FRAME, GRID } from "./grid";

const H2 = "text-balance text-[clamp(2.25rem,4.6vw,4rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-ink";

/* ------------------------------------------------------------------ Problem */

/** Margin notes keyed to lines of the synthetic "substituted account" email. */
const NOTES: { match: string[]; note: string }[] = [
  {
    match: ["From:"],
    note: "A lookalike sender. The supplier’s registered domain is northwind‑packaging.example; this one adds “‑billing”.",
  },
  { match: ["Subject:"], note: "The pretext. New bank details, announced as routine housekeeping." },
  { match: ["Due: today"], note: "A deadline, so nobody stops to check." },
  { match: ["Beneficiary:", "Bank:", "IBAN:"], note: "A different account holder, at a different bank, with a new account number." },
  { match: ["unable to take calls"], note: "It rules out the call-back, the one step that would expose the change." },
];

export function Problem() {
  const lines = sampleText("substituted-account").split("\n");
  const noteFor = (line: string) => NOTES.findIndex((n) => n.match.some((m) => line.includes(m)));

  return (
    <section id="problem" aria-labelledby="problem-h" className="border-t border-rule">
      <div className={`${FRAME} ${GRID} gap-y-12 py-24 lg:py-32`}>
        <div className="col-span-4 md:col-span-8 lg:col-span-4">
          <div className="lg:sticky lg:top-12">
            <h2 id="problem-h" className={H2}>
              Payment redirection starts with an ordinary email.
            </h2>
            <p className="mt-6 max-w-[38ch] text-[17px] leading-[1.6] text-graphite">
              The attacker copies a real supplier’s invoice, changes where the money goes, and adds reasons not to
              check. Everything looks familiar except the one line that decides where the money lands.
            </p>
            <p className="mt-6 text-[13px] text-graphite">A synthetic request from the ProofPay demo set.</p>
          </div>
        </div>

        <figure
          aria-label="Annotated synthetic payment request"
          className="col-span-4 md:col-span-8 lg:col-span-7 lg:col-start-6"
        >
          <div className="rounded-[10px] border border-ink/80 bg-surface">
            <ol className="py-4 font-mono text-[12.5px] leading-[1.6] sm:text-[13px]">
              {lines.map((line, i) => {
                const n = noteFor(line);
                const first = n >= 0 && noteFor(lines[i - 1] ?? "") !== n;
                if (!line.trim()) return <li key={i} aria-hidden className="h-4" />;
                return (
                  <li
                    key={i}
                    className={`grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2 px-4 py-1 sm:px-6 ${n >= 0 ? "bg-paper-2" : ""}`}
                  >
                    <span className="pt-px font-sans text-[11px] font-semibold text-ink">
                      {first && (
                        <span className="grid size-5 place-items-center rounded-full bg-ink text-paper">{n + 1}</span>
                      )}
                    </span>
                    <span className={`break-words ${n >= 0 ? "text-ink" : "text-graphite"}`}>{line}</span>
                  </li>
                );
              })}
            </ol>
          </div>
          <ol className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {NOTES.map((n, i) => (
              <li key={n.note} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2 border-t border-ink pt-3">
                <span className="text-[14px] font-semibold tabular-nums">{i + 1}</span>
                <p className="max-w-[40ch] text-[15px] leading-[1.55] text-ink">{n.note}</p>
              </li>
            ))}
          </ol>
        </figure>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- How it works */

export function HowItWorks() {
  const ex = exampleResponse("substituted-account");
  const account = ex.result.findings.find((f) => f.code === "ACCOUNT_MISMATCH")!;
  const firstSentence = account.explanation.split(". ")[0] + ".";

  const steps = [
    {
      title: "Extract",
      by: "AI",
      body: "The model reads the request and quotes the sender, payee, bank, account, and amount word for word. A value it can’t point to in the text is discarded.",
      specimen: (
        <>
          <p className="font-mono text-[12.5px] leading-[1.5] text-ink">
            <span className="underline decoration-cobalt decoration-[1.5px] underline-offset-[3px]">
              “{account.observed?.excerpt}”
            </span>
          </p>
          <p className="mt-3 text-[12px] text-cobalt">Found in the source text</p>
        </>
      ),
    },
    {
      title: "Compare",
      by: "Rules",
      body: "Each quoted value is checked against the trusted record for that supplier: sender domain, payee, bank, and account.",
      specimen: (
        <dl className="space-y-2 font-mono text-[12.5px] leading-[1.45]">
          <div>
            <dt className="font-sans text-[12px] text-graphite">Request</dt>
            <dd className="text-ink">{account.observed?.value}</dd>
          </div>
          <div>
            <dt className="font-sans text-[12px] text-graphite">Record</dt>
            <dd className="text-ink">{account.expected?.value}</dd>
          </div>
        </dl>
      ),
    },
    {
      title: "Explain",
      by: "Rules",
      body: "Each finding says what differs, where the value came from, and what to do next, in fixed wording rather than generated text.",
      specimen: <p className="text-[13.5px] leading-[1.55] text-ink">{firstSentence}</p>,
    },
    {
      title: "Protect",
      by: "Rules",
      body: "A critical mismatch holds the payment in a simulated approval step. A request that needs review can’t be released without a reviewer note.",
      specimen: (
        <p className="flex items-center gap-2 text-[13.5px] font-medium text-hold">
          <IconLock className="size-4" /> On hold, release locked
        </p>
      ),
    },
  ];

  return (
    <section id="how" aria-labelledby="how-h" className="border-t border-rule bg-paper-2/60">
      <div className={`${FRAME} py-24 lg:py-32`}>
        <div className={`${GRID} gap-y-6`}>
          <h2 id="how-h" className={`${H2} col-span-4 md:col-span-6 lg:col-span-6`}>
            Extract, compare, explain, protect.
          </h2>
          <p className="col-span-4 max-w-[40ch] self-end text-[17px] leading-[1.6] text-graphite md:col-span-6 lg:col-span-4 lg:col-start-9">
            Only the first step uses AI, and it never sees the verdict. Text hidden in an invoice can’t argue its way
            past the rules.
          </p>
        </div>

        <ol className="mt-16 grid border-t border-ink md:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className={`flex flex-col border-b border-rule py-8 lg:border-b-0 lg:px-6 ${
                i % 2 ? "md:border-l md:pl-6" : "md:pr-6"
              } ${i === 0 ? "lg:pl-0" : "lg:border-l"} ${i === 3 ? "lg:pr-0" : ""}`}
            >
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="font-semibold tabular-nums text-ink">{i + 1}</span>
                <span className={s.by === "AI" ? "font-medium text-cobalt" : "text-graphite"}>{s.by}</span>
              </div>
              <h3 className="mt-10 text-[34px] font-semibold leading-none tracking-[-0.04em] lg:text-[40px]">{s.title}</h3>
              <p className="mt-4 max-w-[34ch] text-[15px] leading-[1.6] text-graphite lg:min-h-[8em]">{s.body}</p>
              <div className="mt-8 border-t border-rule pt-4">{s.specimen}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Capabilities */

const SPEC: { group: string; tone: "ai" | "rules" | "limit"; items: [string, string][] }[] = [
  {
    group: "The AI reads",
    tone: "ai",
    items: [
      ["Any written format", "Pasted emails, forwarded threads, invoice text, and chat messages."],
      ["Verbatim evidence", "Every extracted value carries the exact words it was taken from."],
      ["The invoice as data", "Instructions aimed at AI tools are flagged as findings and can’t change the result."],
    ],
  },
  {
    group: "The rules decide",
    tone: "rules",
    items: [
      ["Trusted record comparison", "Account, payee, bank, and sender checked against the supplier you registered."],
      ["Grounded or discarded", "A value that doesn’t appear in the request text is treated as missing."],
      ["Lookalike senders", "Extra words, swapped letters, and different domain endings are flagged."],
      ["Unknown suppliers", "A request from a supplier with no trusted record never passes on its own."],
      ["Three verdicts", "Hold, needs review, or no mismatch found. Never “verified legitimate”."],
    ],
  },
  {
    group: "Out of scope",
    tone: "limit",
    items: [
      ["Email authentication", "SPF, DKIM, and DMARC aren’t checked. Only the pasted text is inspected."],
      ["Account ownership", "ProofPay doesn’t contact banks. Accounts are compared only with your records."],
      ["Real payments", "Releases are simulated. Nothing is connected to a bank and no money moves."],
    ],
  },
];

export function Capabilities() {
  return (
    <section id="capabilities" aria-labelledby="cap-h" className="border-t border-rule">
      <div className={`${FRAME} py-24 lg:py-32`}>
        <div className={GRID}>
          <h2 id="cap-h" className={`${H2} col-span-4 md:col-span-8 lg:col-span-8`}>
            The AI reads.
            <br />
            The rules decide.
          </h2>
        </div>

        <div className="mt-16 lg:mt-20">
          {SPEC.map((g) => (
            <div key={g.group} className={`${GRID} border-t border-ink py-6 lg:py-8`}>
              <h3
                className={`col-span-4 mb-4 text-[15px] font-semibold md:col-span-8 lg:col-span-3 lg:mb-0 ${
                  g.tone === "ai" ? "text-cobalt" : g.tone === "limit" ? "text-graphite" : "text-ink"
                }`}
              >
                {g.group}
              </h3>
              <dl className="col-span-4 md:col-span-8 lg:col-span-9">
                {g.items.map(([t, d]) => (
                  <div
                    key={t}
                    className="grid grid-cols-1 gap-y-1 border-b border-rule py-4 first:pt-0 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:gap-x-6"
                  >
                    <dt
                      className={`text-[20px] font-medium tracking-[-0.02em] sm:text-[22px] ${
                        g.tone === "limit" ? "text-graphite" : "text-ink"
                      }`}
                    >
                      {t}
                    </dt>
                    <dd className="max-w-[48ch] text-[15px] leading-[1.6] text-graphite md:pt-1">{d}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- Closing + footer */

export function Closing() {
  return (
    <section aria-labelledby="cta-h" className="bg-cobalt text-white">
      <div className={`${FRAME} py-24 lg:py-36`}>
        <h2
          id="cta-h"
          className="text-[clamp(2.75rem,8vw,7.25rem)] font-semibold leading-[0.92] tracking-[-0.055em]"
        >
          <span className="block">Know what you’re paying.</span>
          <span className="block">Before you pay.</span>
        </h2>
        <div className={`${GRID} mt-14 gap-y-8 border-t border-white/40 pt-8`}>
          <p className="col-span-4 max-w-[40ch] text-[17px] leading-[1.6] text-white/85 md:col-span-5 lg:col-span-5">
            Paste a payment request, or run one of the synthetic examples, and see what ProofPay holds and why.
          </p>
          <div className="col-span-4 md:col-span-3 md:justify-self-end lg:col-span-4 lg:col-start-9">
            <Link
              href="/app"
              className="inline-flex h-12 items-center rounded-md bg-paper px-6 text-[15px] font-medium text-ink transition-[background-color,transform] hover:bg-white active:scale-[0.98] focus-visible:outline-white"
            >
              Open the demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const suppliers = TRUSTED_SUPPLIERS.length;
  return (
    <footer className={`${FRAME} py-12`}>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <Link href="/" aria-label="ProofPay home" className="self-start rounded-md">
          <LogoLockup />
        </Link>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-2 text-[14px] text-graphite">
          <Link href="/app" className="hover:text-ink">Demo</Link>
          <Link href="/suppliers" className="hover:text-ink">Trusted records</Link>
          <a href="#how" className="hover:text-ink">How it works</a>
          {SITE.githubUrl && (
            <a href={SITE.githubUrl} className="inline-flex items-center gap-1.5 hover:text-ink">
              <IconGitHub className="size-4" /> GitHub
            </a>
          )}
        </nav>
      </div>
      <p className="mt-8 max-w-[72ch] border-t border-rule pt-6 text-[13px] leading-[1.6] text-graphite">
        Built for {SITE.hackathon}, {SITE.track} track. A prototype with {suppliers} synthetic supplier records and
        simulated payments. It isn’t connected to any bank, no money moves, and a clean result means no mismatch with
        your records, not a guarantee.
      </p>
    </footer>
  );
}
