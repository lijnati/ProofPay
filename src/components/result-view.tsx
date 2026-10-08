"use client";

import { useState } from "react";
import type { ComparisonRow, Finding, Severity, TrustedSupplier, Verdict } from "@/domain/types";
import { formatAmount } from "@/domain/normalize";
import type { VerifyResponse } from "@/server/verify-handler";
import { IconAlert, IconCheck, IconInfo, IconLock, IconMinus, IconX } from "./icons";

const VERDICT_COPY: Record<Verdict, { title: string; tone: string; ring: string; text: string; dot: string }> = {
  HOLD: {
    title: "Payment held",
    tone: "bg-hold-soft border-hold-line",
    ring: "border-hold-line",
    text: "text-hold",
    dot: "bg-hold",
  },
  REVIEW: {
    title: "Needs human review",
    tone: "bg-review-soft border-review-line",
    ring: "border-review-line",
    text: "text-review",
    dot: "bg-review",
  },
  NO_MISMATCH_FOUND: {
    title: "No mismatch against registered records",
    tone: "bg-clear-soft border-clear-line",
    ring: "border-clear-line",
    text: "text-clear",
    dot: "bg-clear",
  },
};

export function ResultView({ data }: { data: VerifyResponse }) {
  const { result } = data;
  const counts = countBy(result.findings);
  return (
    <div className="flex flex-col gap-5">
      <VerdictHeader data={data} counts={counts} />
      <EvidenceTable rows={result.comparisons} supplier={result.matchedSupplier} />
      {result.findings.length > 0 && <FindingList findings={result.findings} />}
      <PaymentGate data={data} />
      <Checks performed={result.checksPerformed} notPerformed={result.checksNotPerformed} />
    </div>
  );
}

function countBy(findings: Finding[]) {
  return findings.reduce(
    (acc, f) => ({ ...acc, [f.severity]: acc[f.severity] + 1 }),
    { critical: 0, warning: 0, info: 0 } as Record<Severity, number>,
  );
}

function summary(data: VerifyResponse): string {
  const { verdict, findings, matchedSupplier } = data.result;
  if (verdict === "NO_MISMATCH_FOUND") {
    return `The payee, account, and sender match the records you previously verified for ${matchedSupplier?.legalName ?? "this supplier"}. This is not a guarantee the request is legitimate.`;
  }
  const top = findings.filter((f) => f.severity === (verdict === "HOLD" ? "critical" : "warning"));
  const lead =
    verdict === "HOLD"
      ? "Do not pay until the details are confirmed with the supplier through a channel you already trust."
      : "ProofPay could not confirm this request against trusted records. A person should check it before paying.";
  return `${top.map((f) => f.title).slice(0, 2).join(". ")}. ${lead}`;
}

function VerdictHeader({ data, counts }: { data: VerifyResponse; counts: Record<Severity, number> }) {
  const v = VERDICT_COPY[data.result.verdict];
  const Icon = data.result.verdict === "HOLD" ? IconLock : data.result.verdict === "REVIEW" ? IconAlert : IconCheck;
  return (
    <header className={`animate-enter rounded-xl border p-5 sm:p-6 ${v.tone}`}>
      <div className="flex items-start gap-4">
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg border bg-surface ${v.ring} ${v.text}`}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-medium uppercase tracking-wider ${v.text}`}>
            {data.result.verdict.replace(/_/g, " ")}
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">{v.title}</h2>
          <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-2 text-pretty">{summary(data)}</p>
        </div>
      </div>
      <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-black/5 pt-4 text-xs text-ink-3">
        <Meta label="Trusted record">
          {data.result.matchedSupplier ? data.result.matchedSupplier.legalName : <span className="text-review">None found</span>}
        </Meta>
        <Meta label="Findings">
          <span className="text-hold">{counts.critical} critical</span> · <span className="text-review">{counts.warning} review</span>{" "}
          · {counts.info} context
        </Meta>
        <Meta label="Extraction">
          {data.extractionMode === "live" ? (
            <>{data.extractionLabel}</>
          ) : (
            <span className="text-review">{data.extractionLabel}</span>
          )}
        </Meta>
        <Meta label="Ref">
          <span className="font-mono">{data.requestId.slice(0, 8)}</span>
        </Meta>
      </dl>
    </header>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-ink-4">{label}</dt>
      <dd className="text-ink-2">{children}</dd>
    </div>
  );
}

