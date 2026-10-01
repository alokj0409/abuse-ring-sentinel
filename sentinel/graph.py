"""Seven typed identity links and deterministic connected-component discovery."""

from __future__ import annotations

from dataclasses import dataclass
from itertools import combinations
from typing import Iterable

import pandas as pd


FINGERPRINTS: dict[str, tuple[str, ...]] = {
    "device": ("DeviceInfo", "id_33"),
    "card_loose": ("card1", "card2"),
    "card_strict": ("card1", "card2", "card3"),
    "address_card": ("addr1", "addr2", "card1"),
    "network": ("id_17", "id_19", "id_20"),
    "email_card": ("P_emaildomain", "card1"),
    "browser": ("id_30", "id_31"),
}


@dataclass(frozen=True)
class Ring:
    id: str
    transaction_ids: tuple[int, ...]

    @property
    def size(self) -> int:
        return len(self.transaction_ids)


@dataclass(frozen=True)
class Discovery:
    rings: tuple[Ring, ...]
    oversized_components: int
    oversized_transactions: int
    isolated_transactions: int
    fingerprint_groups: dict[str, int]


def _normalize(series: pd.Series) -> pd.Series:
    """Turn a single fingerprint part into stable text; missing stays missing."""
    result = series.astype("string").str.strip().str.lower()
    return result.mask(result.eq(""))


def make_fingerprints(frame: pd.DataFrame) -> pd.DataFrame:
    """Add all seven composite identifiers, never treating a missing part as text."""
    missing = {column for columns in FINGERPRINTS.values() for column in columns} - set(frame.columns)
    if missing:
        raise ValueError(f"Missing fingerprint input columns: {sorted(missing)}")
    result = frame.copy()
    for name, columns in FINGERPRINTS.items():
        parts = [_normalize(result[column]) for column in columns]
        fingerprint = parts[0]
        for part in parts[1:]:
            fingerprint = fingerprint.str.cat(part, sep="|")
        result[f"fp_{name}"] = fingerprint
    return result


def learn_vocabulary(frame: pd.DataFrame, min_frequency: int = 2, max_frequency: int = 100) -> dict[str, set[str]]:
    """Learn allowable fingerprints from the training period only."""
    if min_frequency < 2 or max_frequency < min_frequency:
        raise ValueError("Expected 2 <= min_frequency <= max_frequency")
    vocab: dict[str, set[str]] = {}
    for name in FINGERPRINTS:
        column = f"fp_{name}"
        counts = frame[column].value_counts(dropna=True)
        vocab[name] = set(counts[(counts >= min_frequency) & (counts <= max_frequency)].index)
    return vocab


def apply_vocabulary(frame: pd.DataFrame, vocabulary: dict[str, set[str]]) -> pd.DataFrame:
    """Apply the frozen training vocabulary without learning from later periods."""
    if set(vocabulary) != set(FINGERPRINTS):
        raise ValueError("Vocabulary must contain all seven fingerprint types")
    result = frame.copy()
    for name, values in vocabulary.items():
        column = f"fp_{name}"
        result[column] = result[column].where(result[column].isin(values), pd.NA)
    return result


def _groups(frame: pd.DataFrame, column: str) -> Iterable[tuple[int, ...]]:
    for members in frame.loc[frame[column].notna()].groupby(column, sort=False)["TransactionID"]:
        ids = tuple(int(value) for value in members[1])
        if len(ids) > 1:
            yield ids


def discover_rings(frame: pd.DataFrame, min_size: int = 2, max_size: int = 500) -> Discovery:
    """Find typed-link connected components without materializing dense cliques."""
    if min_size < 2 or max_size < min_size:
        raise ValueError("Expected 2 <= min_size <= max_size")
    ids = [int(value) for value in frame["TransactionID"]]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate TransactionID values would corrupt ring discovery")
    parent = {identifier: identifier for identifier in ids}
    size = {identifier: 1 for identifier in ids}

    def find(identifier: int) -> int:
        while parent[identifier] != identifier:
            parent[identifier] = parent[parent[identifier]]
            identifier = parent[identifier]
        return identifier

    def union(left: int, right: int) -> None:
        a, b = find(left), find(right)
        if a == b:
            return
        if size[a] < size[b]:
            a, b = b, a
        parent[b] = a
        size[a] += size[b]

    counts: dict[str, int] = {}
    for name in FINGERPRINTS:
        counts[name] = 0
        for members in _groups(frame, f"fp_{name}"):
            counts[name] += 1
            anchor = members[0]
            for member in members[1:]:
                union(anchor, member)

    components: dict[int, list[int]] = {}
    for identifier in ids:
        components.setdefault(find(identifier), []).append(identifier)
    rings = []
    oversized = 0
    oversized_transactions = 0
    isolated = 0
    for members in components.values():
        if len(members) == 1:
            isolated += 1
        elif len(members) > max_size:
            oversized += 1
            oversized_transactions += len(members)
        elif len(members) >= min_size:
            ordered = tuple(sorted(members))
            rings.append(Ring(f"AR-{ordered[0]}", ordered))
    rings.sort(key=lambda ring: ring.transaction_ids[0])
    return Discovery(tuple(rings), oversized, oversized_transactions, isolated, counts)


def typed_edges(frame: pd.DataFrame, ring: Ring) -> list[tuple[int, int, str]]:
    """Return local-index directed edges for each relationship type in a ring."""
    indexed = frame.set_index("TransactionID")
    if not indexed.index.is_unique:
        raise ValueError("TransactionID must be unique to extract typed edges")
    indexed = indexed.loc[list(ring.transaction_ids)]
    positions = {identifier: index for index, identifier in enumerate(ring.transaction_ids)}
    edges: list[tuple[int, int, str]] = []
    for name in FINGERPRINTS:
        for value, members in indexed.loc[indexed[f"fp_{name}"].notna()].groupby(f"fp_{name}", sort=False):
            _ = value
            local = [positions[int(identifier)] for identifier in members.index]
            for left, right in combinations(local, 2):
                edges.append((left, right, name))
                edges.append((right, left, name))
    return edges
