import { Ring, Transaction, Alert, GraphNode, GraphEdge, EvidenceItem, ModelMetrics, OverviewMetrics } from '../types';

export const overviewMetrics: OverviewMetrics = {
  activeRings: 37,
  highRiskRings: 12,
  transactionsAnalyzed: '1.84M',
  blockedExposure: '₹42.8M',
  activeRingsDelta: '+5 today',
  highRiskDelta: '+3 today',
};

export const rings: Ring[] = [
  {
    id: 'AR-06441', riskScore: 91.4, transactions: 37, timeSpan: '2h 07m',
    sharedDevices: 8, sharedNetworks: 5, sharedCards: 12, signalDiversity: 5,
    financialExposure: 1840000, detected: '26 Aug 2026, 16:42', status: 'critical',
    action: 'hard_block', edges: 82, avgDegree: 4.43, graphDensity: 0.124,
    connectedComponents: 1, relationshipTypes: 5, burstRatio: 0.91,
    mismatchRate: 1.0, dropHouseScore: 0.78, amountConcentration: 0.85,
  },
  {
    id: 'AR-06438', riskScore: 84.7, transactions: 24, timeSpan: '4h 31m',
    sharedDevices: 5, sharedNetworks: 3, sharedCards: 8, signalDiversity: 4,
    financialExposure: 920000, detected: '26 Aug 2026, 16:35', status: 'high',
    action: 'hard_block', edges: 48, avgDegree: 4.0, graphDensity: 0.174,
    connectedComponents: 1, relationshipTypes: 4, burstRatio: 0.78,
    mismatchRate: 0.87, dropHouseScore: 0.65, amountConcentration: 0.72,
  },
  {
    id: 'AR-06391', riskScore: 76.2, transactions: 19, timeSpan: '6h 14m',
    sharedDevices: 4, sharedNetworks: 2, sharedCards: 6, signalDiversity: 3,
    financialExposure: 580000, detected: '26 Aug 2026, 15:18', status: 'high',
    action: 'hard_block', edges: 31, avgDegree: 3.26, graphDensity: 0.182,
    connectedComponents: 1, relationshipTypes: 3, burstRatio: 0.64,
    mismatchRate: 0.74, dropHouseScore: 0.52, amountConcentration: 0.61,
  },
  {
    id: 'AR-06387', riskScore: 68.9, transactions: 15, timeSpan: '1d 2h',
    sharedDevices: 3, sharedNetworks: 2, sharedCards: 5, signalDiversity: 3,
    financialExposure: 430000, detected: '26 Aug 2026, 14:52', status: 'medium',
    action: 'step_up', edges: 22, avgDegree: 2.93, graphDensity: 0.210,
    connectedComponents: 1, relationshipTypes: 3, burstRatio: 0.45,
    mismatchRate: 0.53, dropHouseScore: 0.38, amountConcentration: 0.49,
  },
  {
    id: 'AR-06352', riskScore: 62.1, transactions: 12, timeSpan: '1d 8h',
    sharedDevices: 2, sharedNetworks: 2, sharedCards: 4, signalDiversity: 3,
    financialExposure: 310000, detected: '26 Aug 2026, 13:45', status: 'medium',
    action: 'step_up', edges: 18, avgDegree: 3.0, graphDensity: 0.273,
    connectedComponents: 1, relationshipTypes: 3, burstRatio: 0.38,
    mismatchRate: 0.42, dropHouseScore: 0.31, amountConcentration: 0.44,
  },
  {
    id: 'AR-06318', riskScore: 55.3, transactions: 9, timeSpan: '2d 5h',
    sharedDevices: 2, sharedNetworks: 1, sharedCards: 3, signalDiversity: 2,
    financialExposure: 210000, detected: '26 Aug 2026, 11:30', status: 'medium',
    action: 'step_up', edges: 12, avgDegree: 2.67, graphDensity: 0.333,
    connectedComponents: 1, relationshipTypes: 2, burstRatio: 0.28,
    mismatchRate: 0.33, dropHouseScore: 0.22, amountConcentration: 0.35,
  },
  {
    id: 'AR-06291', riskScore: 41.8, transactions: 7, timeSpan: '3d 14h',
    sharedDevices: 1, sharedNetworks: 1, sharedCards: 2, signalDiversity: 2,
    financialExposure: 140000, detected: '26 Aug 2026, 09:12', status: 'medium',
    action: 'step_up', edges: 8, avgDegree: 2.29, graphDensity: 0.381,
    connectedComponents: 1, relationshipTypes: 2, burstRatio: 0.18,
    mismatchRate: 0.29, dropHouseScore: 0.15, amountConcentration: 0.28,
  },
  {
    id: 'AR-06245', riskScore: 34.2, transactions: 5, timeSpan: '5d 1h',
    sharedDevices: 1, sharedNetworks: 1, sharedCards: 2, signalDiversity: 2,
    financialExposure: 85000, detected: '25 Aug 2026, 22:48', status: 'low',
    action: 'allow', edges: 6, avgDegree: 2.4, graphDensity: 0.600,
    connectedComponents: 1, relationshipTypes: 2, burstRatio: 0.10,
    mismatchRate: 0.20, dropHouseScore: 0.08, amountConcentration: 0.18,
  },
  {
    id: 'AR-06198', riskScore: 22.5, transactions: 4, timeSpan: '7d 3h',
    sharedDevices: 1, sharedNetworks: 0, sharedCards: 1, signalDiversity: 1,
    financialExposure: 52000, detected: '25 Aug 2026, 18:15', status: 'low',
    action: 'allow', edges: 4, avgDegree: 2.0, graphDensity: 0.667,
    connectedComponents: 1, relationshipTypes: 1, burstRatio: 0.05,
    mismatchRate: 0.0, dropHouseScore: 0.04, amountConcentration: 0.12,
  },
  {
    id: 'AR-06152', riskScore: 15.1, transactions: 3, timeSpan: '12d 6h',
    sharedDevices: 0, sharedNetworks: 0, sharedCards: 1, signalDiversity: 1,
    financialExposure: 31000, detected: '25 Aug 2026, 14:02', status: 'low',
    action: 'allow', edges: 3, avgDegree: 2.0, graphDensity: 1.0,
    connectedComponents: 1, relationshipTypes: 1, burstRatio: 0.0,
    mismatchRate: 0.0, dropHouseScore: 0.0, amountConcentration: 0.08,
  },
];