const STATUS: Record<ComparisonRow["status"], { label: string; cls: string; Icon: typeof IconCheck }> = {
  match: { label: "Matches", cls: "text-clear bg-clear-soft border-clear-line", Icon: IconCheck },
  mismatch: { label: "Mismatch", cls: "text-hold bg-hold-soft border-hold-line", Icon: IconX },
  note: { label: "Unusual", cls: "text-ink-2 bg-sunken border-line", Icon: IconInfo },
  missing: { label: "Not in request", cls: "text-review bg-review-soft border-review-line", Icon: IconMinus },
  not_compared: { label: "No reference", cls: "text-ink-3 bg-sunken border-line", Icon: IconMinus },
};

function StatusPill({ status }: { status: ComparisonRow["status"] }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>
      <s.Icon className="size-3" />
      {s.label}
    </span>
  );
}

function EvidenceTable({ rows, supplier }: { rows: ComparisonRow[]; supplier: TrustedSupplier | null }) {
  return (
    <section className="animate-enter overflow-hidden rounded-xl border border-line bg-surface [animation-delay:60ms]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-3.5">
        <h3 className="text-sm font-semibold">Evidence</h3>
        <p className="text-xs text-ink-3">
          {supplier ? (
            <>
              Compared with trusted record for <span className="text-ink-2">{supplier.legalName}</span>
              <span className="text-ink-4"> · {supplier.referenceSource.replace(/^Synthetic record · /, "synthetic · ")} · last confirmed {supplier.lastConfirmed}</span>
            </>
          ) : (
            <span className="text-review">No trusted record to compare against</span>
          )}
        </p>
      </div>
      <div className="hidden grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_112px] gap-4 border-b border-line bg-sunken/60 px-5 py-2 text-[11px] font-medium uppercase tracking-wider text-ink-4 md:grid">
        <span>Field</span>
        <span>In this request</span>
        <span>Trusted record</span>
        <span className="text-right">Status</span>
      </div>
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li
            key={r.field}
            className={`grid gap-x-4 gap-y-2 px-5 py-3.5 md:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_112px] ${r.status === "mismatch" ? "bg-hold-soft/50" : ""}`}
          >
            <div className="flex items-center justify-between md:block">
              <span className="text-[13px] font-medium text-ink-2">{r.label}</span>
              <span className="md:hidden">
                <StatusPill status={r.status} />
              </span>
            </div>
            <div className="min-w-0">
              <span className="mb-0.5 block text-[10px] uppercase tracking-wider text-ink-4 md:hidden">In this request</span>
              {r.observed ? (
                <>
                  <p className={`break-words font-mono text-[13px] ${r.status === "mismatch" ? "text-hold" : "text-ink"}`}>
                    {r.observed.value}
                  </p>
                  <Provenance excerpt={r.observed.excerpt} origin={r.observed.origin} />
                </>
              ) : (
                <p className="text-[13px] text-ink-4">
                  {r.observedStatus === "unsupported"
                    ? "Discarded — not found in text"
                    : r.observedStatus === "ambiguous"
                      ? "Ambiguous in request"
                      : "Not stated"}
                </p>
              )}
            </div>
            <div className="min-w-0">
              <span className="mb-0.5 block text-[10px] uppercase tracking-wider text-ink-4 md:hidden">Trusted record</span>
              {r.expected ? (
                <p className="break-words font-mono text-[13px] text-ink-2">{r.expected.value}</p>
              ) : (
                <p className="text-[13px] text-ink-4">—</p>
              )}
            </div>
            <div className="hidden md:block md:text-right">
              <StatusPill status={r.status} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Provenance({ excerpt, origin }: { excerpt: string | null; origin: "request_text" | "sender_field" }) {
  if (origin === "sender_field") return <p className="mt-1 text-[11px] text-ink-4">Claimed sender you entered — not authenticated</p>;
  if (!excerpt) return null;
  return (
    <p className="mt-1 border-l-2 border-line-strong pl-2 text-[11px] leading-snug text-ink-3">
      <span className="text-ink-4">Quoted from request: </span>
      <span className="break-words">“{excerpt}”</span>
    </p>
  );
}

const SEV: Record<Severity, { label: string; cls: string; bar: string }> = {
  critical: { label: "Critical", cls: "text-hold", bar: "bg-hold" },
  warning: { label: "Review", cls: "text-review", bar: "bg-review" },
  info: { label: "Context", cls: "text-ink-3", bar: "bg-line-strong" },
};

function FindingList({ findings }: { findings: Finding[] }) {
  return (
    <section className="animate-enter rounded-xl border border-line bg-surface [animation-delay:120ms]">
      <h3 className="border-b border-line px-5 py-3.5 text-sm font-semibold">Findings</h3>
      <ol className="divide-y divide-line">
        {findings.map((f, i) => (
          <li key={`${f.code}-${f.field}-${i}`} className="relative px-5 py-4 pl-6">
            <span className={`absolute inset-y-4 left-0 w-[3px] rounded-r ${SEV[f.severity].bar}`} aria-hidden />
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${SEV[f.severity].cls}`}>
                {SEV[f.severity].label}
              </span>
              <p className="text-sm font-medium">{f.title}</p>
            </div>
            <p className="mt-1.5 max-w-[72ch] text-[13px] leading-relaxed text-ink-2 text-pretty">{f.explanation}</p>
            {f.observed && f.expected && (
              <div className="mt-3 grid gap-px overflow-hidden rounded-md border border-line bg-line text-[12px] sm:grid-cols-2">
                <div className="bg-surface px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-ink-4">
                    {f.observed.origin === "sender_field" ? "Sender field" : "This request"}
                  </p>
                  <p className={`mt-0.5 break-words font-mono ${f.severity === "critical" ? "text-hold" : "text-ink"}`}>{f.observed.value}</p>
                </div>
                <div className="bg-sunken/60 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-ink-4">Trusted record</p>
                  <p className="mt-0.5 break-words font-mono text-ink-2">{f.expected.value}</p>
                  <p className="mt-1 text-[10.5px] leading-snug text-ink-4">{f.expected.source}</p>
                </div>
              </div>
            )}
            {f.observed?.excerpt && f.field === "request" && (
              <blockquote className="mt-2 rounded-md bg-sunken px-3 py-2 font-mono text-[12px] leading-relaxed text-ink-2 break-words">
                {f.observed.excerpt}
              </blockquote>
            )}
            <p className="mt-2 font-mono text-[10px] text-ink-4">{f.code}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PaymentGate({ data }: { data: VerifyResponse }) {
  const { verdict } = data.result;
  const x = data.extraction;
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [released, setReleased] = useState<null | string>(null);

  const amount = x.amount.status === "found" && x.amount.value != null ? formatAmount(x.amount.value, x.currency.value) : "Amount unknown";
  const payee = x.beneficiaryName.value ?? "Unknown payee";
  const account = x.accountIdentifier.value ?? "No account";

  const canApproveReview = note.trim().length >= 10 && confirmed;

  return (
    <section className="animate-enter rounded-xl border border-line bg-surface [animation-delay:180ms]">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3.5">
        <h3 className="text-sm font-semibold">Payment gate</h3>
        <span className="rounded-full border border-line bg-sunken px-2 py-0.5 text-[11px] text-ink-3">
          Simulation — no funds move
        </span>
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <dl className="grid grid-cols-[88px_minmax(0,1fr)] gap-y-2 text-[13px]">
          <dt className="text-ink-4">Pay</dt>
          <dd className="font-mono font-medium">{amount}</dd>
          <dt className="text-ink-4">To</dt>
          <dd className="break-words">{payee}</dd>
          <dt className="text-ink-4">Account</dt>
          <dd className="break-words font-mono">{account}</dd>
        </dl>

        <div className="flex flex-col gap-3">
          {released ? (
            <div className="animate-enter rounded-lg border border-clear-line bg-clear-soft p-3 text-[13px]">
              <p className="font-medium text-clear">Simulated release recorded</p>
              <p className="mt-0.5 text-ink-2">{released} No real payment was made.</p>
            </div>
          ) : verdict === "HOLD" ? (
            <>
              <div className="flex items-start gap-2.5 rounded-lg border border-hold-line bg-hold-soft p-3 text-[13px]">
                <IconLock className="mt-0.5 size-4 shrink-0 text-hold" />
                <div>
                  <p className="font-medium text-hold">On hold — release is locked</p>
                  <p className="mt-0.5 leading-relaxed text-ink-2">
                    Call the supplier on the number in your records — not one from this request — before anything is paid.
                  </p>
                </div>
              </div>
              <button type="button" disabled className="h-10 cursor-not-allowed rounded-lg bg-sunken text-sm font-medium text-ink-4">
                Release payment
              </button>
            </>
          ) : verdict === "REVIEW" ? (
            <>
              <label className="flex flex-col gap-1.5 text-[13px]">
                <span className="font-medium">Reviewer note</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Called supplier on file number, confirmed new supplier onboarding."
                  className="resize-none rounded-lg border border-line bg-surface p-2.5 outline-none focus:border-ink-3"
                />
              </label>
              <label className="flex items-start gap-2 text-[13px] text-ink-2">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 size-4 accent-ink"
                />
                I confirmed these details with the supplier through an independent channel.
              </label>
              <button
                type="button"
                disabled={!canApproveReview}
                onClick={() => setReleased(`Approved after human review. Reviewer note: “${note.trim()}”.`)}
                className="h-10 rounded-lg bg-ink text-sm font-medium text-white transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-4"
              >
                Approve simulated payment
              </button>
            </>
          ) : (
            <>
              <p className="text-[13px] leading-relaxed text-ink-2">
                No registered mismatch was found. Releasing is your decision — ProofPay does not certify legitimacy.
              </p>
              <button
                type="button"
                onClick={() => setReleased("Released with no registered mismatch.")}
                className="h-10 rounded-lg bg-ink text-sm font-medium text-white transition-colors hover:bg-ink-2"
              >
                Release simulated payment
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Checks({ performed, notPerformed }: { performed: string[]; notPerformed: string[] }) {
  return (
    <section className="animate-enter grid gap-px overflow-hidden rounded-xl border border-line bg-line [animation-delay:240ms] md:grid-cols-2">
      <div className="bg-surface p-5">
        <h3 className="text-sm font-semibold">Checks performed</h3>
        <ul className="mt-3 space-y-2">
          {performed.map((c) => (
            <li key={c} className="flex gap-2 text-[13px] leading-snug text-ink-2">
              <IconCheck className="mt-0.5 size-3.5 shrink-0 text-clear" />
              {c}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-surface p-5">
        <h3 className="text-sm font-semibold">Not checked</h3>
        <ul className="mt-3 space-y-2">
          {notPerformed.map((c) => (
            <li key={c} className="flex gap-2 text-[13px] leading-snug text-ink-3">
              <IconMinus className="mt-0.5 size-3.5 shrink-0 text-ink-4" />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
