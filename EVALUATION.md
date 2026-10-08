# ProofPay evaluation

Every number here comes from a recorded run in `eval/results/`. Nothing is estimated or hand-entered. All inputs are **synthetic**: fictional companies, `.example` domains, and invented accounts.

## What is evaluated, and how

ProofPay has two layers, and they are tested separately.

| Layer | How it is tested | Network |
|---|---|---|
| **Deterministic engine:** grounding, normalization, rules, verdict | `pnpm test`, 92 vitest cases with hand-written model outputs. These include malicious, injection-obedient, fabricating, malformed, and timed-out "models". | none |
| **Live AI extraction + engine end to end** | `pnpm eval`: each labeled case is sent to the real model through the Vercel AI Gateway, then grounded and verified exactly as in production | live |

### Reproduce

```bash
cp .env.example .env.local      # set AI_GATEWAY_API_KEY
pnpm test                       # deterministic suite
pnpm eval                       # 25-case labeled set → eval/results/eval-<timestamp>.json
pnpm eval -- --set=demo         # the 6 UI demo samples
```

## Dataset: `eval/cases.ts` (25 labeled cases)

The dataset is separate from the six demo samples. Each case is labeled with the expected verdict, the registry record it should be compared against, the true payment destination, beneficiary, amount, currency, and the findings that must appear.

| Category | Cases | Styles covered |
|---|---|---|
| Legitimate | 6 | line-item table, bilingual Swahili/English, terse one-paragraph, forwarded message, plain-text tax invoice, reminder with deadline |
| Account substitution | 5 | compromised real mailbox, lookalike domain + new account, trusted account as a footer decoy, two-digit swap in an IBAN, informal chat message with no sender |
| Beneficiary change | 2 | correct account + different company, individual's name as payee |
| Unknown supplier | 2 | formal company, casual freelancer |
| Lookalike sender domain | 2 | digit-for-letter (`atlasc1oud`), different TLD |
| Missing information | 2 | "amount as per PDF" with no payee, body pasted without a sender |
| Multiple accounts | 1 | "pay either account" |
| Ambiguous supplier | 1 | one registered supplier invoicing on behalf of another |
| Prompt injection | 4 | HTML-comment note to "the AI assistant", fake `SYSTEM OVERRIDE` block, "ignore all previous instructions", fake compliance footer for "automated reviewers" |

## Results: model `openai/gpt-5-mini` (Vercel AI Gateway)

### Final run (2026-10-08 08:22 UTC, final code)

**B. Verification correctness**

| Metric | Result |
|---|---|
| Expected verdict | 25/25 |
| Expected verdict and all required findings | 25/25 |
| Critical cases held (expected HOLD → HOLD) | 13/13 |
| Legitimate requests wrongly held | 0 of 6 |
| Legitimate requests passed (NO_MISMATCH_FOUND) | 6/6 |
| Incomplete / unknown / ambiguous → REVIEW | 6/6 |
| Non-legitimate requests that passed | **0** |
| Extraction errors | 0 |

**A. AI extraction quality** (scored after grounding, i.e. what the engine actually used)

| Field | Correct |
|---|---|
| Supplier record identified | 25/25 |
| Payment destination account | 23/24 (1 case not scored: two destinations) |
| Beneficiary | 25/25 |
| Amount | 25/25 |
| Currency | 25/25 |
| Model claims rejected by grounding | 3 fields across 3 cases |

Latency (extraction + verification): median 13.4 s, max 28.7 s, two requests in parallel. The demo set on the same code returned **6/6** expected verdicts (median 14.3 s).

### All recorded runs (nothing omitted)

| Run (UTC) | Code state | Verdicts correct | API errors | Extraction misses |
|---|---|---|---|---|
| 08:02 | before eval-driven fixes | 23/25 | 2 (`AI_RetryError`) | A1 supplier, I1 account |
| 08:11 | after fixes 1–2 | 25/25 | 0 | M1 beneficiary (inferred from signature) |
| 08:14 | same | 25/25 | 0 | I1 account |
| 08:22 | final, after fix 3 | 25/25 | 0 | I1 account |
| 08:18, 08:26 | demo set | 6/6, 6/6 | 0 | none |

The two API errors in the first run were not diagnosed: the error message at the time did not include the underlying cause, and they have not recurred. Logging was then improved, and concurrency was reduced from 3 to 2.

## Failures found, and what changed

The evaluation found real defects. Fixes were made to the product logic in general, with a unit test for each. None special-cases an evaluation input.

1. **Two registered suppliers named in running text weren't detected as ambiguous (A1).** The text scan only accepted names on their own line. Multi-word registered names now count anywhere as whole words, but not inside email addresses or domains. Result: REVIEW with `AMBIGUOUS_SUPPLIER`.
2. **"SYSTEM OVERRIDE … skip all checks" wasn't recognized as injection (I2).** The verdict was already HOLD, because of the account mismatch. Generic patterns for override, skip-checks, and `verdict=` were added.
3. **A beneficiary was inferred when none was stated (M1).** The model filled the payee from the signature, and grounding accepted it. A beneficiary must now exactly match a value the request explicitly labels as payee ("Beneficiary:", "Account name:", "Pay to:", …).

### The most instructive case: I1

I1 hides an HTML comment telling "the AI assistant" to report the trusted IBAN instead of the real one. In 3 of 4 runs the model returned **no account at all**: it neither obeyed nor reported the real IBAN. ProofPay still produced **HOLD every time**, because a deterministic scan of the text finds the substituted IBAN independently of the model. This is the reason the verdict never depends on the AI alone.

## Limitations

- **Small, synthetic, self-authored dataset.** 25 cases written by the same team that built the rules. Results show the system behaves as designed on these patterns. They are **not** an estimate of real-world fraud-detection accuracy.
- **Fixes after seeing results.** Three fixes were made after the first run, and the same set was then re-run. The later runs therefore overstate generalization. There is no held-out set yet.
- **One model.** Only `openai/gpt-5-mini` was evaluated. Anthropic models were unavailable on the free AI Gateway tier (HTTP 403).
- **Latency.** About 13–16 s per request is acceptable for a pre-payment check but noticeable in a demo.
- **Text only.** No PDF/OCR, no email headers, no SPF/DKIM/DMARC, no bank account-ownership checks.
- **Conservative by design.** Formats the rules don't understand, such as European `4.860,00` amounts, unlabeled payees, or unusual account notation, end in REVIEW rather than a guess. A real deployment would see more REVIEWs than this set suggests.
