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
