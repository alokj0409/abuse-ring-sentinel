"""Label-free ring features and research-only ground truth labels."""

from __future__ import annotations

import numpy as np
import pandas as pd

from sentinel.graph import Discovery, FINGERPRINTS


FEATURE_COLUMNS = (
    "cluster_size", "temporal_burst", "amount_concentration", "drop_house_score",
    "mismatch_rate", "signal_types", "total_amount", "avg_amount", "std_amount",
    "max_time_span", "device_count", "card_count", "network_count",
)


def _temporal_burst(times: np.ndarray, window_seconds: int = 3600) -> float:
    ordered = np.sort(times.astype(np.int64))
    if len(ordered) < 2:
        return 0.0
    pairs = 0
    burst_pairs = 0
    for left in range(len(ordered)):
        for right in range(left + 1, min(left + 20, len(ordered))):
            pairs += 1
            burst_pairs += int(ordered[right] - ordered[left] <= window_seconds)
    return burst_pairs / pairs if pairs else 0.0


def extract_ring_features(frame: pd.DataFrame, discovery: Discovery) -> pd.DataFrame:
    """Extract 13 predictive features and a separate any-fraud research label."""
    indexed = frame.set_index("TransactionID")
    if not indexed.index.is_unique:
        raise ValueError("TransactionID must be unique for ring feature extraction")
    records: list[dict] = []
    for ring in discovery.rings:
        group = indexed.loc[list(ring.transaction_ids)]
        amounts = group["TransactionAmt"].astype(float)
        times = group["TransactionDT"].to_numpy()
        distances = pd.to_numeric(group["dist1"], errors="coerce").dropna()
        checks = pd.concat([group[name].dropna() for name in ("M4", "M5", "M6")])
        fingerprints = {name: group[f"fp_{name}"].dropna() for name in FINGERPRINTS}
        fraud_count = int(group["isFraud"].sum())
        records.append({
            "ring_id": ring.id,
            "cluster_size": ring.size,
            "temporal_burst": _temporal_burst(times),
            "amount_concentration": float(amounts.value_counts().iloc[0] / ring.size),
            "drop_house_score": float(min(distances.mean() / 450.0, 1.0)) if len(distances) else 0.0,
            "mismatch_rate": float(checks.eq("F").mean()) if len(checks) else 0.0,
            "signal_types": sum(not values.empty for values in fingerprints.values()),
            "total_amount": float(amounts.sum()),
            "avg_amount": float(amounts.mean()),
            "std_amount": float(amounts.std(ddof=1)) if ring.size > 1 else 0.0,
            "max_time_span": float(np.max(times) - np.min(times)),
            "device_count": int(fingerprints["device"].nunique()),
            "card_count": int(fingerprints["card_strict"].nunique()),
            "network_count": int(fingerprints["network"].nunique()),
            "fraud_count": fraud_count,
            "fraud_rate": fraud_count / ring.size,
            "is_fraud_ring": int(fraud_count > 0),
        })
    return pd.DataFrame.from_records(records, columns=("ring_id", *FEATURE_COLUMNS, "fraud_count", "fraud_rate", "is_fraud_ring"))
