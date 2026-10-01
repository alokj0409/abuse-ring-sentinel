# Baseline report — 2026-10-01

## Reproduction

Run `python -m sentinel.cli --data-dir . --output-dir artifacts/baseline` after installing the project and placing the two labeled IEEE-CIS train CSV files at the project root. Generated model weights, ring scores, and the full `summary.json` stay under ignored `artifacts/`.

The run used the 590,540 labeled transactions from `train_transaction.csv`, joined to `train_identity.csv`. The competition's unlabeled `test_*.csv` files were not used. There were **zero synthetic transactions** in training, validation, or test.

| Chronological partition | Transactions | Fraud transactions | Candidate rings | Positive rings |
| --- | ---: | ---: | ---: | ---: |
| Train (56%) | 330,702 | 11,180 | 6,614 | 364 |
| Validation (14%) | 82,676 | 3,358 | 4,807 | 343 |
| Final holdout (30%) | 177,162 | 6,125 | 5,277 | 325 |

The ring label is positive if **at least one** member transaction has `isFraud=1`. This is a proxy label because IEEE-CIS does not provide verified ring membership. Seven fingerprints are used; only values occurring 2–100 times in the training partition are allowed in any partition. Components larger than 500 transactions are excluded.

## Random Forest results

The model uses 13 ring features, 150 trees, maximum depth 10, balanced class weights, and seed 42. The threshold 0.493221 was chosen on validation to maximize F1, then frozen for the final holdout.

| Metric | Validation | Final holdout |
| --- | ---: | ---: |
| ROC-AUC | 0.7500 | 0.7558 |
| PR-AUC | 0.2201 | 0.1998 |
| Precision | 23.55% | 18.86% |
| Recall | 36.73% | 38.77% |
| F1 | 0.2870 | 0.2538 |
| True positives / false positives | 126 / 409 | 126 / 542 |
| False negatives / true negatives | 217 / 4,055 | 199 / 4,410 |

With uncalibrated review thresholds of 0.70 and 0.40, the 5,277 test rings fall into 71 hard-block-review, 1,101 step-up-review, and 4,105 allow-review suggestions. These are **not** safe automatic payment decisions.

## Coverage and limitations

- In the test period, two components exceed the 500-transaction cap and contain 58,325 transactions (32.9% of the holdout); 65,524 transactions are isolated. Only 53,313 transactions (30.1%) are in eligible candidate rings. The classifier metrics cover those candidate rings, not all transactions.
- The seven-link graph can merge otherwise unrelated accounts into large components. Phase 2 must compare link policies and measure fraud coverage before declaring ring discovery complete.
- Fingerprint vocabulary is frozen from model-training data. This avoids later-period frequency information leaking into training, but excludes novel fingerprints. Phase 2 must evaluate that tradeoff and whether bounded, time-windowed discovery is preferable.
- The 13 features have not been calibrated into probabilities; action thresholds are provisional.
- The original README/paper's GraphSAGE figures (ROC-AUC 0.7830, recall 63.43%) are not reproduced by the checked-in notebook and are not results of this run.
