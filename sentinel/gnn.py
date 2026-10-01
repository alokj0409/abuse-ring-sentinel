"""Typed GraphSAGE plus 13 domain features for candidate-ring classification.

This module is optional: install the project with ``pip install -e .[gnn]``.
It deliberately never uses fraud labels as graph or feature inputs.
"""

from __future__ import annotations

import argparse
import copy
import json
import os
import random
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import torch
from sklearn.metrics import average_precision_score
from sklearn.preprocessing import StandardScaler
from torch import nn
from torch_geometric.data import Data
from torch_geometric.loader import DataLoader
from torch_geometric.nn import SAGEConv, global_max_pool, global_mean_pool

from sentinel.benchmark import choose_threshold, metrics
from sentinel.calibration import SigmoidCalibrator
from sentinel.cli import LINK_POLICIES
from sentinel.data import chronological_split, load_ieee
from sentinel.features import FEATURE_COLUMNS, extract_ring_features
from sentinel.graph import Discovery, FINGERPRINTS, apply_vocabulary, discover_rings, learn_vocabulary, make_fingerprints, typed_edges


RELATION_NAMES = tuple(FINGERPRINTS)
RELATION_INDEX = {name: index for index, name in enumerate(RELATION_NAMES)}
NODE_FEATURES = (
    "log_amount", "relative_time", "log_typed_degree", "distance_anomaly",
    "device_present", "network_present", "identity_mismatch_rate",
)


def build_graph_examples(frame: pd.DataFrame, discovery: Discovery, features: pd.DataFrame) -> list[Data]:
    """Build local typed subgraphs for eligible candidate rings."""
    indexed = frame.set_index("TransactionID")
    if not indexed.index.is_unique:
        raise ValueError("TransactionID must be unique")
    feature_by_ring = features.set_index("ring_id")
    examples: list[Data] = []
    for ring in discovery.rings:
        group = indexed.loc[list(ring.transaction_ids)]
        edges = typed_edges(frame, ring, indexed=indexed)
        pairs = np.asarray([(left, right) for left, right, _ in edges], dtype=np.int64)
        edge_index = torch.tensor(pairs.T.copy(), dtype=torch.long) if len(pairs) else torch.empty((2, 0), dtype=torch.long)
        edge_type = torch.tensor([RELATION_INDEX[name] for _, _, name in edges], dtype=torch.long)
        typed_degree = np.bincount(pairs[:, 0], minlength=ring.size) if len(pairs) else np.zeros(ring.size)

        times = group["TransactionDT"].to_numpy(dtype=np.float64)
        span = max(float(times.max() - times.min()), 1.0)
        amount = np.log1p(np.maximum(group["TransactionAmt"].to_numpy(dtype=np.float64), 0.0))
        distance = pd.to_numeric(group["dist1"], errors="coerce").fillna(0).to_numpy(dtype=np.float64)
        checks = group[["M4", "M5", "M6"]]
        mismatch_count = checks.eq("F").sum(axis=1).to_numpy(dtype=np.float64)
        check_count = np.maximum(checks.notna().sum(axis=1).to_numpy(dtype=np.float64), 1.0)
        node_features = np.column_stack((
            amount,
            (times - times.min()) / span,
            np.log1p(typed_degree),
            np.clip(distance / 450.0, 0.0, 1.0),
            group["fp_device"].notna().to_numpy(dtype=np.float64),
            group["fp_network"].notna().to_numpy(dtype=np.float64),
            mismatch_count / check_count,
        )).astype(np.float32)
        row = feature_by_ring.loc[ring.id]
        examples.append(Data(
            x=torch.from_numpy(node_features),
            edge_index=edge_index,
            edge_type=edge_type,
            domain_features=torch.tensor(row[list(FEATURE_COLUMNS)].to_numpy(dtype=np.float32).reshape(1, -1)),
            y=torch.tensor([float(row["is_fraud_ring"])], dtype=torch.float32),
            ring_id=ring.id,
        ))
    return examples


