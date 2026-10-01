"""Compare held-out model errors on identical candidate rings."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd


def analyze(baseline_dir: Path, gnn_dir: Path) -> dict:
    baseline_summary = json.loads((baseline_dir / "summary.json").read_text(encoding="utf-8"))
    gnn_summary = json.loads((gnn_dir / "summary.json").read_text(encoding="utf-8"))
    baseline = pd.read_csv(baseline_dir / "test_ring_scores.csv")
    gnn = pd.read_csv(gnn_dir / "test_ring_scores.csv")
    if baseline["ring_id"].duplicated().any() or gnn["ring_id"].duplicated().any():
        raise ValueError("Expected unique ring IDs")
    merged = baseline.merge(gnn[["ring_id", "risk_probability"]], on="ring_id", suffixes=("_baseline", "_gnn"), validate="one_to_one")
    if len(merged) != len(baseline) or len(merged) != len(gnn):
        raise ValueError("Models must score the identical held-out candidate set")
    if baseline_summary["partitions"]["test"]["candidate_rings"] != len(merged):
        raise ValueError("Baseline summary does not match score rows")
    labels = merged["is_fraud_ring"].to_numpy(dtype=int)
    baseline_pred = merged["risk_probability_baseline"].to_numpy() >= baseline_summary["test_metrics"]["threshold"]
    gnn_pred = merged["risk_probability_gnn"].to_numpy() >= gnn_summary["test_metrics"]["threshold"]
    fraud_count = merged["fraud_count"].to_numpy(dtype=int)
    total_test_fraud = int(baseline_summary["partitions"]["test"]["fraud_transactions"])

    def model_errors(predictions: np.ndarray) -> dict:
        tp = (predictions == 1) & (labels == 1)
        fp = (predictions == 1) & (labels == 0)
        fn = (predictions == 0) & (labels == 1)
        return {
            "true_positive_rings": int(tp.sum()),
            "false_positive_rings": int(fp.sum()),
            "false_negative_rings": int(fn.sum()),
            "median_false_positive_ring_size": float(merged.loc[fp, "cluster_size"].median()) if fp.any() else None,
            "median_false_negative_ring_size": float(merged.loc[fn, "cluster_size"].median()) if fn.any() else None,
            "fraud_transactions_in_predicted_positive_rings": int(fraud_count[tp].sum()),
            "fraud_transaction_capture_fraction_of_all_test_fraud": float(fraud_count[tp].sum() / total_test_fraud),
        }

    return {
        "held_out_candidate_rings": len(merged),
        "test_fraud_transactions": total_test_fraud,
        "fraud_transactions_in_eligible_rings": int(fraud_count.sum()),
        "fraud_transactions_outside_eligible_rings": int(total_test_fraud - fraud_count.sum()),
        "baseline": model_errors(baseline_pred),
        "gnn": model_errors(gnn_pred),
        "both_models_missed_positive_rings": int(((baseline_pred == 0) & (gnn_pred == 0) & (labels == 1)).sum()),
        "gnn_detected_positive_rings_baseline_missed": int(((baseline_pred == 0) & (gnn_pred == 1) & (labels == 1)).sum()),
        "baseline_detected_positive_rings_gnn_missed": int(((baseline_pred == 1) & (gnn_pred == 0) & (labels == 1)).sum()),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Compare held-out Random Forest and GraphSAGE errors")
    parser.add_argument("--baseline-dir", type=Path, required=True)
    parser.add_argument("--gnn-dir", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(analyze(args.baseline_dir, args.gnn_dir), indent=2))


if __name__ == "__main__":
    main()
