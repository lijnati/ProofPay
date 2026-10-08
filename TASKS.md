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
- [x] M4 Tests: 80 passing, no network. Scenarios A–F, identity conflict, ambiguous/unknown supplier, ungrounded output, appended-digit account, truncated beneficiary, extended email domain, multiple accounts, malicious model, injection-obedient model, decimals, replay rules
- [x] M5 Browser QA (local production build): A/B/C/D/E verified; REVIEW gate approve flow; error state for arbitrary text; 375px layout, no horizontal overflow (nav wrap fixed)
- [ ] M6 **Deploy**: BLOCKED. The Vercel CLI needs a one-time login by the user (`! npx vercel login`). The MCP API would require inlining every source file.
- [ ] **Live AI run** (`pnpm eval`): BLOCKED. No AI Gateway credentials locally (the gateway returns HTTP 403). It may work via OIDC once deployed, if the team has AI Gateway access.

## P1 (only after P0 deployed)
- [ ] Text-based PDF upload (unpdf, in memory)
- [ ] Larger labeled eval suite, with results from real runs only
- [ ] Highlight excerpt locations in the source text
- [ ] Copy-report button

## Verification log
- 2026-10-08: `pnpm lint` clean · `pnpm exec tsc --noEmit` clean · `pnpm test` **80/80** · `pnpm build` OK
- 2026-10-08: Mutation checks: disabling the account rule fails 3 tests; disabling grounding fails 5; disabling the AI-independent account cross-check fails the injection-obedient-model test
- 2026-10-08: `scripts/smoke.ts` on local `next start`: 6/6 expected verdicts in **replay** mode; arbitrary text → 502 EXTRACTION_FAILED; server log shows only `GatewayInternalServerError (HTTP 403)`, no request content
- 2026-10-08: Browser QA screenshots taken (Chrome, local production build)
- Live-model extraction: **never run so far**. No live accuracy claims.
