# ProofPay — Tasks

Internal deadline: **Oct 10 2026, 5:00 PM EAT**. Plan: `~/.claude/plans/pasted-content-id-3adc-proofpay-twinkling-metcalfe.md`.

## P0
- [x] 1. Scaffold: Next 16.4, Tailwind 4, TS, vitest, zod, ai 7, git init
- [x] 2. Domain types and synthetic fixtures (3 suppliers, 6 samples)
- [x] 3. Engine (TDD): normalize, evidence grounding, signals, verify. Mutation-checked: disabling the account rule fails 3 tests; disabling grounding fails 5.
- [x] 4. AI adapter (`Extractor` interface; AI SDK 7 `Output.object` through the AI Gateway)
- [x] 5. `/api/verify` handler with input validation and route tests using mocked faithful, malicious, and failing extractors
- [x] 6. Labeled offline replay for bundled samples only (user text → 502, never fabricated)
- [x] 7. Result UI: verdict, evidence table, findings with observed vs trusted, payment gate, checks
- [x] 8. Input UI: samples, textarea, sender field, char limit, empty/loading/error states
- [x] 9. `/suppliers` registry page; responsive check at 390px
- [x] 10. Quality gates and browser QA (local production build)
- [ ] 11. **Live model run** (`pnpm eval`): BLOCKED on AI credentials
- [ ] 12. **Deploy to Vercel** and verify A/B/C/E on the production URL: BLOCKED on credentials and deploy approval

## P1 (after P0 is deployed)
- [ ] Text-based PDF upload (unpdf, in memory)
- [ ] Larger labeled eval suite, with results only from real runs
- [ ] Highlight excerpt locations in the source text
- [ ] Copy-report button, small polish

## Blockers
- No AI provider key on this machine. Need `AI_GATEWAY_API_KEY` (or OIDC via Vercel deployment).
- Deployment: Vercel MCP is authenticated (team `lijnatis-projects`). **No GitHub**, per the user: deploy directly via Vercel (MCP or CLI). Waiting on approval to create the project and deploy.

## Verification log
- 2026-10-08: `pnpm lint` clean · `pnpm typecheck` clean · `pnpm test` 61/61 passed · `pnpm build` succeeded
- 2026-10-08: `scripts/smoke.ts` against local `next start`: all 6 samples returned the expected verdict, **replay mode** (no key). Non-sample text → 502 EXTRACTION_FAILED as designed.
- 2026-10-08: Browser QA (Chrome, local production build): Demos A (NO_MISMATCH_FOUND), B (HOLD), and E (HOLD + injection) rendered correctly; mobile at 390px has no horizontal overflow; `/suppliers` OK; no console errors.
- Live-model extraction: **not yet run**.
