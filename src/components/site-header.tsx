import Link from "next/link";
import { LogoLockup } from "./icons";

/** Header for the product pages (/app, /suppliers). The landing page has its own nav in landing/hero.tsx. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link href="/" className="shrink-0 rounded-md" aria-label="ProofPay home">
          <LogoLockup />
        </Link>
        <nav aria-label="Product" className="flex items-center gap-0.5 whitespace-nowrap text-[13px] text-ink-3 sm:gap-1">
          <Link href="/app" className="rounded-md px-2 py-1.5 transition-colors hover:bg-sunken hover:text-ink">
            Verify
          </Link>
          <Link href="/suppliers" className="rounded-md px-2 py-1.5 transition-colors hover:bg-sunken hover:text-ink">
            <span className="sm:hidden">Records</span>
            <span className="hidden sm:inline">Trusted records</span>
          </Link>
        </nav>
        <span className="ml-auto flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-ink-3">
          <span className="size-1.5 rounded-full bg-review" aria-hidden />
          <span className="sm:hidden">Demo</span>
          <span className="hidden sm:inline">Demo · synthetic data · no real payments</span>
        </span>
      </div>
    </header>
  );
}
