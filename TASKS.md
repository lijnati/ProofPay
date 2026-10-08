# ProofPay — Tasks

Internal deadline: **Oct 10 2026, 5:00 PM EAT**. No GitHub; deploy directly to Vercel.

## P0
- [x] M1 Foundation and engine: scaffold, git (local only), fixtures, Zod contracts, normalization, grounding, rules, verdict
- [x] M1 CTO corrections:
  - supplier identity by unique name/alias only; ambiguous → REVIEW
  - sender is a claimed identity; missing sender → REVIEW
  - decimal-string money, exact minor-unit comparison
  - whole-token grounding for accounts, names, emails
  - beneficiary must match a labeled payee
  - AI-independent account cross-check
- [x] M2 AI integration:
  - `generateText` + `Output.object` (signature verified against installed ai@7.0.130)
  - no forced temperature; bounded schema retry; 45s timeout
  - content-free error logging
  - explicit-sample-only replay labeled "Offline replay — stored reference extraction, not live AI"
- [x] M3 UI: console, samples, loading/error states, verdict, evidence table, findings with request-vs-trusted, simulated gate, registry
- [x] M4 Tests: 84 passing, no network. Scenarios A–F, identity conflict, ambiguous/unknown supplier, ungrounded output, appended-digit account, truncated beneficiary, extended email domain, multiple accounts, malicious model, injection-obedient model, decimals, replay rules
- [x] M5 Browser QA (local production build): A/B/C/D/E verified; REVIEW gate approve flow; error state for arbitrary text; 375px layout, no horizontal overflow (nav wrap fixed)
- [ ] M6 **Deploy**: BLOCKED. The Vercel CLI needs a one-time login by the user (`! npx vercel login`). The MCP API would require inlining every source file.
- [x] **Live AI run**: `openai/gpt-5-mini` via the AI Gateway (free tier blocks Anthropic models; the default was changed to match)

## Phase 2: judge-ready submission (2026-10-08)
- [x] Baseline: lint, tsc, tests pass; repo clean of secrets (full history scanned); local == origin. **No Vercel project exists yet** (you deploy via GitHub).
- [x] Security gaps found and fixed (tests first):
  - decoy trusted account in a footer + different payee account → now HOLD
  - manual sender contradicting the document's From line → SENDER_CONFLICT + lookalike check
  - handler re-validates extractor output with Zod
  - malformed output and timeouts → error, never a result
- [x] Live evaluation (25 labeled synthetic cases, `pnpm eval`); 4 eval runs + 2 demo runs recorded in `eval/results/`:
  - first run 23/25 with 2 API errors → three fixes
  - final run 25/25, 13/13 held, 0 legitimate held, 0 non-legitimate passed
  - see EVALUATION.md
- [x] UI for judges: analyzed-request line, key evidence ≠ panel, "no record" panel for unknown suppliers, timed live progress state, 375px header overflow fixed
- [x] Real screenshots (local production build, live model): `submission-assets/screenshots/01–09`; architecture diagram `submission-assets/architecture.{svg,png}`
- [x] README rewritten; DEMO_SCRIPT.md, DEMO_SHOTLIST.md (with pre-recording checklist), DEVPOST_SUBMISSION.md
- [ ] **You:** deploy from GitHub with `AI_GATEWAY_API_KEY` set; share the URL so I can verify production
- [ ] **You:** record the video (OBS), upload, add links to README + Devpost; submit on Devpost

## Phase 3: landing page + product polish (2026-10-08)
- [x] Routes: `/` landing (route group `(marketing)`), `/app` console and `/suppliers` (`(product)` with a shared header), `/api/verify` unchanged
- [x] Landing:
  - nav and hero with an annotated invoice (real sample lines, registered values from fixtures, critical count from the engine)
  - showcase: the real ResultView on precomputed engine output, 3 tabs, no AI calls
  - problem section: IBAN character diff from eval case S4
  - 4-step pipeline (AI vs code)
  - capabilities: AI vs deterministic split, plus honest limits
  - CTA and footer with prototype disclosure
- [x] Design system: Instrument Serif display type, ≠ brand mark and icon, darker ink-3/ink-4 for contrast, global focus-visible ring, smooth scroll only without reduced motion
- [x] App polish: serif headings, a "Recommended action" line, a "Matched record" line, a "No payment account" key-evidence panel for missing accounts, Ref hidden in preview
- [x] SEO: title template, description, OG/Twitter metadata, generated `opengraph-image`, `icon.svg`
- [x] Browser QA (local production build, live gpt-5-mini):
  - A–F all expected verdicts
  - showcase tabs via mouse and keyboard
  - landing CTA → /app
  - no horizontal overflow at 375 and 768 on /, /app, /suppliers
  - 375px mobile hero and result checked
- [x] Screenshots: `submission-assets/screenshots/01–10` (app, refreshed) and `submission-assets/landing/L01–L08`
- Note: "first click ignored" seen during QA was the automation tool not delivering its first click after navigation. Instrumented: zero pointer events reached the page. Not an app bug; config unchanged.
- [ ] **You:** deploy (Vercel via GitHub) and send the URL for production verification
- [ ] GitHub link: hidden until the repo is public (set `githubUrl` in `src/site.ts`)

## P1 (only after P0 deployed)
- [ ] Text-based PDF upload (unpdf, in memory)
- [x] Larger labeled eval suite (25 cases), with results from real runs only
- [ ] Highlight excerpt locations in the source text
- [ ] Copy-report button

## Verification log
- 2026-10-08: `pnpm lint` clean · `pnpm exec tsc --noEmit` clean · `pnpm test` **92/92** (Phase 2) · `pnpm build` OK
- 2026-10-08: Mutation checks: disabling the account rule fails 3 tests; disabling grounding fails 5; disabling the AI-independent account cross-check fails the injection-obedient-model test
- 2026-10-08: `scripts/smoke.ts` on local `next start`: 6/6 expected verdicts in **replay** mode; arbitrary text → 502 EXTRACTION_FAILED; server log shows only `GatewayInternalServerError (HTTP 403)`, no request content
- 2026-10-08: Browser QA screenshots taken (Chrome, local production build)
- 2026-10-08: Live eval (`pnpm eval`, openai/gpt-5-mini) run 1: **5/6**. E → REVIEW because the model used the From display name ("Atlas Billing") as the supplier.
  - Fix: supplier identity also comes from registered names found in the text (unique match required), and `<` is accepted after a display name.
  - Fix: when the model reports the supplier as ambiguous, the request is still compared against the one registered supplier named in the text, with a REVIEW floor.
- 2026-10-08: Live eval runs 2–4 after the fixes: **6/6 each**. Run 2 showed B holding only on the lookalike domain (model said "ambiguous"), which prompted the second fix; runs 3–4 had full findings. Latency is about 10–16 s per request.
- 2026-10-08: `scripts/smoke.ts` on local `next start` in **live** mode: 6/6 expected verdicts.
- 2026-10-08: Browser test with an unseen request (new Kilima account, lookalike domain): live HOLD with ACCOUNT_MISMATCH and SENDER_DOMAIN_LOOKALIKE.
- Accuracy caveat: 6 synthetic samples plus 1 ad-hoc request are not a measure of real-world accuracy.
