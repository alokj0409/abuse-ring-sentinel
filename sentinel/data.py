"""Dataset loading and chronological partitioning.

The Kaggle competition test set has no public fraud labels. Every metric in this
project therefore uses a chronological holdout from the labeled *train* files.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd


TRANSACTION_COLUMNS = (
    "TransactionID", "isFraud", "TransactionDT", "TransactionAmt",
    "card1", "card2", "card3", "addr1", "addr2", "dist1",
    "P_emaildomain", "M4", "M5", "M6",
)
IDENTITY_COLUMNS = (
    "TransactionID", "DeviceInfo", "id_17", "id_19", "id_20",
    "id_30", "id_31", "id_33",
)


@dataclass(frozen=True)
class Partitions:
    train: pd.DataFrame
    validation: pd.DataFrame
    test: pd.DataFrame

    def counts(self) -> dict[str, int]:
        return {name: len(getattr(self, name)) for name in ("train", "validation", "test")}


def load_ieee(data_dir: str | Path) -> pd.DataFrame:
    """Load only the columns needed by the pipeline from labeled IEEE-CIS data."""
    root = Path(data_dir)
    transactions = pd.read_csv(root / "train_transaction.csv", usecols=TRANSACTION_COLUMNS)
    identity = pd.read_csv(root / "train_identity.csv", usecols=IDENTITY_COLUMNS)
    if transactions["TransactionID"].duplicated().any():
        raise ValueError("TransactionID must be unique in train_transaction.csv")
    if identity["TransactionID"].duplicated().any():
        raise ValueError("TransactionID must be unique in train_identity.csv")
    result = transactions.merge(identity, on="TransactionID", how="left", validate="one_to_one")
    if result["isFraud"].isna().any():
        raise ValueError("Labeled training data contains missing isFraud values")
    return result.sort_values(["TransactionDT", "TransactionID"], kind="stable").reset_index(drop=True)


def chronological_split(
    frame: pd.DataFrame, train_fraction: float = 0.56, validation_fraction: float = 0.14
) -> Partitions:
    """Use 56% train, 14% validation, 30% final test by default.

    The train and validation partitions together are the first 70% of the data.
    Boundary ties are assigned by stable TransactionID order and disclosed in the
    generated run manifest.
    """
    if train_fraction <= 0 or validation_fraction <= 0 or train_fraction + validation_fraction >= 1:
        raise ValueError("Fractions must leave nonempty train, validation, and test partitions")
    ordered = frame.sort_values(["TransactionDT", "TransactionID"], kind="stable").reset_index(drop=True)
    first = int(len(ordered) * train_fraction)
    second = int(len(ordered) * (train_fraction + validation_fraction))
    if first == 0 or second == first or second == len(ordered):
        raise ValueError("Dataset is too small for the requested partition fractions")
    return Partitions(
        train=ordered.iloc[:first].copy(),
        validation=ordered.iloc[first:second].copy(),
        test=ordered.iloc[second:].copy(),
    )
