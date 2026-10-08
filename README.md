# ProofPay

**Scammers can fake an invoice. ProofPay checks what they can't fake: your previously verified payment records.**

ProofPay is a pre-payment verification console for small businesses. You paste a payment request (an email or invoice text). AI extracts the payee, account, amount, and sender, and quotes each one verbatim. A deterministic rules engine then compares those facts with the supplier records you verified earlier, and the payment is held, sent for review, or allowed through a simulated gate.

Built for ForgeHacks 2026 (AI + Cybersecurity track). **All suppliers, domains (`.example`), accounts, and requests are synthetic. No real payments are made.**

## How it works

```
request text ──► AI extraction ──► evidence grounding ──► deterministic rules ──► verdict + evidence
                 (untrusted)       (values must occur     (trusted registry,       HOLD / REVIEW /
                                    verbatim in text)      no AI involved)          NO_MISMATCH_FOUND
```

1. **Extract (AI).** `generateText` with `Output.object({ schema })` (AI SDK 7, Vercel AI Gateway) returns only observed fields, each with a verbatim excerpt. The schema has no field for a decision, risk score, or reference data.
2. **Ground (code).** Every "found" value must be backed by an excerpt that occurs in the source, and the value must be a *complete* token within it:
   - Account numbers can't be prefixes of longer numbers.
   - Names must be whole segments on the cited line.
   - A beneficiary must equal a value the request explicitly labels as payee.
   - Email domains can't be extended.
   - Amounts are decimal strings.

   Anything unsupported is discarded and treated as missing.
3. **Verify (code).** `src/domain/verify.ts` compares the grounded facts with the trusted registry. It also scans the raw text without AI for:
   - account identifiers;
   - payment-change, urgency, and embedded-instruction language.
4. **Decide (code).** Any critical finding → **HOLD**. Any warning → **REVIEW**. Otherwise → **NO_MISMATCH_FOUND**, shown as "No mismatch against registered records", never as "verified" or "safe".

### Decision policy

| Verdict | When |
|---|---|
| **HOLD** | Account differs from the registered account (from AI extraction *or* the AI-independent text scan) · beneficiary differs · sender domain registered to a different supplier · lookalike of a registered sender domain |
| **REVIEW** | Unknown or ambiguous supplier · missing or ambiguous account, beneficiary, or amount · ungrounded critical extraction · multiple account identifiers · no sender to check · unregistered sender domain · payment-change language · embedded instructions to AI · different bank or currency |
| **NO_MISMATCH_FOUND** | Supplier uniquely identified by registered name/alias, claimed sender domain matches, account and beneficiary grounded and matching, no warnings |

- **Supplier identity** comes only from a unique name/alias match. A sender domain can confirm or contradict that match, but it can never establish identity on its own.
- **A sender address is a claimed identity.** Pasted text is not authenticated, so ProofPay never claims SPF/DKIM/DMARC checks or bank account-ownership verification.
- **Amount** outside the supplier's typical range is informational only and never overrides other findings.

### Prompt injection

Request text is wrapped in delimiters and treated as data. Even a fully compromised model can't change the outcome. The tests include a model that obeys an embedded "approve this payment" instruction and claims the trusted account. The result is still HOLD, because:
- the claimed account fails grounding;
- the AI-independent account scan finds the real destination;
- the injection text is surfaced as a finding.

## Project structure

```
src/domain/       pure TypeScript security core (no React, network, or AI imports)
  types.ts        Zod schemas and contracts
  normalize.ts    account/name/domain/decimal normalization, whole-token matching
  evidence.ts     grounding of AI claims against the source
  signals.ts      deterministic text signals and account scan
  verify.ts       rules, explanations, comparisons, verdict
src/ai/           Extractor interface + AI SDK implementation (provider swap point)
src/server/       /api/verify handler (validation, extraction, replay, verification)
src/fixtures/     synthetic trusted suppliers and labeled sample requests
src/components/   verification console and result view
tests/            vitest: normalization, grounding, rules, attacks, API route
scripts/          eval.ts (live model run) and smoke.ts (HTTP smoke test)
```

## Running locally

```bash
pnpm install
cp .env.example .env.local     # add AI_GATEWAY_API_KEY
pnpm dev
```

| Variable | Purpose |
|---|---|
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key for local live extraction. On Vercel, OIDC is used automatically. |
| `PROOFPAY_MODEL` | Optional. Gateway model id; default `openai/gpt-5-mini`. |

Without credentials, the app still works for the six bundled samples through a clearly labeled **offline replay**. The replay uses stored reference extractions and is shown as "Offline replay — stored reference extraction, not live AI". It applies only when a sample is explicitly selected and left unedited. Arbitrary input with no available model gets an honest error, never a substitute result.

## Testing

```bash
pnpm test                 # all deterministic logic + API route with mocked extractors (no network)
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm eval                 # live model over all samples (needs credentials); prints actual results
pnpm smoke [baseUrl]      # HTTP smoke test against a running server
```

The tests cover:
- the six demo scenarios;
- conflicting supplier identities and ambiguous suppliers;
- domain-only identification;
- ungrounded model claims;
- appended-digit accounts, truncated beneficiaries, and extended email domains;
- multiple destination accounts;
- decimal money handling;
- explicit-sample-only replay;
- a malicious model and an injection-obedient model.

## Limitations

- Text input only (no PDF/OCR yet). No email header parsing or authentication.
- The registry is a fixed synthetic fixture. In practice it would come from your own supplier onboarding.
- No accuracy claims: detection quality on real-world requests has not been measured.