def standardize_examples(train: list[Data], validation: list[Data], test: list[Data]) -> tuple[StandardScaler, StandardScaler]:
    """Fit both scalers on training rings only and transform all partitions."""
    if not train:
        raise ValueError("No training subgraphs")
    node_scaler = StandardScaler().fit(np.vstack([example.x.numpy() for example in train]))
    domain_scaler = StandardScaler().fit(np.vstack([example.domain_features.numpy() for example in train]))
    for example in (*train, *validation, *test):
        example.x = torch.from_numpy(node_scaler.transform(example.x.numpy()).astype(np.float32))
        example.domain_features = torch.from_numpy(domain_scaler.transform(example.domain_features.numpy()).astype(np.float32))
    return node_scaler, domain_scaler


class TypedGraphSAGE(nn.Module):
    """Two GraphSAGE layers with relation-specific neighbor aggregation."""

    def __init__(self, node_features: int = 7, domain_features: int = 13, hidden: int = 64, dropout: float = 0.25):
        super().__init__()
        self.self1 = nn.Linear(node_features, hidden)
        self.self2 = nn.Linear(hidden, hidden)
        self.relations1 = nn.ModuleList(SAGEConv(node_features, hidden, root_weight=False) for _ in RELATION_NAMES)
        self.relations2 = nn.ModuleList(SAGEConv(hidden, hidden, root_weight=False) for _ in RELATION_NAMES)
        self.norm1 = nn.BatchNorm1d(hidden)
        self.norm2 = nn.BatchNorm1d(hidden)
        self.head = nn.Sequential(
            nn.Linear(hidden * 2 + domain_features, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 1),
        )
        self.dropout = nn.Dropout(dropout)

    def _layer(self, x: torch.Tensor, data: Data, self_projection: nn.Linear, relations: nn.ModuleList, norm: nn.BatchNorm1d) -> torch.Tensor:
        messages = torch.zeros((x.size(0), self_projection.out_features), device=x.device, dtype=x.dtype)
        active = 0
        for index, conv in enumerate(relations):
            selection = data.edge_type == index
            if bool(selection.any()):
                messages = messages + conv(x, data.edge_index[:, selection])
                active += 1
        return self.dropout(torch.relu(norm(self_projection(x) + messages / max(active, 1))))

    def forward(self, data: Data) -> torch.Tensor:
        x = self._layer(data.x, data, self.self1, self.relations1, self.norm1)
        x = self._layer(x, data, self.self2, self.relations2, self.norm2)
        pooled = torch.cat((global_mean_pool(x, data.batch), global_max_pool(x, data.batch), data.domain_features), dim=1)
        return self.head(pooled).squeeze(-1)


@torch.no_grad()
def predict(model: TypedGraphSAGE, examples: list[Data], batch_size: int) -> np.ndarray:
    model.eval()
    values = []
    for batch in DataLoader(examples, batch_size=batch_size, shuffle=False):
        values.append(torch.sigmoid(model(batch)).cpu().numpy())
    return np.concatenate(values) if values else np.array([], dtype=float)


def train_model(
    train: list[Data], validation: list[Data],
    epochs: int = 12, batch_size: int = 32, learning_rate: float = 0.001,
) -> tuple[TypedGraphSAGE, dict]:
    if not train or not validation:
        raise ValueError("Training and validation subgraphs must be nonempty")
    random.seed(42)
    np.random.seed(42)
    torch.manual_seed(42)
    torch.set_num_threads(min(4, os.cpu_count() or 1))
    model = TypedGraphSAGE()
    labels = np.array([float(example.y.item()) for example in train])
    positives = max(float(labels.sum()), 1.0)
    loss_fn = nn.BCEWithLogitsLoss(pos_weight=torch.tensor((len(labels) - positives) / positives))
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)
    loader = DataLoader(train, batch_size=batch_size, shuffle=True)
    validation_labels = np.array([int(example.y.item()) for example in validation])
    best_score = -1.0
    best_state = None
    best_epoch = 0
    history = []
    for epoch in range(1, epochs + 1):
        model.train()
        loss_sum = 0.0
        for batch in loader:
            optimizer.zero_grad()
            loss = loss_fn(model(batch), batch.y)
            loss.backward()
            optimizer.step()
            loss_sum += float(loss.item()) * batch.num_graphs
        probabilities = predict(model, validation, batch_size)
        score = float(average_precision_score(validation_labels, probabilities)) if validation_labels.sum() else 0.0
        history.append({"epoch": epoch, "train_loss": loss_sum / len(train), "validation_pr_auc": score})
        print(f"epoch={epoch} train_loss={loss_sum / len(train):.4f} validation_pr_auc={score:.4f}", flush=True)
        if score > best_score:
            best_score = score
            best_epoch = epoch
            best_state = copy.deepcopy(model.state_dict())
        elif epoch - best_epoch >= 3:
            break
    assert best_state is not None
    model.load_state_dict(best_state)
    return model, {"best_epoch": best_epoch, "history": history}


