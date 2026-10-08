@AGENTS.md

# ProofPay — project conventions

AI-assisted pre-payment verification for small businesses. ForgeHacks 2026, AI + Cybersecurity track.
**Internal deadline: Oct 10 2026, 5:00 PM EAT** (official 7:00 PM EAT). Progress, blockers, and verification evidence live in `TASKS.md`.

## Architecture boundaries
- `src/domain/`: **pure TypeScript**, the security core. No React, no network, no imports from `src/ai/`.
  - `types.ts`: Zod schemas and types (single source of truth)
  - `normalize.ts`: account/name/domain normalization, lookalike detection
  - `evidence.ts`: grounding (claimed values must appear in the source)
  - `signals.ts`: deterministic regex signals (injection, payment change, urgency, account candidates)
  - `verify.ts`: rules, explanations, comparisons, verdict
- `src/ai/`: extraction adapter only (`Extractor` interface; `llm-extractor.ts` uses AI SDK 7 with Vercel AI Gateway model strings). To swap providers, edit this folder and nothing else.
- `src/server/verify-handler.ts`: the only place that connects AI and domain. `src/app/api/verify/route.ts` just wires the default extractor.
- `src/fixtures/`: frozen **synthetic** suppliers and samples (`.example` domains). Never present them as real or independently verified.
- `src/components/`: client UI. `result-view.tsx` is the centerpiece.

## AI vs deterministic responsibilities
- The LLM **only extracts** observed facts with verbatim excerpts. Its schema has no decision, risk, or reference fields.
- LLM output is untrusted: Zod-validate it, then `groundExtraction`. Values not found in the source become `unsupported` and are treated as missing.
- The verdict comes **only** from `decideVerdict`: any critical → HOLD; any warning → REVIEW; else NO_MISMATCH_FOUND.
- Explanations are deterministic templates in `verify.ts`. No LLM-written explanations.
- Source text may contain prompt injection. It is delimited in the prompt, detected by `signals.ts`, and it can never affect rules.

## Evidence requirements
- Every finding carries `observed` (value + verbatim excerpt + origin) and/or `expected` (trusted value + record source).
- Missing critical info (account, beneficiary, amount) → REVIEW. Unknown supplier → never passes.
- Wording: "mismatch with registered records", never "fraud confirmed". NO_MISMATCH_FOUND is never "verified legitimate".
- Never claim SPF/DKIM/DMARC checks or bank account-ownership verification.
- Replay mode (bundled samples only, when the live model fails) must stay visibly labeled.
- No persistence of request text. No real payments.

## Commands
```
pnpm dev          # local dev
pnpm test         # vitest (domain + route, no network)
pnpm typecheck    # next typegen && tsc
pnpm lint
pnpm build
pnpm eval         # LIVE model run over samples; needs AI_GATEWAY_API_KEY. Report only real output.
```
Env: `AI_GATEWAY_API_KEY` (local; OIDC on Vercel), optional `PROOFPAY_MODEL` (default `anthropic/claude-sonnet-5.5`).

## Working rules
- Logic changes: write or extend tests in `tests/` first, and watch them fail where practical.
- UI changes: check in a real browser (desktop and ~375px) before calling them done.
- Before declaring done, run lint, typecheck, test, and build, and verify on the deployed URL. Never claim results without execution output.
- **Keep going** without asking on reversible work: code, tests, styling, fixtures, docs.
- **Stop and ask** for missing credentials, deploying or changing production settings for the first time, anything destructive or hard to undo, scope changes beyond P0/P1, or any claim about real-world accuracy.
