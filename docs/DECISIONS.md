# Decision log

This file records choices that change the meaning of results or the project architecture. Each entry states the evidence and consequence so later phases can be reviewed.

## 2026-10-01 — Verification standard for published metrics

- **Decision:** Treat a metric as verified only when checked-in code produces it from a documented dataset split with a repeatable command.
- **Evidence:** The saved notebook reports 7,337 test candidate rings and a Random Forest ROC-AUC of 0.7593. It defines a GraphSAGE class but contains no GraphSAGE training or evaluation loop. The original README and paper instead claim 7,301 rings, Random Forest ROC-AUC 0.7405, and GraphSAGE ROC-AUC 0.7830.
- **Consequence:** Historical figures remain labeled as unverified until a clean run reproduces them. Reports must identify the dataset, split, label definition, sample counts, and synthetic-data policy.

## 2026-10-01 — Separate synthetic discovery tests from classifier evaluation

- **Decision:** Keep synthetic rings only in an explicit graph-discovery test; train and evaluate ring classifiers on the original labeled data.
- **Evidence:** The notebook injects 60 synthetic fraud rings into each chronological partition, and its saved output has inconsistent transaction counts in one evaluation cell.
- **Consequence:** The 100% synthetic ring recall is a controlled discovery check, not evidence of real-world fraud classification performance.

## 2026-10-01 — Build the pipeline before integrating the dashboard

- **Decision:** The reproducible data and model pipeline defines the schema consumed by the dashboard. The frontend must not represent hard-coded demo values as live system state.
- **Evidence:** The local dashboard mixes 20 exported ring records with hard-coded transactions, alerts, graphs, and service-health values. It is excluded from Git.
- **Consequence:** Later phases will use versioned result artifacts and a backend API. The demo will identify sample data until live integration is available.

## 2026-10-01 — Keep secrets on the server

- **Decision:** Gemini credentials must be supplied through a server environment variable and never bundled into browser JavaScript.
- **Evidence:** The local web source contains a client-side API key literal.
- **Consequence:** The key must be rotated by its owner; the frontend will call a backend endpoint after that integration exists.

## 2026-10-01 — Version the dashboard source

- **Decision:** Track the `web/` source, configuration, and lockfile. Continue excluding dependencies, build products, and local deployment state.
- **Evidence:** The user requested that completed project work be pushed to Git, while the original `.gitignore` excluded the entire web app.
- **Consequence:** The first phase commit includes the dashboard prototype after removing its embedded API key. The source of truth is the repository, not an ignored local folder.

## 2026-10-01 — Use high-confidence links for component membership

- **Decision:** Device, strict card, and address-plus-card links join candidate components. All seven fingerprint types are retained as typed evidence within each candidate.
- **Evidence:** Joining all seven types left 58,325 test transactions inside oversized components. The three-link policy reduced that to 2,989 and increased eligible candidate transactions from 53,313 to 85,174. See [the policy comparison](GRAPH_POLICY_REPORT_2026-10-01.md).
- **Consequence:** The three-link policy is the default for subsequent baseline and GraphSAGE runs. The coverage of fraud transactions remains only 40.8% and must be reported separately from ring-classification metrics.

## 2026-10-01 — Keep a frozen vocabulary for the main benchmark

- **Decision:** The primary benchmark accepts fingerprint values learned only from the model-training partition. A period-local frequency filter is available only as an offline sensitivity experiment.
- **Evidence:** Period-local filtering used the complete later-period graph yet covered slightly fewer fraud transactions and created a larger oversized component in the test period.
- **Consequence:** Main results avoid relying on unseen future-period membership. A causal rolling-window policy is a separate future experiment.

## 2026-10-01 — Calibrate on validation; keep review tiers advisory

- **Decision:** Fit a sigmoid score calibrator on validation predictions for each model, then choose its F1 classification threshold on validation. Use 0.40 and 0.70 only as illustrative human-review tiers, never as automatic payment actions.
- **Evidence:** Raw GraphSAGE scores had a held-out Brier score of 0.1579; validation-only calibration reduced it to 0.0730. The held-out F1 threshold was approximately 0.163, far below either illustrative tier boundary.
- **Consequence:** Ranking metrics are unchanged by monotone calibration, but displayed probabilities are more interpretable on this single held-out period. Real-world calibration and action costs still require independent validation.

## 2026-10-01 — Replace illustrative case claims with exported held-out evidence

- **Decision:** The active dashboard consumes 40 cases exported from the new held-out GraphSAGE score file: top 25, ten middle-ranked, and five lowest-ranked scores. Selection does not use labels. The old monolithic demo screen and historical evidence package remain in the repository for reference, but are no longer the active UI or report source.
- **Evidence:** The prior investigation screen contained hard-coded topology, transactions, currency, action outcomes, and feature-attribution claims unrelated to the selected ring.
- **Consequence:** The active UI shows only available measurements, explicitly labels offline research, and never sends fraud labels or raw fingerprint values to the report provider. Its verifier state is browser-local, not a shared case-management record.

## 2026-10-01 — Preserve the original paper as an unverified draft

- **Decision:** Publish a separate verified research paper tied to the versioned pipeline. Preserve the original paper and figures as historical exploration rather than silently replacing them.
- **Evidence:** The original draft describes a 70/30 split, a different architecture, and model/operational numbers unsupported by the saved notebook or new run.
- **Consequence:** New claims cite the comparable 8,096-ring experiment and coverage limits. The built-in LaTeX compiler could not run in this host environment, so PDF compilation remains unverified.
