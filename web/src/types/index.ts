export interface Ring {
  id: string;
  riskScore: number;
  transactions: number;
  timeSpan: string;
  sharedDevices: number;
  sharedNetworks: number;
  sharedCards: number;
  signalDiversity: number;
  financialExposure: number;
  detected: string;
  status: 'critical' | 'high' | 'medium' | 'low';
  action: 'hard_block' | 'step_up' | 'allow';
  edges: number;
  avgDegree: number;
  graphDensity: number;
  connectedComponents: number;
  relationshipTypes: number;
  burstRatio: number;
  mismatchRate: number;
  dropHouseScore: number;
  amountConcentration: number;
}

export interface Transaction {
  id: string;
  amount: number;
  timestamp: string;
  device: string;
  network: string;
  card: string;
  email: string;
  ringId: string | null;
  riskScore: number;
  status: 'flagged' | 'blocked' | 'approved' | 'review';
  isFraud: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  amount: number;
  timestamp: string;
  device: string;
  network: string;
  riskContribution: number;
  status: 'normal' | 'suspicious' | 'high_risk';
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'device' | 'card' | 'network' | 'address' | 'browser' | 'email';
}

export interface Alert {
  id: string;
  ringId: string;
  riskScore: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detected: string;
  exposure: number;
  status: 'new' | 'investigating' | 'escalated' | 'resolved' | 'false_positive';
  assignedTo: string;
}

export interface EvidenceItem {
  name: string;
  severity: 'high' | 'medium-high' | 'medium' | 'low';
  description: string;
  score: number;
}

export interface ModelMetrics {
  rocAuc: number;
  recall: number;
  precision: number;
  f1Score: number;
  prAuc: number;
  embeddingDim: number;
  gnnLayers: number;
  classificationThreshold: number;
  totalParameters: number;
}

export interface OverviewMetrics {
  activeRings: number;
  highRiskRings: number;
  transactionsAnalyzed: string;
  blockedExposure: string;
  activeRingsDelta: string;
  highRiskDelta: string;
}
