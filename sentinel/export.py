"""Export a small, traceable held-out case set for the research dashboard.

The dashboard is an offline sample viewer, not a live scoring service. No fraud
labels, identity fingerprint values, or model training records are exported.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from sentinel.cli import LINK_POLICIES
from sentinel.data import chronological_split, load_ieee
from sentinel.graph import FINGERPRINTS, apply_vocabulary, discover_rings, learn_vocabulary, make_fingerprints


def choose_examples(scores: pd.DataFrame, high_count: int = 25, middle_count: int = 10, low_count: int = 5) -> pd.DataFrame:
    """Deterministically span the score distribution without looking at labels."""
    ordered = scores.sort_values(["risk_probability", "ring_id"], ascending=[False, True]).reset_index(drop=True)
    if ordered.empty:
        raise ValueError("No held-out ring scores available")
    positions = list(range(min(high_count, len(ordered))))
    remaining = len(ordered) - len(positions)
    if remaining > 0:
        middle_start = max(len(positions), len(ordered) // 2 - middle_count // 2)
        positions.extend(range(middle_start, min(middle_start + middle_count, len(ordered))))
    positions.extend(range(max(len(positions), len(ordered) - low_count), len(ordered)))
    return ordered.iloc[sorted(set(positions))].copy()


def review_tier(probability: float) -> str:
    if probability >= 0.70:
        return "HIGH_PRIORITY_REVIEW"
    if probability >= 0.40:
        return "STEP_UP_REVIEW"
    return "ROUTINE_REVIEW"


def build_case(row: pd.Series, ring_members: tuple[int, ...], indexed: pd.DataFrame) -> dict:
    group = indexed.loc[list(ring_members)]
    relations: dict[str, int] = {}
    for name in FINGERPRINTS:
        counts = group[f"fp_{name}"].value_counts(dropna=True)
        relations[name] = int((counts * (counts - 1) // 2).sum())
    probability = float(row["risk_probability"])
    return {
        "id": str(row["ring_id"]),
        "riskProbability": round(probability, 6),
        "reviewTier": review_tier(probability),
        "ringSize": int(row["cluster_size"]),
        "totalAmount": round(float(row["total_amount"]), 2),
        "timeSpanSeconds": int(row["max_time_span"]),
        "temporalBurst": round(float(row["temporal_burst"]), 6),
        "mismatchRate": round(float(row["mismatch_rate"]), 6),
        "signalTypes": int(row["signal_types"]),
        "deviceCount": int(row["device_count"]),
        "cardCount": int(row["card_count"]),
        "networkCount": int(row["network_count"]),
        "transactionIds": [int(value) for value in ring_members[:20]],
        "sampledTransactionCount": min(20, len(ring_members)),
        "relationships": relations,
    }


def export_cases(data_dir: Path, model_dir: Path, output_path: Path) -> dict:
    scores = pd.read_csv(model_dir / "test_ring_scores.csv")
    summary = json.loads((model_dir / "summary.json").read_text(encoding="utf-8"))
    if summary.get("link_policy") != "high-confidence" or summary.get("test_rings") != len(scores):
        raise ValueError("Expected high-confidence scores for the complete held-out candidate set")
    frame = load_ieee(data_dir)
    partitions = chronological_split(frame)
    training = make_fingerprints(partitions.train)
    test = make_fingerprints(partitions.test)
    vocabulary = learn_vocabulary(training)
    test = apply_vocabulary(test, vocabulary)
    discovery = discover_rings(test, link_types=LINK_POLICIES["high-confidence"])
    members = {ring.id: ring.transaction_ids for ring in discovery.rings}
    selected = choose_examples(scores)
    missing = set(selected["ring_id"]) - set(members)
    if missing:
        raise ValueError(f"Scored rings missing from reconstructed test graph: {sorted(missing)[:5]}")
    indexed = test.set_index("TransactionID")
    cases = [build_case(row, members[row["ring_id"]], indexed) for _, row in selected.iterrows()]
    payload = {
        "metadata": {
            "generatedAtUtc": datetime.now(timezone.utc).isoformat(),
            "dataset": "IEEE-CIS labeled training files, held-out chronological period",
            "model": "typed GraphSAGE, validation-calibrated",
            "linkPolicy": "high-confidence; frozen training fingerprint vocabulary",
            "testCandidateRings": int(summary["test_rings"]),
            "testPositiveRings": int(summary["test_metrics"]["positive_rings"]),
            "sampleSize": len(cases),
            "samplePolicy": "highest 25 scores, 10 mid-ranked scores, 5 lowest scores; no label-based selection",
            "testMetrics": summary["test_metrics"],
            "researchOnly": True,
        },
        "rings": cases,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Export held-out examples for the research dashboard")
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--model-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = export_cases(args.data_dir, args.model_dir, args.output)
    print(f"Exported {len(result['rings'])} label-free held-out examples to {args.output}")


if __name__ == "__main__":
    main()
