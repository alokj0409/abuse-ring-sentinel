# Graph policy comparison — 2026-10-01

All runs used the same labeled IEEE-CIS chronological 56/14/30 split, seven available fingerprint types, an any-fraud ring proxy label, a 500-transaction component cap, and a Random Forest classifier trained independently for each candidate set. No synthetic transactions were used. Model metrics across rows apply to **different sets of rings** and should not be read as a controlled model-only improvement.

| Offline policy | Test candidate rings | Transactions in eligible rings | Fraud transactions in eligible rings | Transactions excluded in oversized components | Test ROC-AUC | Test PR-AUC |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| All seven types join; frozen training vocabulary | 5,277 | 53,313 | Not recorded in first run | 58,325 | 0.7558 | 0.1998 |
| Three high-confidence types join; frozen training vocabulary | 8,096 | 85,174 | 2,497 / 6,125 (40.8%) | 2,989 | 0.7618 | 0.3045 |
| Three high-confidence types join; frequency filtered within each complete period | 8,298 | 86,073 | 2,464 / 6,125 (40.2%) | 21,978 | 0.7747 | 0.3113 |

The high-confidence joins are device, strict card, and address-plus-card. All seven fingerprint types remain available as typed relationships and model evidence inside eligible rings. Loose card, network, email-plus-card, and browser links do not merge components by themselves.

**Selected default:** high-confidence joins with the frozen training vocabulary. It substantially reduces oversized components and has slightly higher fraud-transaction candidate coverage than the period-local variant. The period-local variant is useful as an offline sensitivity check, but it sees the complete unlabeled validation or test period at once and therefore does not support online inference claims.

**Remaining limit:** 3,628 of 6,125 fraud transactions in the test period are outside eligible candidate rings. A ring classifier cannot recover them. Future failure analysis should investigate missing identity fields, novel fingerprints, singleton frauds, and whether a causal rolling window can improve coverage without expanding mega-clusters.