export const riskActivityData = [
  { time: '00:00', detected: 2, critical: 0 },
  { time: '02:00', detected: 1, critical: 0 },
  { time: '04:00', detected: 3, critical: 1 },
  { time: '06:00', detected: 5, critical: 1 },
  { time: '08:00', detected: 4, critical: 0 },
  { time: '10:00', detected: 7, critical: 2 },
  { time: '12:00', detected: 6, critical: 1 },
  { time: '14:00', detected: 8, critical: 3 },
  { time: '16:00', detected: 11, critical: 4 },
  { time: '18:00', detected: 9, critical: 2 },
  { time: '20:00', detected: 5, critical: 1 },
  { time: '22:00', detected: 3, critical: 0 },
];

export const riskDistribution = [
  { level: 'Critical', count: 12, color: '#C62828' },
  { level: 'High', count: 18, color: '#B26A00' },
  { level: 'Medium', count: 31, color: '#E8A317' },
  { level: 'Low', count: 47, color: '#287D3C' },
];

export const ringGraphData: { nodes: GraphNode[]; edges: GraphEdge[] } = {
  nodes: Array.from({ length: 37 }, (_, i) => ({
    id: `txn-${3677800 + i}`,
    label: `${3677800 + i}`,
    amount: Math.round(150 + Math.random() * 300),
    timestamp: `2026-08-26T${String(14 + Math.floor(i / 10)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00`,
    device: i < 8 ? 'SM-G930P' : i < 15 ? 'iOS Device' : 'Windows',
    network: i < 12 ? '192.168.1.x' : i < 25 ? '10.0.0.x' : '172.16.x.x',
    riskContribution: i < 5 ? 0.9 + Math.random() * 0.1 : i < 15 ? 0.6 + Math.random() * 0.3 : 0.2 + Math.random() * 0.4,
    status: i < 5 ? 'high_risk' as const : i < 15 ? 'suspicious' as const : 'normal' as const,
  })),
  edges: [
    // Device relationships
    ...Array.from({ length: 12 }, (_, i) => ({ source: `txn-${3677800}`, target: `txn-${3677801 + i}`, type: 'device' as const })),
    // Card relationships
    ...Array.from({ length: 10 }, (_, i) => ({ source: `txn-${3677805 + i}`, target: `txn-${3677815 + i}`, type: 'card' as const })),
    // Network relationships
    ...Array.from({ length: 8 }, (_, i) => ({ source: `txn-${3677800 + i * 2}`, target: `txn-${3677801 + i * 2}`, type: 'network' as const })),
    // Address relationships
    ...Array.from({ length: 6 }, (_, i) => ({ source: `txn-${3677810 + i}`, target: `txn-${3677820 + i}`, type: 'address' as const })),
    // Cross links
    { source: 'txn-3677800', target: 'txn-3677825', type: 'device' as const },
    { source: 'txn-3677800', target: 'txn-3677830', type: 'network' as const },
    { source: 'txn-3677805', target: 'txn-3677835', type: 'card' as const },
    { source: 'txn-3677810', target: 'txn-3677800', type: 'address' as const },
    ...Array.from({ length: 15 }, (_, i) => ({
      source: `txn-${3677800 + (i * 3) % 37}`,
      target: `txn-${3677800 + (i * 7 + 5) % 37}`,
      type: (['device', 'card', 'network', 'address', 'browser', 'email'] as const)[i % 6],
    })),
  ],
};

