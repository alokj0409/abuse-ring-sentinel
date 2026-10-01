# Abuse-Ring Sentinel

Abuse-Ring Sentinel is a research prototype for finding groups of related payment transactions and estimating whether a candidate group contains fraud. It uses the labeled IEEE-CIS Fraud Detection data for offline evaluation. It is not connected to Razorpay systems and does not block payments.

## Current state

The versioned Python pipeline loads the labeled transactions, makes a chronological 56% training / 14% validation / 30% test split, builds seven composite identity fingerprints, and learns allowable fingerprint values from the training period only. It discovers connected components of 2–500 transactions, extracts 13 ring-level features, trains a Random Forest baseline, chooses a classification threshold on validation data, and evaluates once on the held-out period. Synthetic transactions are not included in this benchmark.

A two-layer GraphSAGE model is sketched in the original notebook, but the checked-in notebook does not train or evaluate it. The IEEE paper is a draft and its headline GraphSAGE numbers are not independently reproduced by code in this repository. See [the phase reports](docs/PROGRESS.md) for verified results and [the decision log](docs/DECISIONS.md) for methodology choices.

The local React dashboard is an analyst-console prototype. Its ring list includes exported research examples, while some transactions, graph details, alerts, and health indicators are demonstration data. Backend scoring and live data integration are planned phases.

## Run the research baseline

Use Python 3.11 or newer. Download the [IEEE-CIS Fraud Detection dataset](https://www.kaggle.com/c/ieee-fraud-detection/data), accept the competition terms, and place `train_transaction.csv` and `train_identity.csv` in a local data directory. The competition's separate `test_*.csv` files have no public fraud labels and are not used for metrics.

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -e .
.venv\Scripts\python.exe -m unittest discover -s tests -v
.venv\Scripts\python.exe -m sentinel.cli --data-dir . --output-dir artifacts/baseline
```

The command saves a model, ring scores, and `summary.json` under `artifacts/baseline`. Generated artifacts and raw data are ignored by Git. The ring label is **positive if at least one member transaction is labeled fraud**; this is a research proxy, not a verified coordinated-fraud-ring label. The `HARD_BLOCK_REVIEW`, `STEP_UP_REVIEW`, and `ALLOW_REVIEW` tiers are review suggestions and are not calibrated or authorized for automated enforcement.

## Project layout

- `sentinel/`: repeatable data, fingerprint, graph, feature, and baseline code.
- `tests/`: leakage, typed-link, and metric checks.
- `Abuse_Ring_Sentinel_Pipeline.ipynb`: original exploratory notebook, retained for historical comparison.
- `ring_evidence_packages.json`: sample evidence extracted during exploration.
- `gemini_llm_investigation_reports.md`: sample investigation writeups.
- `Abuse_Ring_Sentinel_IEEE_Paper.tex`: research paper draft.
- `web/`: local analyst dashboard prototype.
- `docs/DECISIONS.md` and `docs/PROGRESS.md`: decisions and phase reports.

## Next phases

Typed candidate subgraphs and node features feed the planned GraphSAGE plus ring-feature model. Validation will set model and action thresholds before a final held-out evaluation. Evidence extraction, a server-side Gemini integration, an analyst API, dashboard integration, and failure analysis follow. Each completed phase is recorded in `docs/PROGRESS.md` and pushed to Git.
