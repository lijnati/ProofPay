"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { VerifyResponse } from "@/server/verify-handler";
import { IconArrow } from "../icons";
import { ResultView } from "../result-view";

export interface ShowcaseExample {
  id: string;
  tab: string;
  text: string;
  data: VerifyResponse;
}

/**
 * Real ResultView components rendering real engine output for the synthetic
 * samples (precomputed on the server; no AI call happens on this page).
 */
export function Showcase({ examples }: { examples: ShowcaseExample[] }) {
  const [active, setActive] = useState(examples[0].id);
  const baseId = useId();
  const current = examples.find((e) => e.id === active)!;

  return (
    <section id="product" aria-labelledby={`${baseId}-h`} className="border-b border-line bg-sunken/40">
      <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">The product</p>
            <h2 id={`${baseId}-h`} className="mt-3 max-w-[22ch] font-display text-[36px] leading-[1.05] sm:text-[46px]">
              Every verdict comes with its evidence.
            </h2>
            <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-ink-2">
              This is the real result screen, rendered from the real verification rules. Switch between requests to
              see how the same supplier can pass or be held.
            </p>
          </div>
          <div role="tablist" aria-label="Example requests" className="flex flex-wrap gap-1 rounded-lg border border-line bg-surface p-1">
            {examples.map((e) => (
              <button
                key={e.id}
                role="tab"
                id={`${baseId}-tab-${e.id}`}
                aria-selected={active === e.id}
                aria-controls={`${baseId}-panel`}
                onClick={() => setActive(e.id)}
                className="h-9 rounded-md px-3.5 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink aria-selected:bg-ink aria-selected:text-white"
              >
                {e.tab}
              </button>
            ))}
          </div>
        </div>

        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${active}`}
          className="mt-10 overflow-hidden rounded-xl border border-line bg-canvas shadow-[0_30px_60px_-30px_rgba(23,24,26,0.25)]"
        >
          {/* Window chrome — mirrors the app's route */}
          <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
            </span>
            <span className="font-mono text-[11px] text-ink-3">proofpay / app</span>
            <span className="ml-auto hidden font-mono text-[11px] text-ink-4 sm:block">example output · no live AI on this page</span>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
            <div className="border-b border-line p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-3">Payment request</p>
              <pre className="mt-3 max-h-[280px] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-surface p-3 font-mono text-[11.5px] leading-relaxed text-ink-2 lg:max-h-none">
                {current.text}
              </pre>
            </div>
            <div className="min-w-0 p-4 sm:p-6">
              <ResultView key={current.id} data={current.data} preview />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/app" className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
            Run these requests with live AI in the demo
            <IconArrow className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <span className="text-xs text-ink-3">Synthetic suppliers, accounts, and domains.</span>
        </div>
      </div>
    </section>
  );
}
