"""Validation-only sigmoid calibration of model scores."""

from __future__ import annotations

import numpy as np
from sklearn.linear_model import LogisticRegression


class SigmoidCalibrator:
    def __init__(self) -> None:
        self.model = LogisticRegression(random_state=42)

    @staticmethod
    def _logits(probabilities: np.ndarray) -> np.ndarray:
        clipped = np.clip(np.asarray(probabilities, dtype=float), 1e-6, 1 - 1e-6)
        return np.log(clipped / (1 - clipped)).reshape(-1, 1)

    def fit(self, probabilities: np.ndarray, labels: np.ndarray) -> "SigmoidCalibrator":
        labels = np.asarray(labels, dtype=int)
        if len(np.unique(labels)) != 2:
            raise ValueError("Calibration requires positive and negative validation rings")
        self.model.fit(self._logits(probabilities), labels)
        return self

    def transform(self, probabilities: np.ndarray) -> np.ndarray:
        return self.model.predict_proba(self._logits(probabilities))[:, 1]
