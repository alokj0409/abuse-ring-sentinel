# Held-out model and failure report — 2026-10-01

## Comparable experiment

Both classifiers use the same IEEE-CIS labeled train files, chronological 56/14/30 split, frozen training-only fingerprint vocabulary, three high-confidence component links, 2–500 transaction candidate size, and 8,096 held-out candidate rings. A ring is positive when any member transaction has `isFraud=1`. No synthetic transactions participate. Models, scalers, calibration, and classification thresholds are fit without held-out labels. The best GraphSAGE epoch (6 of 8) and both F1 thresholds were selected on the validation period.

| Held-out metric | Random Forest | Typed GraphSAGE |
| --- | ---: | ---: |
| Candidate rings / positive rings | 8,096 / 736 | 8,096 / 736 |
| ROC-AUC | 0.7618 | 0.7790 |
| PR-AUC | 0.3045 | 0.3222 |
| Brier score after validation calibration | 0.0739 | 0.0730 |
| Validation-selected threshold | 0.163780 | 0.163179 |
| Precision | 23.2% | 25.6% |
| Recall | 50.4% | 55.8% |
| F1 | 0.3180 | 0.3507 |
| TP / FP / FN / TN | 371 / 1,226 / 365 / 6,134 | 411 / 1,197 / 325 / 6,163 |

GraphSAGE improves ROC-AUC by 0.0172, PR-AUC by 0.0177, and ring recall by 5.4 percentage points on this single split and seed. These are candidate-ring metrics, not end-to-end transaction-fraud recall. Both models still make many false alarms, and the result is not an operational acceptance test.

## Coverage and errors

The held-out period has 6,125 fraud-labeled transactions. Only 2,497 (40.8%) belong to eligible candidate rings; 3,628 are outside them. GraphSAGE-positive rings contain 1,684 fraud-labeled transactions (27.5% of all held-out fraud transactions), versus 1,588 (25.9%) for Random Forest. This is a descriptive transaction-capture calculation over an offline full-period graph, not a prospective detection metric.

Both models miss 282 positive rings. GraphSAGE finds 83 positive rings missed by Random Forest; Random Forest finds 43 missed by GraphSAGE. The median false-negative ring has six transactions, while the median false-positive ring has 17. More diagnostic work is needed on missing identity fields, novel fingerprints, singleton fraud, and the component-size cap. The fixed training fingerprint vocabulary may reject legitimate new identities as well as dangerous broad links. A causal rolling-window graph is required before any online claim.

## Reproduce

Install the optional GNN dependencies from `pyproject.toml`, then run:

```powershell
python -m sentinel.cli --data-dir . --output-dir artifacts/baseline --link-policy high-confidence
python -m sentinel.gnn --data-dir . --output-dir artifacts/gnn --link-policy high-confidence --epochs 8 --batch-size 64
python -m sentinel.audit --baseline-dir artifacts/baseline --gnn-dir artifacts/gnn
python -m sentinel.export --data-dir . --model-dir artifacts/gnn --output web/src/data/researchResults.json
```

The local run used Python 3.12.14, NumPy 2.5.3, pandas 3.0.6, scikit-learn 1.9.1, PyTorch 2.14.1, and PyTorch Geometric 2.8.0.post1. The exported dashboard contains 40 label-free score-ranked examples; full score CSVs and model weights remain ignored local artifacts. Exact results may vary with dependency/runtime differences, particularly neural-network training.
