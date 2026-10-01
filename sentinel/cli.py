"""Repeatable command-line entry point for the research baseline."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib

from sentinel.benchmark import score_baseline, train_baseline
from sentinel.data import chronological_split, load_ieee
from sentinel.features import extract_ring_features
from sentinel.graph import FINGERPRINTS, apply_vocabulary, discover_rings, learn_vocabulary, make_fingerprints


def run_benchmark(data_dir: Path, output_dir: Path, max_ring_size: int = 500) -> dict:
    frame = load_ieee(data_dir)
    partitions = chronological_split(frame)
    fingerprints = {name: make_fingerprints(getattr(partitions, name)) for name in ("train", "validation", "test")}
    vocabulary = learn_vocabulary(fingerprints["train"])
    filtered = {name: apply_vocabulary(fingerprints[name], vocabulary) for name in fingerprints}
    discovered = {name: discover_rings(filtered[name], max_size=max_ring_size) for name in filtered}
    ring_data = {name: extract_ring_features(filtered[name], discovered[name]) for name in filtered}
    baseline = train_baseline(ring_data["train"], ring_data["validation"])
    scored, test_metrics = score_baseline(baseline, ring_data["test"])

    output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(baseline.model, output_dir / "random_forest.joblib")
    scored.to_csv(output_dir / "test_ring_scores.csv", index=False)

    def partition_info(name: str) -> dict:
        period = getattr(partitions, name)
        result = discovered[name]
        return {
            "transactions": len(period),
            "fraud_transactions": int(period["isFraud"].sum()),
            "first_transaction_dt": int(period["TransactionDT"].min()),
            "last_transaction_dt": int(period["TransactionDT"].max()),
            "candidate_rings": len(result.rings),
            "fraud_rings": int(ring_data[name]["is_fraud_ring"].sum()),
            "isolated_transactions": result.isolated_transactions,
            "oversized_components": result.oversized_components,
            "oversized_transactions": result.oversized_transactions,
            "fingerprint_groups": result.fingerprint_groups,
        }

    summary = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset": "IEEE-CIS train_transaction.csv + train_identity.csv",
        "split": "chronological 56% train, 14% validation, 30% test; ties by TransactionID",
        "fingerprint_policy": "seven types; allowed frequency 2-100 learned from train only",
        "ring_policy": f"connected components with 2-{max_ring_size} transactions; oversized components excluded",
        "label": "positive ring if at least one transaction has isFraud=1",
        "synthetic_transactions": 0,
        "action_policy": "0.70 hard-block review, 0.40 step-up review; scores are not yet calibrated for automatic action",
        "vocabulary_size": {name: len(vocabulary[name]) for name in FINGERPRINTS},
        "partitions": {name: partition_info(name) for name in partitions.counts()},
        "model": "RandomForestClassifier(n_estimators=150, max_depth=10, class_weight='balanced', random_state=42)",
        "validation_metrics": baseline.validation_metrics,
        "test_metrics": test_metrics,
        "action_tiers": scored["action_tier"].value_counts().to_dict(),
    }
    (output_dir / "summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Abuse-Ring Sentinel research pipeline")
    parser.add_argument("--data-dir", type=Path, required=True, help="Directory containing labeled IEEE-CIS train CSV files")
    parser.add_argument("--output-dir", type=Path, default=Path("artifacts/baseline"))
    parser.add_argument("--max-ring-size", type=int, default=500)
    args = parser.parse_args()
    print(json.dumps(run_benchmark(args.data_dir, args.output_dir, args.max_ring_size), indent=2))


if __name__ == "__main__":
    main()
