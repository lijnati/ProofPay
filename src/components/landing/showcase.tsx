"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { VerifyResponse } from "@/server/verify-handler";
import { ResultView } from "../result-view";
import { FRAME, GRID } from "./grid";

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
      <div className={`${FRAME} py-24 lg:py-32`}>
        <div className={`${GRID} gap-y-6`}>
          <h2
            id={`${baseId}-h`}
            className="col-span-4 text-balance text-[clamp(2.25rem,4.6vw,4rem)] font-semibold leading-[0.98] tracking-[-0.045em] md:col-span-6 lg:col-span-6"
          >
            See the evidence, not a score.
          </h2>
          <p className="col-span-4 max-w-[40ch] self-end text-[17px] leading-[1.6] text-graphite md:col-span-6 lg:col-span-4 lg:col-start-9">
            The real result screen and the real rules, run on synthetic requests with stored extractions. No AI is
            called on this page.
          </p>
        </div>

        <div role="tablist" aria-label="Example results" className="mt-14 flex gap-6 border-b border-rule sm:gap-8">
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
