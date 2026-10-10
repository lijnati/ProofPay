# ProofPay — final submission checklist

Checked 2026-10-10, ~16:10 EAT. Deadline: **19:00 EAT** (internal target 17:00).
Legend: ✅ verified · ⚠️ your action · ❌ missing

## Required for Devpost

| Item | Status | Evidence / action |
|---|---|---|
| Track: **AI + Cybersecurity** | ⚠️ | Select it on the Devpost form |
| Participant: solo, profile complete | ⚠️ | Make sure your Devpost profile is complete and you are the only team member. ForgeHacks is student-focused (teams of 1–4), so fill in any eligibility fields Devpost asks for |
| Project name and tagline | ✅ | `submission/DEVPOST_SUBMISSION.md` §1–2 |
| Devpost answers (pitch → AI + Cybersecurity fit) | ✅ | `submission/DEVPOST_SUBMISSION.md` §3–13, ready to paste |
| Public GitHub repo | ✅ / ⚠️ | https://github.com/lijnati/ProofPay returns 200 without login. **Push needed:** local `main` is 2 commits ahead (demo tooling, README links, `submission/`, GitHub link in footer). Until you push, the README on GitHub has no live/video links and its lead screenshot won't load |
| Working deployment | ✅ | https://proofpay.xylolabs.space: `/`, `/app`, `/suppliers` all 200 without login. `pnpm smoke` against production: **6/6 expected verdicts, all live** (`openai/gpt-5-mini`, 9.8–12.5 s). The HOLD screenshots were taken from production with live extraction |
| Public demo video (2–4 min) | ✅ | https://youtu.be/jkS8qjCmUzs resolves publicly (YouTube oEmbed, channel "EthosBase"). Local cut is 2:46. ⚠️ Open it once in a private window to confirm it plays and is Public/Unlisted per the rules |
| Screenshots | ✅ | `submission/assets/`: 01 landing, 02 console, 03 HOLD account mismatch, 04 evidence comparison, 05 payment gate (01–05 captured from **production** today), 06 architecture, 07 no mismatch, 08 review, 09 prompt injection, 10 video thumbnail. Upload 03 first (lead image) |
| Technology tags | ✅ | §7: `nextjs react typescript tailwindcss vercel ai-sdk vercel-ai-gateway openai gpt-5-mini zod vitest claude-code` |

## Repository and quality checks (run 2026-10-10)

| Check | Result |
|---|---|
| `pnpm lint` | ✅ clean |
| `pnpm typecheck` | ✅ clean |
| `pnpm test` | ✅ 92/92 (5 files) |
| `pnpm build` | ✅ OK (re-run after the `site.ts` change) |
| Credentials | ✅ `.env.local` is gitignored and not in the tree. Full-history scan found only the placeholder `AI_GATEWAY_API_KEY=... pnpm eval`. No keys in demo tooling |
| Sensitive data | ✅ Fixtures and screenshots are synthetic (`.example` domains, fictional names) |
| Live vs replay | ✅ Production runs show "Live AI extraction · openai/gpt-5-mini". Replay is labeled and limited to unedited samples. The video badges label every sped-up wait |
| Wording | ✅ "No mismatch against registered records", never "safe". No claims of SPF/DKIM, account-ownership checks, bank integration, real payments, or guaranteed prevention |
| README links | ✅ No placeholders. Live, video and repo links added. All local image/link paths resolve |

## Your remaining steps (in order)

1. **Push** (≈1 min): `git push origin main`. Then check that https://github.com/lijnati/ProofPay shows the new README with the screenshot.
2. **Redeploy** happens automatically from the push. It turns on the footer GitHub link (`src/site.ts`). Optional: the site already works without it.
3. **Devpost** → https://forgehacks-2026.devpost.com → *Enter a submission* / your draft:
   1. Project name **ProofPay**, tagline from §2.
   2. Paste §3–13 into the matching story fields. Put "Real-world impact" and "Why it fits AI + Cybersecurity" under the story if there are no dedicated fields.
   3. "Built with": tags from §7.
   4. Upload images from `submission/assets/` (03 first).
   5. Video: `https://youtu.be/jkS8qjCmUzs`.
   6. Links: try-it link `https://proofpay.xylolabs.space`, code `https://github.com/lijnati/ProofPay`.
   7. Track: **AI + Cybersecurity**. Answer any additional questions on the form.
   8. Preview → **Submit** before **17:00 EAT** (hard deadline 19:00).
4. After submitting: open the public project page in a private window and click all three links once.
