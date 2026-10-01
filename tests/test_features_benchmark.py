import unittest

import numpy as np
import pandas as pd

from sentinel.benchmark import choose_threshold, metrics
from sentinel.features import FEATURE_COLUMNS, extract_ring_features
from sentinel.graph import discover_rings, make_fingerprints
from test_graph import row


class FeatureAndBenchmarkTests(unittest.TestCase):
    def test_label_is_separate_from_predictors(self):
        rows = [row(1, 1, 99), row(2, 2, 99)]
        for item, fraud in zip(rows, [0, 1]):
            item.update({"isFraud": fraud, "TransactionAmt": 10.0, "dist1": None, "M4": "T", "M5": None, "M6": None})
        frame = make_fingerprints(pd.DataFrame(rows))
        result = extract_ring_features(frame, discover_rings(frame))
        self.assertEqual(result.loc[0, "is_fraud_ring"], 1)
        self.assertEqual(result.loc[0, "fraud_count"], 1)
        self.assertEqual(len(FEATURE_COLUMNS), 13)
        self.assertTrue(set(FEATURE_COLUMNS).isdisjoint({"fraud_count", "fraud_rate", "is_fraud_ring"}))

    def test_validation_threshold_and_confusion_counts(self):
        labels = np.array([0, 0, 1, 1])
        scores = np.array([0.1, 0.2, 0.8, 0.9])
        threshold = choose_threshold(labels, scores)
        report = metrics(labels, scores, threshold)
        self.assertEqual(report["f1"], 1.0)
        self.assertEqual((report["tp"], report["fp"], report["fn"]), (2, 0, 0))


if __name__ == "__main__":
    unittest.main()
