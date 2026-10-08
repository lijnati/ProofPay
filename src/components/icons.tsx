import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24" } as const;

export const Logo = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#17181a" />
    <path d="M7.5 12.5l3 3 6-7" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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
