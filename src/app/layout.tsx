import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Logo } from "@/components/icons";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProofPay — verify payment requests before you pay",
  description:
    "Scammers can fake an invoice. ProofPay checks what they can't fake: your previously verified payment records.",
};

export const viewport: Viewport = {
  themeColor: "#f7f7f5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-dvh">
        <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <Logo className="size-5" />
              ProofPay
            </Link>
            <nav className="flex items-center gap-0.5 whitespace-nowrap text-[13px] text-ink-3 sm:gap-1 sm:text-sm">
              <Link href="/" className="rounded-md px-2 py-1 hover:bg-sunken hover:text-ink">
                Verify
              </Link>
              <Link href="/suppliers" className="rounded-md px-2 py-1 hover:bg-sunken hover:text-ink">
                Trusted records
              </Link>
            </nav>
            <span className="ml-auto flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-ink-3">
              <span className="size-1.5 rounded-full bg-review" aria-hidden />
              <span className="sm:hidden">Demo</span>
              <span className="hidden sm:inline">Demo · synthetic data · no real payments</span>
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
