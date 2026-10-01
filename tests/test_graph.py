import unittest

import pandas as pd

from sentinel.data import chronological_split
from sentinel.graph import FINGERPRINTS, apply_vocabulary, discover_rings, filter_period_frequencies, learn_vocabulary, make_fingerprints, typed_edges


def row(identifier: int, time: int, card: int | None, device: str | None = None) -> dict:
    return {
        "TransactionID": identifier, "TransactionDT": time, "card1": card,
        "card2": 200 if card is not None else None, "card3": 150 if card is not None else None,
        "addr1": identifier, "addr2": 87, "DeviceInfo": device, "id_33": "1920x1080" if device else None,
        "id_17": None, "id_19": None, "id_20": None, "P_emaildomain": "example.com",
        "id_30": None, "id_31": None,
    }


class GraphTests(unittest.TestCase):
    def test_seven_fingerprints_and_typed_edges(self):
        frame = make_fingerprints(pd.DataFrame([row(1, 1, 99, "device-a"), row(2, 2, 99, "device-a")]))
        self.assertEqual(len(FINGERPRINTS), 7)
        vocabulary = learn_vocabulary(frame)
        filtered = apply_vocabulary(frame, vocabulary)
        discovery = discover_rings(filtered)
        self.assertEqual([ring.transaction_ids for ring in discovery.rings], [(1, 2)])
        self.assertEqual({edge[2] for edge in typed_edges(filtered, discovery.rings[0])}, {"device", "card_loose", "card_strict", "email_card"})

    def test_validation_cannot_teach_new_fingerprints(self):
        train = make_fingerprints(pd.DataFrame([row(1, 1, 99), row(2, 2, 99)]))
        validation = make_fingerprints(pd.DataFrame([row(3, 3, 88), row(4, 4, 88)]))
        filtered = apply_vocabulary(validation, learn_vocabulary(train))
        self.assertEqual(len(discover_rings(filtered).rings), 0)

    def test_period_local_policy_can_discover_repeated_new_identity(self):
        frame = make_fingerprints(pd.DataFrame([row(3, 3, 88), row(4, 4, 88)]))
        filtered = filter_period_frequencies(frame)
        self.assertEqual(len(discover_rings(filtered, link_types=("card_strict",)).rings), 1)

    def test_missing_parts_do_not_link(self):
        frame = make_fingerprints(pd.DataFrame([row(1, 1, None), row(2, 2, None)]))
        self.assertEqual(len(discover_rings(frame).rings), 0)

    def test_chronological_split_is_disjoint(self):
        frame = pd.DataFrame({"TransactionID": range(20), "TransactionDT": range(20)})
        parts = chronological_split(frame)
        self.assertEqual(parts.counts(), {"train": 11, "validation": 3, "test": 6})
        self.assertLess(parts.train.TransactionDT.max(), parts.validation.TransactionDT.min())
        self.assertLess(parts.validation.TransactionDT.max(), parts.test.TransactionDT.min())

    def test_weak_browser_link_does_not_join_high_confidence_components(self):
        left = row(1, 1, None)
        right = row(2, 2, None)
        left.update({"id_30": "Windows", "id_31": "Browser 1"})
        right.update({"id_30": "Windows", "id_31": "Browser 1"})
        frame = make_fingerprints(pd.DataFrame([left, right]))
        self.assertEqual(len(discover_rings(frame).rings), 1)
        self.assertEqual(len(discover_rings(frame, link_types=("device", "card_strict", "address_card")).rings), 0)


if __name__ == "__main__":
    unittest.main()