def run_gnn(data_dir: Path, output_dir: Path, link_policy: str = "high-confidence", epochs: int = 12, batch_size: int = 32) -> dict:
    if link_policy not in LINK_POLICIES:
        raise ValueError(f"Unknown link policy: {link_policy}")
    frame = load_ieee(data_dir)
    partitions = chronological_split(frame)
    fingerprints = {name: make_fingerprints(getattr(partitions, name)) for name in partitions.counts()}
    vocabulary = learn_vocabulary(fingerprints["train"])
    filtered = {name: apply_vocabulary(fingerprints[name], vocabulary) for name in fingerprints}
    discovered = {name: discover_rings(filtered[name], link_types=LINK_POLICIES[link_policy]) for name in filtered}
    features = {name: extract_ring_features(filtered[name], discovered[name]) for name in filtered}
    examples = {name: build_graph_examples(filtered[name], discovered[name], features[name]) for name in filtered}
    node_scaler, domain_scaler = standardize_examples(examples["train"], examples["validation"], examples["test"])
    model, training = train_model(examples["train"], examples["validation"], epochs=epochs, batch_size=batch_size)
    val_prob = predict(model, examples["validation"], batch_size)
    val_labels = features["validation"]["is_fraud_ring"].to_numpy(dtype=int)
    calibrator = SigmoidCalibrator().fit(val_prob, val_labels)
    calibrated_val_prob = calibrator.transform(val_prob)
    threshold = choose_threshold(val_labels, calibrated_val_prob)
    raw_test_prob = predict(model, examples["test"], batch_size)
    test_prob = calibrator.transform(raw_test_prob)
    test_labels = features["test"]["is_fraud_ring"].to_numpy(dtype=int)

    output_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), output_dir / "typed_graphsage.pt")
    joblib.dump({"node": node_scaler, "domain": domain_scaler}, output_dir / "scalers.joblib")
    joblib.dump(calibrator, output_dir / "calibrator.joblib")
    scores = features["test"].copy()
    scores["risk_probability"] = test_prob
    scores.to_csv(output_dir / "test_ring_scores.csv", index=False)
    summary = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset": "IEEE-CIS labeled train files",
        "split": "chronological 56/14/30",
        "synthetic_transactions": 0,
        "link_policy": link_policy,
        "relation_types": RELATION_NAMES,
        "node_features": NODE_FEATURES,
        "domain_features": FEATURE_COLUMNS,
        "train_rings": len(examples["train"]),
        "validation_rings": len(examples["validation"]),
        "test_rings": len(examples["test"]),
        "training": training,
        "calibration": "sigmoid fit on validation scores only",
        "validation_metrics": metrics(val_labels, calibrated_val_prob, threshold),
        "raw_test_metrics": metrics(test_labels, raw_test_prob, 0.5),
        "test_metrics": metrics(test_labels, test_prob, threshold),
    }
    (output_dir / "summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Train and evaluate typed GraphSAGE")
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("artifacts/gnn"))
    parser.add_argument("--link-policy", choices=LINK_POLICIES, default="high-confidence")
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--batch-size", type=int, default=32)
    args = parser.parse_args()
    print(json.dumps(run_gnn(args.data_dir, args.output_dir, args.link_policy, args.epochs, args.batch_size), indent=2))


if __name__ == "__main__":
    main()
