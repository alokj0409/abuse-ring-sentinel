import unittest

import pandas as pd

from sentinel.export import build_case, choose_examples, review_tier
from sentinel.graph import FINGERPRINTS


class DashboardExportTests(unittest.TestCase):
    def test_score_sampling_does_not_use_labels(self):
        scores = pd.DataFrame({
            "ring_id": [f"AR-{index}" for index in range(100)],
            "risk_probability": [index / 100 for index in range(100)],
            "is_fraud_ring": [0] * 100,
        })
        selected = choose_examples(scores)
        self.assertEqual(len(selected), 40)
        self.assertEqual(selected.iloc[0]["ring_id"], "AR-99")
        self.assertIn("AR-0", set(selected["ring_id"]))

    def test_exported_case_excludes_ground_truth_and_raw_fingerprints(self):
        row = pd.Series({
            "ring_id": "AR-1", "risk_probability": 0.8, "cluster_size": 2,
            "total_amount": 30, "max_time_span": 10, "temporal_burst": 0.5,
            "mismatch_rate": 0.0, "signal_types": 1, "device_count": 1,
            "card_count": 0, "network_count": 0, "fraud_count": 1,
            "is_fraud_ring": 1,
        })
        records = []
        for identifier in (1, 2):
            record = {"TransactionID": identifier, "isFraud": identifier - 1}
            record.update({f"fp_{name}": pd.NA for name in FINGERPRINTS})
            record["fp_device"] = "private-device-value"
            records.append(record)
        case = build_case(row, (1, 2), pd.DataFrame(records).set_index("TransactionID"))
        serialized = str(case)
        self.assertNotIn("fraud", serialized.lower())
        self.assertNotIn("private-device-value", serialized)
        self.assertEqual(case["relationships"]["device"], 1)
        self.assertEqual(case["reviewTier"], "HIGH_PRIORITY_REVIEW")

    def test_review_tiers_are_human_review_only(self):
        self.assertEqual(review_tier(0.70), "HIGH_PRIORITY_REVIEW")
        self.assertEqual(review_tier(0.40), "STEP_UP_REVIEW")
        self.assertEqual(review_tier(0.39), "ROUTINE_REVIEW")


if __name__ == "__main__":
    unittest.main()
