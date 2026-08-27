# Abuse-Ring Sentinel (Razorpay AI Buildathon)

> **Track:** AI Risk Manager  
> **Focus:** Detecting coordinated fraud rings and abuse networks using Graph Community Detection.

## The Problem
Traditional fraud detection relies heavily on rules engines or ML models that evaluate transactions **in isolation**. They are effective at catching a stolen card used once, but fail to detect **coordinated abuse rings** (such as referral fraud, promo-code abuse, or money laundering networks) where fraudsters utilize synthetic or mixed identities to avoid detection.

Attempting to link accounts using simple shared attributes (such as shared IP address or common card prefix alone) leads to **"Mega-Clusters"**—unmanageable groups of over 500,000 unrelated transactions that lack actionable risk intelligence.

## Our Solution: Multi-Signal Graph Detection
**Abuse-Ring Sentinel** addresses this challenge by generating high-precision identity fingerprints and evaluating the *network structure* of transactions rather than isolated events.

### 1. Multi-Signal Identity Fingerprinting & Leak-Free Frequency Filtering
We extract 7 distinct identity fingerprints to establish high-confidence edges between transactions:
1. `Device`: Strict DeviceInfo + Screen Resolution (`DeviceInfo` + `id_33`)
2. `Card (Loose)`: Partial card matching (`card1` + `card2`)
3. `Card (Strict)`: Full card matching (`card1` + `card2` + `card3`)
4. `Address+Card`: Billing location + card link (`addr1` + `addr2` + `card1`)
5. `Network`: Shared IP/Proxy signatures (`id_17` + `id_19` + `id_20`)
6. `Email+Card`: Cross-session identity tracking (`P_emaildomain` + `card1`)
7. `Browser`: OS + Browser version footprint (`id_30` + `id_31`)

*We apply **Leak-Free Frequency Filtering** to all fingerprints learned strictly from the 70% Training Set. Any fingerprint occurring more than 100 times is filtered out as structural noise (e.g., generic user-agent strings), successfully breaking apart Mega-Clusters into actionable fraud rings on unseen test data.*

### 2. Graph Community Detection
Using `NetworkX`, we construct a graph where Nodes represent Transactions and Edges represent Shared Fingerprints. Connected components capped at a maximum of 500 nodes are extracted to isolate candidate fraud rings.

### 3. GraphSAGE Hybrid Classifier & Action Tiers
Once candidate rings are isolated from the graph, a **Hybrid GraphSAGE (PyTorch Geometric) + Domain Classifier** processes each ring.
- **Graph Neural Network Layer:** A 2-layer GraphSAGE (`SAGEConv`) network performs structural message passing over 7-dimensional transaction node features (normalized amount, time, local degree, distance anomaly, device presence, network presence, identity mismatch rate).
- **Domain Fusion Head:** Combines GraphSAGE mean and max pooled graph embeddings (128-dim) with 13 ring-level domain features (cluster size, temporal burst, amount concentration, drop-house distance anomaly, identity mismatch rate, time span).
- **Proportional Action Tiers:**
  - **HARD BLOCK (High Risk >= 70%):** Immediate freeze on high-confidence fraud networks.
  - **STEP-UP OTP (Medium Risk 40% - 69%):** Triggers 2FA/OTP re-authentication (protects legitimate users caught in mixed rings while stopping fraudsters).
  - **ALLOW (Low Risk < 40%):** Permits normal legitimate transactions.

### 4. Gemini LLM RAG AI Investigator
Extracts structured JSON evidence packages (topology, temporal metrics, financial patterns, identity mismatches, hub nodes) from high-risk rings and queries **Google Gemini 3.6 Flash** to synthesize evidence-grounded forensic investigation reports with operational action plans for the Risk Team.

---

## Out-of-Sample Benchmark & Model Performance

To ensure zero data leakage, the dataset of 590,540 transactions was split chronologically into a **70% Training Set** (first 413,378 transactions) and a **30% Held-Out Test Set** (last 177,162 transactions):

### 1. Model Comparison: Random Forest Baseline vs GraphSAGE Hybrid (Held-Out Test Set)

| Metric | Random Forest Baseline | GraphSAGE Hybrid (PyG) | Performance Delta |
| :--- | :---: | :---: | :---: |
| **Out-of-Sample ROC-AUC** | 0.7405 | **0.7830** | **+0.0424 (+5.7%)** |
| **Fraud Ring Recall (@0.50)** | 40.91% | **63.43%** | **+22.52% (+55.0% catch rate)** |
| **F1-Score (@0.50)** | 0.2413 | **0.2650** | **+0.0237** |
| **Model Parameters** | N/A (150 trees) | **36,353 parameters** | Deep Structural GNN |

*GraphSAGE's structural message passing captures topological graph motifs and hub centrality that flat domain features miss, boosting fraud ring recall by +22.5%.*

### 2. GraphSAGE Action Tier Breakdown (Held-Out Test Set: 7,301 Rings)
- **HARD BLOCK Tier (Risk >= 0.70):** **293 rings** flagged with **77.87% average risk** ($1,159,925 financial exposure protected).
- **STEP-UP OTP Tier (0.40 <= Risk < 0.70):** **2,347 rings** routed to 2FA/OTP verification ($4,858,838 exposure).
- **ALLOW Tier (Risk < 0.40):** **4,661 rings** allowed cleanly with a low fraud rate of **1.12%** ($3,349,656 volume).

### 3. Gemini LLM Forensic AI Investigator Output
- **RAG Architecture:** Feeds structured 20-field JSON evidence packages into Google Gemini 3.6 Flash.
- **Forensic Breakdown:** Generates executive summaries, ASCII topology diagrams, temporal burst analysis, identity mismatch evaluation, and 4 specific operational mitigation protocols for Risk Analysts.

## Tech Stack
- **PyTorch Geometric (PyG):** 2-layer GraphSAGE (`SAGEConv`) message passing, mean/max pooling, and custom batching.
- **Google Gemini API (`gemini-3.6-flash`):** RAG prompt engineering for LLM-synthesized forensic fraud reports.
- **Python, Pandas, NumPy, NetworkX:** Temporal splitting, typed graph construction, and component extraction.
- **Scikit-Learn:** StandardScaler normalization and Random Forest baseline benchmarks.
- **Matplotlib:** Network topology visualization.

---

## Dataset & Setup Instructions

The pipeline uses the official **IEEE-CIS Fraud Detection** dataset. Due to file size limitations (>600MB raw files), raw dataset files are not hosted directly in the Git repository.

### 1. Download Dataset
Download the dataset files directly from Kaggle:
- **Kaggle Link:** [IEEE-CIS Fraud Detection Competition Dataset](https://www.kaggle.com/c/ieee-fraud-detection/data)
- **CLI Download Command:**
  ```bash
  kaggle competitions download -c ieee-fraud-detection
  ```

### 2. Required Files
Place the uncompressed CSV files in the root project directory:
- `train_transaction.csv`
- `train_identity.csv`
- `test_transaction.csv`
- `test_identity.csv`

---
*Built for the Razorpay AI Buildathon 2026.*
