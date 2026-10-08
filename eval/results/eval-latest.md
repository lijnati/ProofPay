Model: `openai/gpt-5-mini` · set: `eval` · 25 cases · run started 2026-10-08T08:22:44.744Z

**B. Verification correctness**

| Metric | Result |
|---|---|
| Expected verdict | 25/25 (100%) |
| Expected verdict + all required findings | 25/25 (100%) |
| Critical cases held (expected HOLD → HOLD) | 13/13 (100%) |
| Legitimate cases wrongly HELD | 0 of 6 |
| Legitimate cases passed (NO_MISMATCH_FOUND) | 6/6 (100%) |
| Incomplete/unknown cases → REVIEW | 6/6 (100%) |
| Any non-legitimate case wrongly passed | 0 |
| Extraction errors (model/API) | 0 |

**A. Extraction quality (after grounding)**

| Field | Correct |
|---|---|
| supplier | 25/25 (100%) |
| account | 23/24 (96%) |
| beneficiary | 25/25 (100%) |
| amount | 25/25 (100%) |
| currency | 25/25 (100%) |
| Model claims rejected by grounding | 3 field(s) across 3 case(s) |

Latency per request (extraction + verification): median 13372 ms, max 28745 ms (concurrency 2).
