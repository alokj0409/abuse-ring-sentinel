"""Frozen Random Forest benchmark, validation policy, and held-out metrics."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import average_precision_score, brier_score_loss, confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score

from sentinel.calibration import SigmoidCalibrator
from sentinel.features import FEATURE_COLUMNS


@dataclass(frozen=True)
class Baseline:
    model: RandomForestClassifier
    calibrator: SigmoidCalibrator
    threshold: float
    validation_metrics: dict[str, float | int | None]


def metrics(labels: np.ndarray, probabilities: np.ndarray, threshold: float) -> dict[str, float | int | None]:
    labels = np.asarray(labels, dtype=int)
    probabilities = np.asarray(probabilities, dtype=float)
    predictions = (probabilities >= threshold).astype(int)
    tn, fp, fn, tp = (int(value) for value in confusion_matrix(labels, predictions, labels=[0, 1]).ravel())
    return {
        "rings": int(len(labels)),
        "positive_rings": int(labels.sum()),
        "threshold": round(float(threshold), 6),
        "roc_auc": float(roc_auc_score(labels, probabilities)) if len(np.unique(labels)) == 2 else None,
        "pr_auc": float(average_precision_score(labels, probabilities)) if labels.sum() else None,
        "brier_score": float(brier_score_loss(labels, probabilities)),
        "precision": float(precision_score(labels, predictions, zero_division=0)),
        "recall": float(recall_score(labels, predictions, zero_division=0)),
        "f1": float(f1_score(labels, predictions, zero_division=0)),
        "tn": tn, "fp": fp, "fn": fn, "tp": tp,
    }


def choose_threshold(labels: np.ndarray, probabilities: np.ndarray) -> float:
    """Choose F1 threshold on validation only, with stable high-threshold tie break."""
    if not len(labels):
        raise ValueError("Validation rings are empty")
    candidates = np.unique(np.concatenate(([0.0, 1.0], probabilities)))
    scores = [(f1_score(labels, probabilities >= value, zero_division=0), float(value)) for value in candidates]
    return max(scores)[1]


def train_baseline(train: pd.DataFrame, validation: pd.DataFrame) -> Baseline:
    if train.empty or validation.empty:
        raise ValueError("Train and validation ring sets must be nonempty")
    labels = train["is_fraud_ring"].to_numpy(dtype=int)
    if len(np.unique(labels)) != 2:
        raise ValueError("Training rings must include positive and negative examples")
    model = RandomForestClassifier(
        n_estimators=150, max_depth=10, class_weight="balanced",
        random_state=42, n_jobs=-1,
    )
    model.fit(train[list(FEATURE_COLUMNS)], labels)
    raw_probabilities = model.predict_proba(validation[list(FEATURE_COLUMNS)])[:, 1]
    validation_labels = validation["is_fraud_ring"].to_numpy(dtype=int)
    calibrator = SigmoidCalibrator().fit(raw_probabilities, validation_labels)
    probabilities = calibrator.transform(raw_probabilities)
    threshold = choose_threshold(validation_labels, probabilities)
    return Baseline(model, calibrator, threshold, metrics(validation_labels, probabilities, threshold))


def score_baseline(baseline: Baseline, test: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, float | int | None]]:
    scored = test.copy()
    raw_probabilities = baseline.model.predict_proba(scored[list(FEATURE_COLUMNS)])[:, 1]
    probabilities = baseline.calibrator.transform(raw_probabilities)
    scored["risk_probability"] = probabilities
    scored["action_tier"] = np.select(
        [probabilities >= 0.70, probabilities >= 0.40],
        ["HARD_BLOCK_REVIEW", "STEP_UP_REVIEW"], default="ALLOW_REVIEW",
    )
    result = metrics(scored["is_fraud_ring"].to_numpy(), probabilities, baseline.threshold)
    return scored, result
