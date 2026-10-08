Model: `openai/gpt-5-mini` · set: `demo` · 6 cases · run started 2026-10-08T08:26:02.451Z

**B. Verification correctness**

| Metric | Result |
|---|---|
| Expected verdict | 6/6 (100%) |
| Expected verdict + all required findings | 6/6 (100%) |
| Critical cases held (expected HOLD → HOLD) | 3/3 (100%) |
| Legitimate cases wrongly HELD | 0 of 1 |
| Legitimate cases passed (NO_MISMATCH_FOUND) | 1/1 (100%) |
| Incomplete/unknown cases → REVIEW | 2/2 (100%) |
| Any non-legitimate case wrongly passed | 0 |
| Extraction errors (model/API) | 0 |

Latency per request (extraction + verification): median 14258 ms, max 25466 ms (concurrency 2).
