"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { VerifyResponse } from "@/server/verify-handler";
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
    <section id="product" aria-labelledby={`${baseId}-h`} className="mesh-soft relative overflow-hidden">
      <div className="mx-auto max-w-[1320px] px-5 py-28 sm:px-8 lg:py-36">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <h2 id={`${baseId}-h`} className="max-w-[16ch] text-[40px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[56px]">
              See the evidence, not a score.
            </h2>
            <p className="mt-5 max-w-[42ch] text-[17px] leading-[1.6] text-ink-3">
              The real result screen, running the real rules on synthetic requests. No AI is called on this page.
            </p>
          </div>
          <div role="tablist" aria-label="Example results" className="flex flex-wrap gap-1 rounded-full bg-white/80 p-1 ring-1 ring-black/5 backdrop-blur">
            {examples.map((e) => (
              <button
                key={e.id}
                role="tab"
                id={`${baseId}-tab-${e.id}`}
                aria-selected={active === e.id}
                aria-controls={`${baseId}-panel`}
                onClick={() => setActive(e.id)}
                className="h-10 rounded-full px-5 text-[14px] font-medium text-ink-3 transition-colors hover:text-ink aria-selected:bg-abyss aria-selected:text-white"
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
          className="mt-14 overflow-hidden rounded-3xl bg-canvas shadow-[0_40px_90px_-40px_rgba(10,20,40,0.35)] ring-1 ring-black/5"
        >
          <div className="grid lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
            <div className="border-b border-line bg-white p-5 sm:p-7 lg:border-b-0 lg:border-r">
              <p className="text-[13px] text-ink-3">Payment request</p>
              <pre className="mt-3 max-h-[280px] overflow-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-ink-2 lg:max-h-none">
                {current.text}
              </pre>
            </div>
            <div className="min-w-0 p-4 sm:p-7">
              <ResultView key={current.id} data={current.data} preview />
            </div>
          </div>
        </div>

        <Link
          href="/app"
          className="mt-10 inline-flex text-[15px] font-medium text-ink underline decoration-ink/25 underline-offset-[6px] transition-colors hover:decoration-ink"
        >
          Run these requests with live AI in the demo
        </Link>
      </div>
    </section>
  );
}
