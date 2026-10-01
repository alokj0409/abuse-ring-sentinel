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
| 2 | Deterministic data loading, chronological split, seven fingerprints, typed ring discovery | In progress: graph coverage needs improvement |
| 3 | Ring and node features, leakage controls, baseline model, automated checks | In progress: baseline verified; node features pending |
| 4 | GraphSAGE training, validation, calibration, held-out evaluation | Planned |
| 5 | Evidence extraction, report generation, and analyst API | Planned |
| 6 | Dashboard integration and verifier workflow | Planned |
| 7 | Failure analysis, efficiency profile, final paper and documentation | Planned |

## Phase 1 report — 2026-10-01

- Added this phase log and the decision log. The README now identifies the actual prototype state and the research-only status of historical GraphSAGE claims.
- Added an installable Python package and six automated checks. The checks pass in the local virtual environment.
- Ran the new baseline on the full labeled IEEE-CIS data. See [the baseline report](BASELINE_REPORT_2026-10-01.md) for the split, metrics, and coverage limits.
- Removed the browser-embedded Gemini key from the local web source. The old generated Vercel output containing it was removed; it can be rebuilt. The owner still needs to rotate the original credential.
- Versioned web source and the lockfile; generated dependencies, builds, deployment state, and datasets remain ignored. The web production build passes.

**Gate:** This phase can be committed and pushed. Further model claims depend on completing graph coverage and GraphSAGE evaluation.
