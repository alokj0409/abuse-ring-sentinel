import unittest

import pandas as pd

from sentinel.features import extract_ring_features
from sentinel.graph import discover_rings, make_fingerprints
from test_graph import row

try:
    import torch
    from torch_geometric.loader import DataLoader
    from sentinel.gnn import TypedGraphSAGE, build_graph_examples, standardize_examples
except ImportError:
    torch = None


@unittest.skipIf(torch is None, "optional graph-learning dependencies not installed")
class GNNTests(unittest.TestCase):
    def test_typed_graph_batch_forward_and_gradient(self):
        rows = [row(1, 1, 99), row(2, 2, 99), row(3, 3, 88), row(4, 4, 88)]
        for index, item in enumerate(rows):
            item.update({
                "TransactionAmt": float(index + 10), "dist1": None,
                "M4": "T", "M5": None, "M6": None,
                "isFraud": int(index == 3),
            })
        frame = make_fingerprints(pd.DataFrame(rows))
        discovery = discover_rings(frame, link_types=("card_strict",))
        features = extract_ring_features(frame, discovery)
        examples = build_graph_examples(frame, discovery, features)
        self.assertEqual(len(examples), 2)
        standardize_examples(examples, [], [])
        batch = next(iter(DataLoader(examples, batch_size=2)))
        model = TypedGraphSAGE(hidden=8)
        logits = model(batch)
        self.assertEqual(tuple(logits.shape), (2,))
        logits.sum().backward()
        self.assertIsNotNone(model.self1.weight.grad)


if __name__ == "__main__":
    unittest.main()
