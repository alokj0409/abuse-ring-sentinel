# Abuse-Ring Sentinel

Abuse-Ring Sentinel is a research prototype for finding groups of related payment transactions and estimating whether a candidate group contains fraud. It uses the labeled IEEE-CIS Fraud Detection data for offline evaluation. It is not connected to Razorpay systems and does not block payments.

## Current state

The versioned Python pipeline loads the labeled transactions, makes a chronological 56% training / 14% validation / 30% test split, builds seven composite identity fingerprints, and learns allowable fingerprint values from the training period only. Device, strict-card, and address-plus-card links join connected components of 2–500 transactions; all seven relationship types remain available inside candidate rings. It extracts 13 ring-level features, trains a Random Forest baseline, chooses a classification threshold on validation data, and evaluates once on the held-out period. Synthetic transactions are not included in this benchmark.

The `sentinel.gnn` module implements typed two-layer GraphSAGE with seven node features and 13 ring features. On the same 8,096 held-out candidate rings as the calibrated Random Forest baseline, it reached ROC-AUC 0.7790, PR-AUC 0.3222, precision 25.6%, and ring recall 55.8%. These results do not measure end-to-end fraud detection: only 40.8% of fraud-labeled held-out transactions entered eligible rings. See [the model and failure report](docs/MODEL_AND_FAILURE_REPORT_2026-10-01.md), [the phase reports](docs/PROGRESS.md), [the graph policy comparison](docs/GRAPH_POLICY_REPORT_2026-10-01.md), and [the decision log](docs/DECISIONS.md).

The active React dashboard is an offline research viewer for 40 label-free held-out cases exported from the new GraphSAGE run. It displays measured ring features and relationship counts, plus browser-local analyst review status. Its optional server-side investigation endpoint can generate a draft report for those cases when an analyst access token and Gemini key are configured. A live provider call, deployment, shared case storage, live scoring, and payment integration have not been verified or implemented.

## Run the research baseline

Use Python 3.11 or newer. Download the [IEEE-CIS Fraud Detection dataset](https://www.kaggle.com/c/ieee-fraud-detection/data), accept the competition terms, and place `train_transaction.csv` and `train_identity.csv` in a local data directory. The competition's separate `test_*.csv` files have no public fraud labels and are not used for metrics.

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -e .
.venv\Scripts\python.exe -m unittest discover -s tests -v
.venv\Scripts\python.exe -m sentinel.cli --data-dir . --output-dir artifacts/baseline
```

The command saves a model, ring scores, and `summary.json` under `artifacts/baseline`. Generated artifacts and raw data are ignored by Git. The ring label is **positive if at least one member transaction is labeled fraud**; this is a research proxy, not a verified coordinated-fraud-ring label. Model probabilities are sigmoid-calibrated on validation data. Review tiers are illustrative and are not approved for automated enforcement.

To run the optional GraphSAGE model, install `pip install -e .[gnn]` and run `python -m sentinel.gnn --data-dir . --output-dir artifacts/gnn --epochs 8 --batch-size 64`. The model chooses an epoch, score calibration, and classification threshold on validation data before measuring the held-out test period. `python -m sentinel.audit --baseline-dir artifacts/baseline --gnn-dir artifacts/gnn` compares the same held-out rings. `python -m sentinel.export --data-dir . --model-dir artifacts/gnn --output web/src/data/researchResults.json` regenerates the dashboard's label-free case sample.

For local development of the dashboard, run `npm ci` and `npm run dev` in `web/`. `npm test` checks the report endpoint and `npm run build` verifies the browser bundle. Vercel is configured to serve the static app and its `api/investigate.mjs` function together, but no deployment has been verified. Set `GEMINI_API_KEY` and a separate `INVESTIGATOR_ACCESS_TOKEN` in the server environment to enable report generation; `GEMINI_MODEL` optionally overrides the model name. The browser does not receive the provider key. The previously browser-embedded key should be rotated by its owner. A static access token and browser-local dispositions are research-prototype controls, not production-grade access management or case persistence.

## Project layout

- `sentinel/`: repeatable data, fingerprint, graph, feature, baseline, and GraphSAGE code.
- `tests/`: leakage, typed-link, and metric checks.
- `Abuse_Ring_Sentinel_Pipeline.ipynb`: original exploratory notebook, retained for historical comparison.
- `ring_evidence_packages.json` and `gemini_llm_investigation_reports.md`: historical exploratory samples, not outputs of the new benchmark.
- `Abuse_Ring_Sentinel_IEEE_Paper.tex`: original unverified draft, preserved for reference.
- `Abuse_Ring_Sentinel_Verified_Research_Paper.tex`: new paper tied to the versioned experiment; PDF compilation is not yet verified.
- `web/`: offline held-out case viewer and optional report endpoint. The old `src/App.tsx` is historical demo code and is not the active entry point.
- `docs/DECISIONS.md`, `docs/PROGRESS.md`, and `docs/DEPLOYMENT_AND_HANDOFF.md`: decisions, phase reports, and deployment boundaries.

## Next phases

The offline research prototype's seven phases and their limits are recorded in `docs/PROGRESS.md`. Before any production claim, the project still needs causal streaming inference, independent ring labels and cost validation, approved operating thresholds, authenticated shared case management, secret rotation, provider/deployment checks, and integration with real transaction systems.
