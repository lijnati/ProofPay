import Link from "next/link";
import { IconArrow, IconGitHub, LogoLockup } from "./icons";
import { SITE } from "@/site";

/** One header for the whole site; the marketing and product variants differ only in links. */
export function SiteHeader({ variant }: { variant: "marketing" | "product" }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link href="/" className="shrink-0 rounded-md" aria-label="ProofPay home">
          <LogoLockup />
        </Link>

        {variant === "marketing" ? (
          <>
            <nav aria-label="Primary" className="hidden items-center gap-1 text-[13px] text-ink-3 md:flex">
              <a href="#how" className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-sunken hover:text-ink">How it works</a>
              <a href="#capabilities" className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-sunken hover:text-ink">Features</a>
              <Link href="/suppliers" className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-sunken hover:text-ink">Trusted records</Link>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              {SITE.githubUrl && (
                <a
                  href={SITE.githubUrl}
                  className="hidden size-9 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-sunken hover:text-ink sm:flex"
                  aria-label="Source on GitHub"
                >
                  <IconGitHub className="size-[18px]" />
                </a>
              )}
              <Link
                href="/app"
                className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-medium text-white transition-colors hover:bg-ink-2"
              >
                Launch Demo
                <IconArrow className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </header>
  );
}
