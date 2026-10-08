"use client";

import { useRef, useState } from "react";
import type { VerifyResponse } from "@/server/verify-handler";
import { MAX_REQUEST_CHARS } from "@/domain/types";
import { IconArrow } from "./icons";
import { ResultView } from "./result-view";

export interface SampleOption {
  id: string;
  label: string;
  scenario: string;
  text: string;
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; data: VerifyResponse };

export function VerifyConsole({ samples }: { samples: SampleOption[] }) {
  const [text, setText] = useState("");
  const [sender, setSender] = useState("");
  const [activeSample, setActiveSample] = useState<string | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });
  const resultRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const tooLong = text.length > MAX_REQUEST_CHARS;
  const canSubmit = text.trim().length > 0 && !tooLong && state.kind !== "loading";

  async function verify() {
    if (!canSubmit) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ kind: "loading" });
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, senderEmail: sender.trim() || undefined }),
        signal: controller.signal,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json) {
        setState({ kind: "error", message: json?.message ?? "Verification failed. Nothing was approved — try again." });
        return;
      }
      setState({ kind: "done", data: json as VerifyResponse });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState({ kind: "error", message: "Network error. Nothing was approved — try again." });
    }
  }

  function loadSample(s: SampleOption) {
    setText(s.text);
    setSender("");
    setActiveSample(s.id);
    setState({ kind: "idle" });
  }

  return (
    <main className="mx-auto grid max-w-[1240px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-8 lg:py-8">
      <section aria-labelledby="request-heading" className="flex flex-col gap-5 lg:sticky lg:top-[4.75rem] lg:self-start">
        <div>
          <h1 className="text-[1.375rem] font-semibold leading-tight tracking-tight text-balance">
            Check a payment request before you pay.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-3 text-pretty">
            Scammers can fake an invoice. ProofPay checks what they can&apos;t fake: your previously verified
            payment records.
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-ink-3">Sample requests</h2>
            <span className="text-[11px] text-ink-4">Synthetic</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {samples.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => loadSample(s)}
                title={s.scenario}
                aria-pressed={activeSample === s.id}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-left text-[13px] leading-snug text-ink-2 transition-colors hover:border-line-strong hover:text-ink aria-pressed:border-ink aria-pressed:text-ink"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between text-xs font-medium uppercase tracking-wider text-ink-3">
              <span id="request-heading">Payment request</span>
              <span className={`font-mono normal-case tracking-normal ${tooLong ? "text-hold" : "text-ink-4"}`}>
                {text.length.toLocaleString()} / {MAX_REQUEST_CHARS.toLocaleString()}
              </span>
            </span>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setActiveSample(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  verify();
                }
              }}
              placeholder="Paste the email or invoice text asking you to pay…"
              spellCheck={false}
              className="h-72 resize-y rounded-lg border border-line bg-surface p-3 font-mono text-[12.5px] leading-relaxed text-ink outline-none transition-colors placeholder:font-sans placeholder:text-ink-4 focus:border-ink-3 lg:h-[22rem]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-3">
              Sender address <span className="normal-case tracking-normal text-ink-4">— optional, overrides text</span>
            </span>
            <input
              type="email"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="billing@supplier.example"
              className="h-10 rounded-lg border border-line bg-surface px-3 font-mono text-[13px] outline-none transition-colors placeholder:font-sans placeholder:text-ink-4 focus:border-ink-3"
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="group mt-1 flex h-11 items-center justify-center gap-2 rounded-lg bg-ink text-sm font-medium text-white transition-[background-color,transform] hover:bg-ink-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-ink-4"
          >
            {state.kind === "loading" ? "Verifying…" : "Verify request"}
            {state.kind !== "loading" && (
              <IconArrow className="size-4 transition-transform group-hover:translate-x-0.5" />
            )}
          </button>
          <p className="text-[11px] leading-relaxed text-ink-4">
            Text is processed in memory and not stored. ProofPay never moves money.
            <span className="hidden lg:inline"> Ctrl/⌘ + Enter to verify.</span>
          </p>
        </form>
      </section>

      <section ref={resultRef} aria-live="polite" className="min-w-0 scroll-mt-20">
        {state.kind === "idle" && <EmptyState />}
        {state.kind === "loading" && <LoadingState />}
        {state.kind === "error" && (
          <div className="animate-enter rounded-xl border border-hold-line bg-hold-soft p-5 text-sm">
            <p className="font-medium text-hold">Verification could not be completed</p>
            <p className="mt-1 text-ink-2">{state.message}</p>
            <button
              type="button"
              onClick={verify}
              className="mt-4 h-9 rounded-lg border border-line-strong bg-surface px-3 text-sm font-medium hover:bg-sunken"
            >
              Try again
            </button>
          </div>
        )}
        {state.kind === "done" && <ResultView key={state.data.requestId} data={state.data} />}
      </section>
    </main>
  );
}

function EmptyState() {
  const steps = [
    ["Extract", "AI reads the request and quotes the exact payee, account, amount, and sender it contains."],
    ["Compare", "Deterministic rules compare each fact with your previously verified supplier records."],
    ["Gate", "Critical mismatches hold the payment. Unclear requests go to a person. AI cannot override the result."],
  ];
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-surface/60 p-6 sm:p-8">
      <p className="text-sm font-medium">No request verified yet</p>
      <p className="mt-1 text-sm text-ink-3">Choose a sample or paste a payment request to see the evidence.</p>
      <ol className="mt-6 grid gap-4 sm:grid-cols-3">
        {steps.map(([title, body], i) => (
          <li key={title} className="border-t border-line pt-3">
            <span className="font-mono text-[11px] text-ink-4">0{i + 1}</span>
            <p className="mt-1 text-sm font-medium">{title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-xl border border-line bg-surface p-6" role="status">
      <div className="flex items-center gap-3 text-sm text-ink-2">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-ink-3 opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-ink-2" />
        </span>
        Extracting payment facts and comparing with trusted records…
      </div>
      <div className="mt-6 space-y-3" aria-hidden>
        {[72, 100, 88, 94, 60].map((w, i) => (
          <div key={i} className="h-3 animate-pulse rounded bg-sunken" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
