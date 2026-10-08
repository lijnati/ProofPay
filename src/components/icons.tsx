import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24" } as const;

/**
 * Brand mark: one disc split in two, the halves no longer line up — the mismatch.
 * Geometry from submission-assets/logo/build_logo.py. `small` is the cut for ≤ 32px
 * (wider gap and offset); `reversed` is for dark backgrounds.
 */
export const Logo = ({ small = true, reversed = false, ...p }: P & { small?: boolean; reversed?: boolean }) => {
  const top = reversed ? "#ffffff" : "#17181a";
  const bottom = reversed ? "#e0705f" : "#a8322a";
  return (
    <svg viewBox="0 0 256 256" aria-hidden {...p}>
      {small ? (
        <>
          <path fill={top} d="M24 116A86 86 0 0 1 196 116Z" />
          <path fill={bottom} d="M60 140A86 86 0 0 0 232 140Z" />
        </>
      ) : (
        <>
          <path fill={top} d="M28 122A88 88 0 0 1 204 122Z" />
          <path fill={bottom} d="M52 134A88 88 0 0 0 228 134Z" />
        </>
      )}
    </svg>
  );
};

/** Lockup: mark + wordmark set in Geist SemiBold (the outlined master lives in submission-assets/logo). */
export const LogoLockup = ({ reversed = false, className = "" }: { reversed?: boolean; className?: string }) => (
  <span className={`inline-flex items-center gap-2 text-[16px] font-semibold tracking-[-0.025em] ${reversed ? "text-white" : "text-ink"} ${className}`}>
    <Logo reversed={reversed} className="size-[22px]" />
    ProofPay
  </span>
);
export const IconGitHub = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 015 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base} aria-hidden {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const IconX = (p: P) => (
  <svg {...base} aria-hidden {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconAlert = (p: P) => (
  <svg {...base} aria-hidden {...p}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L2.4 17.6A2 2 0 004.1 20.6h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg>
);
export const IconLock = (p: P) => (
  <svg {...base} aria-hidden {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 018 0v3" /></svg>
);
export const IconInfo = (p: P) => (
  <svg {...base} aria-hidden {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
);
export const IconMinus = (p: P) => (
  <svg {...base} aria-hidden {...p}><path d="M6 12h12" /></svg>
);
export const IconArrow = (p: P) => (
  <svg {...base} aria-hidden {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconQuote = (p: P) => (
  <svg {...base} aria-hidden {...p}><path d="M4 6h16M4 12h10M4 18h7" /></svg>
);
