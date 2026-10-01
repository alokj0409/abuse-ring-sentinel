# Phase reports

Update this file at each phase boundary. A phase is complete only when its deliverables and verification are recorded here and pushed to Git.

## Baseline audit — 2026-10-01

**Repository state:** `main` at `87ba9f5`; one commit and 10 tracked files. The local checkout matches `origin/main` before this work.

**Present:** IEEE-CIS notebook, chronological split, four active fingerprints, connected-component ring discovery, 13 ring features, executed Random Forest baseline, evidence JSON, saved Gemini reports, paper draft, and four figures. A local React dashboard exists but is ignored by Git.

**Gaps:** GraphSAGE is defined but not trained or evaluated in the checked-in notebook; seven fingerprints are documented but four are used; key published metrics disagree with notebook output; synthetic records are mixed into the saved model experiment; the web interface uses demo data and exposes a Gemini key; no backend, automated tests, or reproducible dependency setup is tracked.

## Delivery plan

| Phase | Deliverable | Status |
| --- | --- | --- |
| 1 | Freeze audit, secure source, align claims with evidence, establish project hygiene | Complete |
| 2 | Deterministic data loading, chronological split, seven fingerprints, typed ring discovery | Complete for offline research; coverage limit recorded |
| 3 | Ring and node features, leakage controls, baseline model, automated checks | Complete for research baseline |
| 4 | GraphSAGE training, validation, calibration, held-out evaluation | Complete for offline research |
| 5 | Evidence extraction, report generation, and analyst API | Complete for local research; live provider not verified |
| 6 | Dashboard integration and verifier workflow | Complete as offline sample viewer; review state browser-local |
| 7 | Failure analysis, reproducibility, revised paper and documentation | Complete except PDF compilation / deployed validation |

## Phase 1 report — 2026-10-01

- Added this phase log and the decision log. The README now identifies the actual prototype state and the research-only status of historical GraphSAGE claims.
- Added an installable Python package and six automated checks. The checks pass in the local virtual environment.
- Ran the new baseline on the full labeled IEEE-CIS data. See [the baseline report](BASELINE_REPORT_2026-10-01.md) for the split, metrics, and coverage limits.
- Removed the browser-embedded Gemini key from the local web source. The old generated Vercel output containing it was removed; it can be rebuilt. The owner still needs to rotate the original credential.
- Versioned web source and the lockfile; generated dependencies, builds, deployment state, and datasets remain ignored. The web production build passes.

**Git:** Pushed to `main` as commit `3a10dbb`. Further model claims depend on completing graph coverage and GraphSAGE evaluation.

## Phases 2 and 3 report — 2026-10-01

- Added seven typed fingerprints, a configurable component-link policy, and candidate coverage counts. The selected high-confidence policy is documented in [the graph comparison](GRAPH_POLICY_REPORT_2026-10-01.md).
- Added seven transaction node features, 13 ring-level features, and a typed GraphSAGE training implementation.
- Added a server-side Gemini report endpoint requiring separate analyst and provider credentials. No live provider call has been made.

## Phases 4–7 research-prototype report — 2026-10-01

- Ran Random Forest and typed GraphSAGE on identical 8,096 held-out candidate rings, with validation-only score calibration and threshold selection. [The model and failure report](MODEL_AND_FAILURE_REPORT_2026-10-01.md) records exact metrics, confusion counts, and coverage limits.
- GraphSAGE achieved ROC-AUC 0.7790, PR-AUC 0.3222, precision 25.6%, and ring recall 55.8%. Only 40.8% of fraud-labeled held-out transactions entered eligible candidate rings; model-positive rings contain 27.5% of all fraud-labeled test transactions.
- Exported 40 score-ranked, label-free held-out cases to the active web dashboard. Replaced the active hard-coded transaction/alert/graph claims with measured features and relationship counts. Added browser-local reviewer dispositions, search/filter, and optional server-side report generation for these cases.
- Wrote [a verified paper](../Abuse_Ring_Sentinel_Verified_Research_Paper.tex), preserving the original draft as historical. The editor compiler failed before source diagnostics because it could not find standard directories on this host; PDF compilation remains unverified.
- 13 Python tests, 4 API tests, and the web production build pass. The local full-data model and export runs completed. Server deployment, a live provider call, shared case persistence, online graph scoring, and payment integration were not performed.

**Git:** Graph/model phases 2–4 were pushed to `main` as `04897b4`. The dashboard, export, paper, and handoff are delivered in the following phase commit; see Git history for its exact hash.

## Remaining work before any production claim

Rotate the previously exposed Gemini key, provision fresh server credentials, deploy and verify the endpoint with the owner's infrastructure, perform a live report smoke test, implement causal rolling-window graph construction and low-latency scoring, add a shared authenticated case store and audit trail, independently validate coordinated-ring labels and business costs, approve thresholds with risk owners, and compile/review the new paper. None of these is implied by completion of the offline research prototype.
