"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { VerifyResponse } from "@/server/verify-handler";
import { ResultView } from "../result-view";
import { FRAME } from "./grid";

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
    <section id="product" aria-labelledby={`${baseId}-h`} className="border-t border-rule">
      <div className={`${FRAME} py-20 lg:py-24`}>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-b border-rule">
          <h2 id={`${baseId}-h`} className="pb-3 text-[22px] font-semibold tracking-[-0.025em]">
            Example results
          </h2>
          <div role="tablist" aria-label="Example results" className="flex gap-6 sm:gap-8">
            {examples.map((e) => (
              <button
                key={e.id}
                role="tab"
                id={`${baseId}-tab-${e.id}`}
                aria-selected={active === e.id}
                aria-controls={`${baseId}-panel`}
                onClick={() => setActive(e.id)}
                className="-mb-px border-b-2 border-transparent pb-3 text-[15px] font-medium text-graphite transition-colors hover:text-ink aria-selected:border-ink aria-selected:text-ink"
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
          className="mt-8 overflow-hidden rounded-[10px] border border-ink/80 bg-canvas"
        >
          <div className="grid lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
            <div className="border-b border-rule bg-surface p-5 sm:p-7 lg:border-b-0 lg:border-r">
              <p className="text-[13px] text-graphite">Payment request</p>
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
          className="mt-10 inline-flex text-[15px] font-medium text-ink underline decoration-rule decoration-2 underline-offset-[6px] transition-colors hover:decoration-ink"
        >
          Run these requests with live AI in the demo
        </Link>
      </div>
    </section>
  );
}
