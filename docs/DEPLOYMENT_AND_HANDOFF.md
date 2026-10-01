# Research prototype handoff

This repository now contains a reproducible offline model pipeline and a static held-out case viewer. It is **not** a payment-risk production system. The Git repository deliberately excludes the IEEE-CIS CSV files, model weights, full score artifacts, local virtual environment, and provider secrets.

## Verify locally

1. Install Python dependencies from `pyproject.toml` and run `python -m unittest discover -s tests -v`.
2. With the competition's labeled train files placed locally, run the baseline and GraphSAGE commands in the README. Review their ignored `summary.json` files and compare them with `python -m sentinel.audit`.
3. In `web/`, run `npm ci`, `npm test`, and `npm run build`. The active entry point is `src/ResearchApp.tsx`; `src/App.tsx` is historical demo code.
4. Regenerate `src/data/researchResults.json` with `python -m sentinel.export` after a new model run. The committed 40-case sample has no case-level fraud labels or raw identity fingerprint values.

## Optional report endpoint

The Vercel configuration declares a static Vite build and `api/investigate.mjs`. Set `INVESTIGATOR_ACCESS_TOKEN` and a freshly issued `GEMINI_API_KEY` as server environment variables, never as `VITE_` variables or browser source. `GEMINI_MODEL` can override the server's default model. The endpoint accepts only a ring ID in the committed sample; it ignores client-supplied prompts and chooses evidence server-side. The browser sends the analyst token only in the request header and does not persist it. A mocked provider response is tested; an actual provider call and hosted deployment have not been verified.

The old browser-embedded Gemini key must be rotated by its owner before any hosted use. A static bearer token without per-user identity, rate limiting, or an audit log is not suitable for a shared production service.

## Boundaries for next owner

- Implement chronological rolling-window graph updates; the present graph is built over each complete offline period.
- Improve candidate coverage and separately measure transaction-level detection. The current graph excludes 3,628 of 6,125 fraud-labeled held-out transactions.
- Obtain independent coordinated-abuse annotations and business-cost review. The any-fraud ring label is only a proxy.
- Build authenticated per-analyst access, server-side case persistence, audit events, and report retention rules. The current review dropdown stores state only in the browser.
- Validate provider output, deployed routing, abuse controls, model calibration, and threshold costs before a pilot. Do not connect an enforcement action to the research tiers.
- Compile and editorially review `Abuse_Ring_Sentinel_Verified_Research_Paper.tex`. The built-in compiler failed at host setup before it produced source diagnostics.
