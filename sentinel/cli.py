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
from sentinel.graph import FINGERPRINTS, apply_vocabulary, discover_rings, filter_period_frequencies, learn_vocabulary, make_fingerprints


LINK_POLICIES = {
    "all": tuple(FINGERPRINTS),
    "high-confidence": ("device", "card_strict", "address_card"),
    "legacy-four": ("device", "card_strict", "address_card", "network"),
}


def run_benchmark(
    data_dir: Path, output_dir: Path, max_ring_size: int = 500,
    link_policy: str = "high-confidence", frequency_policy: str = "frozen-vocabulary",
) -> dict:
    if link_policy not in LINK_POLICIES:
        raise ValueError(f"Unknown link policy: {link_policy}")
    if frequency_policy not in ("frozen-vocabulary", "period-local"):
        raise ValueError(f"Unknown frequency policy: {frequency_policy}")
    frame = load_ieee(data_dir)
    partitions = chronological_split(frame)
    fingerprints = {name: make_fingerprints(getattr(partitions, name)) for name in ("train", "validation", "test")}
    vocabulary = learn_vocabulary(fingerprints["train"])
    if frequency_policy == "frozen-vocabulary":
        filtered = {name: apply_vocabulary(fingerprints[name], vocabulary) for name in fingerprints}
    else:
        filtered = {name: filter_period_frequencies(fingerprints[name]) for name in fingerprints}
    discovered = {
        name: discover_rings(filtered[name], max_size=max_ring_size, link_types=LINK_POLICIES[link_policy])
        for name in filtered
    }
    ring_data = {name: extract_ring_features(filtered[name], discovered[name]) for name in filtered}
    baseline = train_baseline(ring_data["train"], ring_data["validation"])
    scored, test_metrics = score_baseline(baseline, ring_data["test"])

    output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": baseline.model, "calibrator": baseline.calibrator, "threshold": baseline.threshold}, output_dir / "random_forest.joblib")
    scored.to_csv(output_dir / "test_ring_scores.csv", index=False)

    def partition_info(name: str) -> dict:
        period = getattr(partitions, name)
        result = discovered[name]
        candidate_ids = {identifier for ring in result.rings for identifier in ring.transaction_ids}
        eligible = period["TransactionID"].isin(candidate_ids)
        return {
            "transactions": len(period),
            "fraud_transactions": int(period["isFraud"].sum()),
            "first_transaction_dt": int(period["TransactionDT"].min()),
            "last_transaction_dt": int(period["TransactionDT"].max()),
            "candidate_rings": len(result.rings),
            "fraud_rings": int(ring_data[name]["is_fraud_ring"].sum()),
            "candidate_transactions": int(eligible.sum()),
            "candidate_fraud_transactions": int(period.loc[eligible, "isFraud"].sum()),
            "isolated_transactions": result.isolated_transactions,
            "oversized_components": result.oversized_components,
            "oversized_transactions": result.oversized_transactions,
            "fingerprint_groups": result.fingerprint_groups,
        }

    summary = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset": "IEEE-CIS train_transaction.csv + train_identity.csv",
        "split": "chronological 56% train, 14% validation, 30% test; ties by TransactionID",
        "fingerprint_policy": frequency_policy,
        "frequency_details": "frozen training values only" if frequency_policy == "frozen-vocabulary" else "frequency 2-100 within each complete unlabeled period (offline only)",
        "ring_policy": f"connected components with 2-{max_ring_size} transactions using {link_policy} joins; oversized components excluded",
        "component_link_types": LINK_POLICIES[link_policy],
        "graph_relation_types": tuple(FINGERPRINTS),
        "label": "positive ring if at least one transaction has isFraud=1",
        "synthetic_transactions": 0,
        "action_policy": "sigmoid calibrated on validation; 0.70 hard-block review, 0.40 step-up review; no automatic action",
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
    parser.add_argument("--link-policy", choices=LINK_POLICIES, default="high-confidence")
    parser.add_argument("--frequency-policy", choices=("frozen-vocabulary", "period-local"), default="frozen-vocabulary")
    args = parser.parse_args()
    print(json.dumps(run_benchmark(args.data_dir, args.output_dir, args.max_ring_size, args.link_policy, args.frequency_policy), indent=2))


if __name__ == "__main__":
    main()