export const evidenceItems: EvidenceItem[] = [
  { name: 'Temporal Burst', severity: 'high', description: 'Transactions concentrated within 2h 07m window', score: 0.91 },
  { name: 'Device Reuse', severity: 'high', description: '8 transactions share suspicious device relationships', score: 0.86 },
  { name: 'Network Overlap', severity: 'high', description: '5 network identities connect multiple transactions', score: 0.83 },
  { name: 'Amount Pattern', severity: 'high', description: 'Unusual concentration of transaction amounts', score: 0.78 },
  { name: 'Identity Mismatch', severity: 'high', description: '100% of name/address verification checks failed', score: 0.92 },
  { name: 'Graph Density', severity: 'medium-high', description: 'Dense local transaction neighborhood structure', score: 0.72 },
];

export const modelMetrics: ModelMetrics = {
  rocAuc: 0.7830,
  recall: 0.6343,
  precision: 0.1832,
  f1Score: 0.2650,
  prAuc: 0.3412,
  embeddingDim: 64,
  gnnLayers: 2,
  classificationThreshold: 0.70,
  totalParameters: 36353,
};

export const alerts: Alert[] = [
  { id: 'ALT-0041', ringId: 'AR-06441', riskScore: 91.4, severity: 'critical', detected: '26 Aug, 16:42', exposure: 1840000, status: 'new', assignedTo: 'Unassigned' },
  { id: 'ALT-0040', ringId: 'AR-06438', riskScore: 84.7, severity: 'high', detected: '26 Aug, 16:35', exposure: 920000, status: 'investigating', assignedTo: 'A. Kumar' },
  { id: 'ALT-0039', ringId: 'AR-06391', riskScore: 76.2, severity: 'high', detected: '26 Aug, 15:18', exposure: 580000, status: 'new', assignedTo: 'Unassigned' },
  { id: 'ALT-0038', ringId: 'AR-06387', riskScore: 68.9, severity: 'medium', detected: '26 Aug, 14:52', exposure: 430000, status: 'investigating', assignedTo: 'S. Patel' },
  { id: 'ALT-0037', ringId: 'AR-06352', riskScore: 62.1, severity: 'medium', detected: '26 Aug, 13:45', exposure: 310000, status: 'escalated', assignedTo: 'R. Singh' },
  { id: 'ALT-0036', ringId: 'AR-06318', riskScore: 55.3, severity: 'medium', detected: '26 Aug, 11:30', exposure: 210000, status: 'resolved', assignedTo: 'A. Kumar' },
  { id: 'ALT-0035', ringId: 'AR-06291', riskScore: 41.8, severity: 'medium', detected: '26 Aug, 09:12', exposure: 140000, status: 'false_positive', assignedTo: 'S. Patel' },
  { id: 'ALT-0034', ringId: 'AR-06245', riskScore: 34.2, severity: 'low', detected: '25 Aug, 22:48', exposure: 85000, status: 'resolved', assignedTo: 'R. Singh' },
];

export const transactions: Transaction[] = Array.from({ length: 37 }, (_, i) => ({
  id: `TXN-${3677800 + i}`,
  amount: Math.round((150 + Math.random() * 350) * 100) / 100,
  timestamp: `2026-08-26T${String(14 + Math.floor(i / 10)).padStart(2, '0')}:${String((i * 4 + 12) % 60).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
  device: i < 8 ? 'SM-G930P Build/NRD90M' : i < 15 ? 'iOS Device' : i < 25 ? 'Windows 10' : 'SAMSUNG SM-G935A',
  network: i < 12 ? '192.168.1.x' : i < 25 ? '10.0.0.x' : '172.16.x.x',
  card: `****${String(1000 + (i * 317) % 9000).padStart(4, '0')}`,
  email: `user${i + 1}@${['gmail.com', 'hotmail.com', 'yahoo.com', 'aol.com'][i % 4]}`,
  ringId: i < 37 ? 'AR-06441' : null,
  riskScore: i < 5 ? 85 + Math.random() * 15 : i < 15 ? 50 + Math.random() * 35 : 10 + Math.random() * 40,
  status: i < 5 ? 'blocked' as const : i < 15 ? 'flagged' as const : i < 30 ? 'review' as const : 'approved' as const,
  isFraud: i < 15,
}));

export const investigationReport = {
  executiveAssessment: 'This ring exhibits strong temporal coordination and repeated identity/network relationships. The activity is concentrated within a short 2-hour window and presents a high likelihood of coordinated payment abuse. Multiple shared device fingerprints and network signatures indicate a single operator or a small group using automated tools to execute rapid sequential transactions across synthetic identities.',
  keyFindings: [
    'Strong temporal concentration — 91% of transaction pairs within 1-hour window',
    'Multiple shared identity relationships across 5 distinct signal types',
    'Dense local transaction structure with 82 edges connecting 37 nodes',
    'Elevated financial exposure totaling ₹18.4 lakhs across the ring',
    '100% identity verification mismatch rate (M4/M5/M6 all failed)',
    'Central hub node (TXN-3677800) with 12 direct connections — potential coordinator',
  ],
  recommendedAction: 'HARD BLOCK',
  evidenceSources: {
    transactions: 37,
    relationships: 82,
    features: 13,
    modelScore: '91.4%',
  },
  decisionEngine: 'GraphSAGE Ring Classifier',
  investigationAssistant: 'Gemini 3.6 Flash + RAG',
};
