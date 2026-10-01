import { useState, useRef, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RCTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  LayoutDashboard, Activity, FileSearch, List, Network, Bell, Cpu, Settings,
  Shield, Search, ZoomIn, ZoomOut, Maximize2, X, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { REAL_RINGS, REAL_GEMINI_REPORTS } from './data/realEvidenceData';

// ─── TYPES ──────────────────────────────────────────────────────────────────────

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
type Page =
  | 'overview'
  | 'ring-monitor'
  | 'ring-detail'
  | 'transaction-explorer'
  | 'graph-explorer'
  | 'alerts'
  | 'model-insights'
  | 'system';

interface Ring {
  id: string; riskScore: number; riskLevel: RiskLevel; transactions: number;
  timeSpan: string; sharedDevices: number; sharedNetworks: number;
  signalDiversity: number; exposure: number; detected: string;
  status: string;
}
interface Transaction {
  id: string; amount: number; timestamp: string; device: string; network: string;
  ringId: string; riskScore: number; riskLevel: RiskLevel; status: string;
}
interface Alert {
  id: string; ringId: string; riskScore: number; severity: RiskLevel;
  detected: string; exposure: number; status: string; assignedTo: string;
}
interface GraphNode {
  id: string; x: number; y: number; risk: RiskLevel;
  amount: number; timestamp: string; device: string; network: string; riskContrib: number;
}
interface GraphEdge {
  source: number; target: number;
  type: 'Device' | 'Card' | 'Network' | 'Address' | 'Browser' | 'Email';
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const RISK_COLOR: Record<RiskLevel, string> = {
  critical: '#C62828', high: '#B26A00', medium: '#D97706', low: '#287D3C',
};
const RISK_BG: Record<RiskLevel, string> = {
  critical: '#FEF2F2', high: '#FFF7ED', medium: '#FEFCE8', low: '#F0FDF4',
};
const RISK_BORDER: Record<RiskLevel, string> = {
  critical: '#FECACA', high: '#FED7AA', medium: '#FDE68A', low: '#BBF7D0',
};
const NODE_FILL: Record<RiskLevel, string> = {
  critical: '#C62828', high: '#D97706', medium: '#F59E0B', low: '#9CA3AF',
};
const EDGE_COLOR: Record<string, string> = {
  Device: '#2457A6', Card: '#B26A00', Network: '#287D3C',
  Address: '#6B7280', Browser: '#7C3AED', Email: '#C62828',
};
const STATUS_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  active:           { color: '#C62828', bg: '#FEF2F2', border: '#FECACA', label: 'Active' },
  investigating:    { color: '#B26A00', bg: '#FFF7ED', border: '#FED7AA', label: 'Investigating' },
  escalated:        { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', label: 'Escalated' },
  resolved:         { color: '#287D3C', bg: '#F0FDF4', border: '#BBF7D0', label: 'Resolved' },
  'false-positive': { color: '#667085', bg: '#F9FAFB', border: '#E5E7EB', label: 'False Positive' },
  new:              { color: '#C62828', bg: '#FEF2F2', border: '#FECACA', label: 'New' },
  blocked:          { color: '#C62828', bg: '#FEF2F2', border: '#FECACA', label: 'Blocked' },
  flagged:          { color: '#B26A00', bg: '#FFF7ED', border: '#FED7AA', label: 'Flagged' },
  review:           { color: '#B26A00', bg: '#FFF7ED', border: '#FED7AA', label: 'Review' },
  cleared:          { color: '#287D3C', bg: '#F0FDF4', border: '#BBF7D0', label: 'Cleared' },
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const RINGS: Ring[] = REAL_RINGS.map(r => ({
  id: r.id,
  riskScore: r.riskScore,
  riskLevel: r.riskLevel as RiskLevel,
  transactions: r.transactions,
  timeSpan: r.timeSpan,
  sharedDevices: r.sharedDevices,
  sharedNetworks: r.sharedNetworks,
  signalDiversity: r.signalDiversity,
  exposure: r.exposure,
  detected: r.detected,
  status: r.status
}));

const TRANSACTIONS: Transaction[] = [
  { id:'TXN-9841', amount:48500, timestamp:'26 Aug 2026, 16:42', device:'DEV-A1', network:'NET-01', ringId:'AR-06441', riskScore:94, riskLevel:'critical', status:'blocked' },
  { id:'TXN-9842', amount:52000, timestamp:'26 Aug 2026, 16:43', device:'DEV-A2', network:'NET-01', ringId:'AR-06441', riskScore:91, riskLevel:'critical', status:'blocked' },
  { id:'TXN-9843', amount:45200, timestamp:'26 Aug 2026, 16:44', device:'DEV-A1', network:'NET-02', ringId:'AR-06441', riskScore:89, riskLevel:'critical', status:'blocked' },
  { id:'TXN-9844', amount:39800, timestamp:'26 Aug 2026, 16:45', device:'DEV-A3', network:'NET-01', ringId:'AR-06441', riskScore:88, riskLevel:'critical', status:'blocked' },
  { id:'TXN-9845', amount:61500, timestamp:'26 Aug 2026, 16:46', device:'DEV-A2', network:'NET-03', ringId:'AR-06441', riskScore:92, riskLevel:'critical', status:'blocked' },
  { id:'TXN-9820', amount:31200, timestamp:'26 Aug 2026, 13:17', device:'DEV-B1', network:'NET-04', ringId:'AR-06438', riskScore:84, riskLevel:'high',     status:'flagged' },
  { id:'TXN-9821', amount:28500, timestamp:'26 Aug 2026, 13:22', device:'DEV-B2', network:'NET-04', ringId:'AR-06438', riskScore:81, riskLevel:'high',     status:'flagged' },
  { id:'TXN-9822', amount:35700, timestamp:'26 Aug 2026, 13:35', device:'DEV-B1', network:'NET-05', ringId:'AR-06438', riskScore:79, riskLevel:'high',     status:'review' },
  { id:'TXN-9800', amount:22400, timestamp:'26 Aug 2026, 11:04', device:'DEV-C1', network:'NET-02', ringId:'AR-06429', riskScore:77, riskLevel:'high',     status:'flagged' },
  { id:'TXN-9801', amount:18700, timestamp:'26 Aug 2026, 11:11', device:'DEV-C2', network:'NET-06', ringId:'AR-06429', riskScore:75, riskLevel:'high',     status:'review' },
  { id:'TXN-9780', amount:41700, timestamp:'25 Aug 2026, 22:38', device:'DEV-D1', network:'NET-03', ringId:'AR-06421', riskScore:76, riskLevel:'high',     status:'flagged' },
  { id:'TXN-9781', amount:29100, timestamp:'25 Aug 2026, 23:05', device:'DEV-D2', network:'NET-07', ringId:'AR-06421', riskScore:73, riskLevel:'high',     status:'review' },
  { id:'TXN-9750', amount:15300, timestamp:'25 Aug 2026, 18:55', device:'DEV-E1', network:'NET-08', ringId:'AR-06415', riskScore:68, riskLevel:'medium',   status:'review' },
  { id:'TXN-9751', amount:19600, timestamp:'25 Aug 2026, 19:22', device:'DEV-E2', network:'NET-05', ringId:'AR-06415', riskScore:65, riskLevel:'medium',   status:'review' },
  { id:'TXN-9720', amount:11200, timestamp:'25 Aug 2026, 14:22', device:'DEV-F1', network:'NET-02', ringId:'AR-06407', riskScore:63, riskLevel:'medium',   status:'review' },
  { id:'TXN-9700', amount:8700,  timestamp:'25 Aug 2026, 09:47', device:'DEV-G1', network:'NET-09', ringId:'AR-06399', riskScore:61, riskLevel:'medium',   status:'review' },
  { id:'TXN-9680', amount:13400, timestamp:'24 Aug 2026, 20:14', device:'DEV-H1', network:'NET-03', ringId:'AR-06391', riskScore:56, riskLevel:'medium',   status:'cleared' },
  { id:'TXN-9650', amount:9800,  timestamp:'24 Aug 2026, 11:31', device:'DEV-I1', network:'NET-06', ringId:'AR-06374', riskScore:42, riskLevel:'low',      status:'cleared' },
  { id:'TXN-9620', amount:7500,  timestamp:'23 Aug 2026, 16:08', device:'DEV-J1', network:'NET-10', ringId:'AR-06361', riskScore:37, riskLevel:'low',      status:'cleared' },
  { id:'TXN-9590', amount:12100, timestamp:'23 Aug 2026, 08:53', device:'DEV-K1', network:'NET-04', ringId:'AR-06348', riskScore:34, riskLevel:'low',      status:'cleared' },
];

const ALERTS: Alert[] = [
  { id:'ALT-1041', ringId:'AR-06441', riskScore:91.4, severity:'critical', detected:'26 Aug 2026, 16:42', exposure:1840000, status:'new',           assignedTo:'A. Mehta' },
  { id:'ALT-1040', ringId:'AR-06438', riskScore:84.7, severity:'high',     detected:'26 Aug 2026, 13:17', exposure:1120000, status:'investigating', assignedTo:'R. Sharma' },
  { id:'ALT-1039', ringId:'AR-06429', riskScore:78.3, severity:'high',     detected:'26 Aug 2026, 11:04', exposure:870000,  status:'new',           assignedTo:'Unassigned' },
  { id:'ALT-1038', ringId:'AR-06421', riskScore:76.2, severity:'high',     detected:'25 Aug 2026, 22:38', exposure:740000,  status:'escalated',     assignedTo:'V. Krishnan' },
  { id:'ALT-1037', ringId:'AR-06415', riskScore:68.9, severity:'medium',   detected:'25 Aug 2026, 18:55', exposure:520000,  status:'investigating', assignedTo:'P. Singh' },
  { id:'ALT-1036', ringId:'AR-06407', riskScore:65.1, severity:'medium',   detected:'25 Aug 2026, 14:22', exposure:410000,  status:'new',           assignedTo:'Unassigned' },
  { id:'ALT-1035', ringId:'AR-06399', riskScore:61.4, severity:'medium',   detected:'25 Aug 2026, 09:47', exposure:380000,  status:'investigating', assignedTo:'A. Mehta' },
  { id:'ALT-1034', ringId:'AR-06391', riskScore:57.8, severity:'medium',   detected:'24 Aug 2026, 20:14', exposure:290000,  status:'resolved',      assignedTo:'R. Sharma' },
  { id:'ALT-1033', ringId:'AR-06374', riskScore:43.2, severity:'low',      detected:'24 Aug 2026, 11:31', exposure:180000,  status:'resolved',      assignedTo:'P. Singh' },
  { id:'ALT-1032', ringId:'AR-06361', riskScore:38.7, severity:'low',      detected:'23 Aug 2026, 16:08', exposure:140000,  status:'false-positive',assignedTo:'V. Krishnan' },
  { id:'ALT-1031', ringId:'AR-06348', riskScore:35.1, severity:'low',      detected:'23 Aug 2026, 08:53', exposure:110000,  status:'resolved',      assignedTo:'R. Sharma' },
  { id:'ALT-1030', ringId:'AR-06332', riskScore:31.6, severity:'low',      detected:'22 Aug 2026, 21:20', exposure:80000,   status:'false-positive',assignedTo:'A. Mehta' },
];

const ACTIVITY_DATA = [
  { time:'08:00', rings:2 },{ time:'09:00', rings:3 },{ time:'10:00', rings:5 },
  { time:'11:00', rings:7 },{ time:'12:00', rings:9 },{ time:'13:00', rings:12 },
  { time:'14:00', rings:11 },{ time:'15:00', rings:14 },{ time:'16:00', rings:18 },
  { time:'17:00', rings:21 },{ time:'18:00', rings:20 },{ time:'19:00', rings:16 },
];

const RISK_DIST = [
  { level:'Critical', count:12, color:'#C62828' },
  { level:'High',     count:18, color:'#B26A00' },
  { level:'Medium',   count:31, color:'#D97706' },
  { level:'Low',      count:47, color:'#287D3C' },
];

// Pre-computed ring layout: 37 nodes, viewBox 0 0 640 560, center (320,280)
// Core cluster (0–11) r=80 | Secondary (12–26) r=175 | Outer (27–36) r=250
const GRAPH_NODES: GraphNode[] = [
  { id:'TXN-001', x:400, y:280, risk:'critical', amount:48500, timestamp:'16:42:03', device:'DEV-A1', network:'NET-01', riskContrib:0.94 },
  { id:'TXN-002', x:381, y:320, risk:'critical', amount:52000, timestamp:'16:43:17', device:'DEV-A2', network:'NET-01', riskContrib:0.91 },
  { id:'TXN-003', x:360, y:348, risk:'critical', amount:45200, timestamp:'16:44:05', device:'DEV-A1', network:'NET-02', riskContrib:0.89 },
  { id:'TXN-004', x:320, y:360, risk:'critical', amount:39800, timestamp:'16:45:22', device:'DEV-A3', network:'NET-01', riskContrib:0.88 },
  { id:'TXN-005', x:280, y:348, risk:'critical', amount:61500, timestamp:'16:46:11', device:'DEV-A2', network:'NET-03', riskContrib:0.92 },
  { id:'TXN-006', x:251, y:320, risk:'critical', amount:43700, timestamp:'16:47:38', device:'DEV-A4', network:'NET-02', riskContrib:0.87 },
  { id:'TXN-007', x:240, y:280, risk:'critical', amount:55000, timestamp:'16:48:54', device:'DEV-A1', network:'NET-01', riskContrib:0.93 },
  { id:'TXN-008', x:251, y:240, risk:'critical', amount:47300, timestamp:'16:50:02', device:'DEV-A3', network:'NET-02', riskContrib:0.86 },
  { id:'TXN-009', x:280, y:212, risk:'critical', amount:58900, timestamp:'16:51:28', device:'DEV-A5', network:'NET-01', riskContrib:0.90 },
  { id:'TXN-010', x:320, y:200, risk:'critical', amount:44100, timestamp:'16:52:44', device:'DEV-A2', network:'NET-03', riskContrib:0.85 },
  { id:'TXN-011', x:360, y:212, risk:'critical', amount:67200, timestamp:'16:54:15', device:'DEV-A4', network:'NET-04', riskContrib:0.91 },
  { id:'TXN-012', x:389, y:240, risk:'critical', amount:50600, timestamp:'16:55:32', device:'DEV-A1', network:'NET-02', riskContrib:0.88 },
  { id:'TXN-013', x:495, y:280, risk:'high',     amount:31200, timestamp:'16:56:48', device:'DEV-B1', network:'NET-01', riskContrib:0.74 },
  { id:'TXN-014', x:480, y:351, risk:'high',     amount:28500, timestamp:'16:58:03', device:'DEV-B2', network:'NET-02', riskContrib:0.71 },
  { id:'TXN-015', x:437, y:410, risk:'high',     amount:35700, timestamp:'17:00:22', device:'DEV-B3', network:'NET-03', riskContrib:0.76 },
  { id:'TXN-016', x:374, y:446, risk:'high',     amount:29100, timestamp:'17:02:15', device:'DEV-B1', network:'NET-05', riskContrib:0.69 },
  { id:'TXN-017', x:302, y:454, risk:'high',     amount:42300, timestamp:'17:04:37', device:'DEV-B4', network:'NET-02', riskContrib:0.73 },
  { id:'TXN-018', x:233, y:431, risk:'high',     amount:26800, timestamp:'17:06:51', device:'DEV-B2', network:'NET-04', riskContrib:0.68 },
  { id:'TXN-019', x:178, y:383, risk:'high',     amount:38500, timestamp:'17:09:03', device:'DEV-B5', network:'NET-01', riskContrib:0.75 },
  { id:'TXN-020', x:149, y:316, risk:'high',     amount:33200, timestamp:'17:11:28', device:'DEV-B3', network:'NET-03', riskContrib:0.70 },
  { id:'TXN-021', x:149, y:244, risk:'high',     amount:41700, timestamp:'17:13:42', device:'DEV-B1', network:'NET-02', riskContrib:0.77 },
  { id:'TXN-022', x:174, y:177, risk:'high',     amount:27900, timestamp:'17:16:05', device:'DEV-B6', network:'NET-05', riskContrib:0.66 },
  { id:'TXN-023', x:233, y:129, risk:'high',     amount:45600, timestamp:'17:18:33', device:'DEV-B2', network:'NET-01', riskContrib:0.78 },
  { id:'TXN-024', x:302, y:106, risk:'medium',   amount:22400, timestamp:'17:21:17', device:'DEV-B4', network:'NET-03', riskContrib:0.59 },
  { id:'TXN-025', x:374, y:114, risk:'medium',   amount:18700, timestamp:'17:24:52', device:'DEV-B7', network:'NET-02', riskContrib:0.54 },
  { id:'TXN-026', x:437, y:150, risk:'medium',   amount:31500, timestamp:'17:27:38', device:'DEV-B3', network:'NET-04', riskContrib:0.61 },
  { id:'TXN-027', x:481, y:209, risk:'medium',   amount:25800, timestamp:'17:31:04', device:'DEV-B5', network:'NET-01', riskContrib:0.58 },
  { id:'TXN-028', x:570, y:280, risk:'medium',   amount:15300, timestamp:'17:35:22', device:'DEV-C1', network:'NET-06', riskContrib:0.48 },
  { id:'TXN-029', x:522, y:427, risk:'medium',   amount:19600, timestamp:'17:39:47', device:'DEV-C2', network:'NET-03', riskContrib:0.52 },
  { id:'TXN-030', x:397, y:518, risk:'low',      amount:11200, timestamp:'17:44:13', device:'DEV-C3', network:'NET-05', riskContrib:0.34 },
  { id:'TXN-031', x:243, y:518, risk:'low',      amount:8700,  timestamp:'17:48:29', device:'DEV-C1', network:'NET-06', riskContrib:0.28 },
  { id:'TXN-032', x:118, y:426, risk:'low',      amount:13400, timestamp:'17:52:58', device:'DEV-C4', network:'NET-02', riskContrib:0.31 },
  { id:'TXN-033', x:70,  y:280, risk:'low',      amount:9800,  timestamp:'17:57:34', device:'DEV-C2', network:'NET-07', riskContrib:0.25 },
  { id:'TXN-034', x:118, y:134, risk:'low',      amount:12100, timestamp:'18:02:11', device:'DEV-C5', network:'NET-03', riskContrib:0.29 },
  { id:'TXN-035', x:243, y:42,  risk:'low',      amount:7500,  timestamp:'18:07:47', device:'DEV-C3', network:'NET-06', riskContrib:0.22 },
  { id:'TXN-036', x:397, y:42,  risk:'low',      amount:10300, timestamp:'18:12:19', device:'DEV-C1', network:'NET-04', riskContrib:0.26 },
  { id:'TXN-037', x:522, y:133, risk:'medium',   amount:16700, timestamp:'18:17:53', device:'DEV-C6', network:'NET-01', riskContrib:0.44 },
];

// 82 edges: 22 core-core + 29 core-secondary + 12 secondary-secondary + 19 secondary-outer
const GRAPH_EDGES: GraphEdge[] = [
  // Core-Core (22)
  {source:0,target:1,type:'Device'},{source:0,target:2,type:'Device'},{source:0,target:3,type:'Card'},
  {source:0,target:4,type:'Device'},{source:0,target:5,type:'Network'},{source:0,target:6,type:'Device'},
  {source:1,target:2,type:'Device'},{source:1,target:3,type:'Card'},{source:1,target:11,type:'Device'},
  {source:2,target:3,type:'Network'},{source:2,target:9,type:'Device'},{source:3,target:4,type:'Card'},
  {source:3,target:8,type:'Device'},{source:4,target:5,type:'Device'},{source:4,target:7,type:'Network'},
  {source:5,target:6,type:'Card'},{source:5,target:8,type:'Device'},{source:6,target:7,type:'Device'},
  {source:6,target:9,type:'Network'},{source:7,target:8,type:'Device'},{source:9,target:10,type:'Card'},
  {source:10,target:11,type:'Device'},
  // Core-Secondary (29)
  {source:0,target:12,type:'Device'},{source:0,target:26,type:'Network'},
  {source:1,target:12,type:'Card'},{source:1,target:13,type:'Device'},
  {source:2,target:13,type:'Network'},{source:2,target:14,type:'Device'},
  {source:3,target:14,type:'Card'},{source:3,target:15,type:'Device'},{source:3,target:16,type:'Network'},
  {source:4,target:16,type:'Device'},{source:4,target:17,type:'Card'},
  {source:5,target:17,type:'Network'},{source:5,target:18,type:'Device'},
  {source:6,target:18,type:'Card'},{source:6,target:19,type:'Device'},
  {source:7,target:19,type:'Network'},{source:7,target:20,type:'Device'},
  {source:8,target:20,type:'Card'},{source:8,target:21,type:'Network'},
  {source:9,target:21,type:'Device'},{source:9,target:22,type:'Card'},
  {source:10,target:22,type:'Network'},{source:10,target:23,type:'Device'},
  {source:11,target:23,type:'Card'},{source:11,target:24,type:'Network'},
  {source:11,target:25,type:'Device'},{source:11,target:26,type:'Card'},
  {source:0,target:13,type:'Address'},{source:5,target:19,type:'Browser'},
  // Secondary-Secondary (12)
  {source:12,target:13,type:'Network'},{source:13,target:14,type:'Card'},
  {source:15,target:16,type:'Device'},{source:16,target:17,type:'Network'},
  {source:18,target:19,type:'Card'},{source:19,target:20,type:'Device'},
  {source:20,target:21,type:'Network'},{source:22,target:23,type:'Card'},
  {source:23,target:24,type:'Device'},{source:24,target:25,type:'Address'},
  {source:25,target:26,type:'Network'},{source:26,target:12,type:'Browser'},
  // Secondary-Outer (19)
  {source:12,target:27,type:'Card'},{source:13,target:28,type:'Network'},
  {source:14,target:28,type:'Address'},{source:15,target:29,type:'Device'},
  {source:16,target:29,type:'Card'},{source:17,target:30,type:'Network'},
  {source:18,target:31,type:'Address'},{source:19,target:32,type:'Device'},
  {source:20,target:32,type:'Card'},{source:21,target:33,type:'Network'},
  {source:22,target:33,type:'Address'},{source:23,target:34,type:'Browser'},
  {source:24,target:35,type:'Email'},{source:25,target:35,type:'Address'},
  {source:26,target:36,type:'Network'},{source:12,target:36,type:'Card'},
  {source:14,target:29,type:'Email'},{source:21,target:34,type:'Browser'},
  {source:23,target:36,type:'Address'},
];

// ─── UTILITY ──────────────────────────────────────────────────────────────────

function fmt(amount: number): string {
  if (amount >= 1000000) return `₹${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000)    return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const labels: Record<RiskLevel, string> = { critical:'CRITICAL', high:'HIGH', medium:'MEDIUM', low:'LOW' };
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold tracking-wide rounded"
      style={{ color: RISK_COLOR[level], background: RISK_BG[level], border: `1px solid ${RISK_BORDER[level]}` }}
    >
      {labels[level]}{score !== undefined && ` ${score.toFixed(1)}%`}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { color:'#667085', bg:'#F9FAFB', border:'#E5E7EB', label: status };
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold tracking-wide rounded"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

function MetricCard({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="bg-white border border-[#D9DDE3] rounded p-4">
      <div className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-[#17202A] tabular-nums leading-tight mb-1">{value}</div>
      {delta && <div className="text-[11px] text-[#667085]">{delta}</div>}
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id:'overview',             label:'Overview',             Icon:LayoutDashboard },
  { id:'ring-monitor',         label:'Ring Monitor',         Icon:Activity },
  { id:'ring-detail',          label:'Investigations',       Icon:FileSearch },
  { id:'transaction-explorer', label:'Transaction Explorer', Icon:List },
  { id:'graph-explorer',       label:'Graph Explorer',       Icon:Network },
  { id:'alerts',               label:'Alerts',               Icon:Bell },
  { id:'model-insights',       label:'Model Insights',       Icon:Cpu },
  { id:'system',               label:'System',               Icon:Settings },
];

function Sidebar({
  current, navigate, collapsed, toggleCollapse,
}: {
  current: string; navigate: (p: Page) => void; collapsed: boolean; toggleCollapse: () => void;
}) {
  return (
    <div
      className={`flex-shrink-0 flex flex-col h-screen overflow-hidden transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
      style={{ background: '#172B4D' }}
    >
      <div className="flex items-center justify-between px-3.5 py-4 border-b border-[#1E3A5F]">
        <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
          <div className="w-7 h-7 flex items-center justify-center rounded flex-shrink-0" style={{ background: '#2457A6' }}>
            <Shield size={14} color="white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-white text-[11px] font-bold leading-none tracking-wider truncate">ABUSE-RING</div>
              <div className="text-[#94A3B8] text-[10px] font-medium leading-none tracking-wider mt-0.5 truncate">SENTINEL</div>
            </div>
          )}
        </div>
        <button
          onClick={toggleCollapse}
          title={collapsed ? 'Expand Menu' : 'Contract Menu'}
          className="p-1 rounded text-[#94A3B8] hover:text-white hover:bg-[#1E3A5F] transition-colors flex-shrink-0 cursor-pointer ml-1"
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id as Page)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 py-2.5 transition-colors cursor-pointer ${
                collapsed ? 'justify-center px-0' : 'px-4 text-left'
              }`}
              style={{
                background: active ? '#1E3A5F' : 'transparent',
                color: active ? '#FFFFFF' : '#94A3B8',
                borderLeft: active ? '2px solid #2457A6' : '2px solid transparent',
              }}
            >
              <Icon size={14} className="flex-shrink-0" />
              {!collapsed && <span className="text-[12px] font-medium truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="px-3.5 py-4 border-t border-[#1E3A5F] space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#22C55E' }} />
          {!collapsed && <span className="text-[10px] font-semibold tracking-wide" style={{ color: '#94A3B8' }}>GNN ONLINE</span>}
        </div>
        {!collapsed && (
          <div className="text-[10px] space-y-0.5" style={{ color: '#64748B' }}>
            <div>Dataset: <span style={{ color: '#94A3B8' }}>IEEE-CIS</span></div>
            <div>Env: <span style={{ color: '#94A3B8' }}>Production / Demo</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TOP HEADER ───────────────────────────────────────────────────────────────

function TopHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#D9DDE3] flex-shrink-0">
      <div>
        <h1 className="text-[14px] font-semibold text-[#17202A]">{title}</h1>
        {subtitle && <p className="text-[11px] text-[#667085] mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#667085]" />
          <input
            placeholder="Search..."
            className="pl-7 pr-3 py-1.5 text-[12px] border border-[#D9DDE3] rounded bg-white text-[#17202A] placeholder:text-[#667085] focus:outline-none focus:border-[#2457A6] w-44"
          />
        </div>
        <button className="relative p-1.5 rounded hover:bg-[#F7F8FA] transition-colors">
          <Bell size={14} className="text-[#667085]" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background:'#C62828' }} />
        </button>
        <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background:'#2457A6' }}>
          AL
        </div>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-[#D9DDE3] text-[#667085] tracking-wider">PROD</span>
      </div>
    </div>
  );
}

// ─── TRANSACTION GRAPH ────────────────────────────────────────────────────────

interface TXTooltip { node: GraphNode; x: number; y: number }

function TransactionGraph({
  nodes, edges, activeTypes, onNodeSelect,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  activeTypes: Set<string>;
  onNodeSelect?: (n: GraphNode | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef({ tx: 0, ty: 0, scale: 1 });
  const [trans, setTrans] = useState({ tx: 0, ty: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragDist = useRef(0);
  const [tooltip, setTooltip] = useState<TXTooltip | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Non-passive wheel for zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const t = transformRef.current;
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      const newScale = Math.max(0.25, Math.min(6, t.scale * factor));
      const dx = (mx - t.tx) / t.scale;
      const dy = (my - t.ty) / t.scale;
      const next = { tx: mx - dx * newScale, ty: my - dy * newScale, scale: newScale };
      transformRef.current = next;
      setTrans(next);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const rect = containerRef.current!.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - rect.left - transformRef.current.tx,
      y: e.clientY - rect.top  - transformRef.current.ty,
    };
    dragDist.current = 0;
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    dragDist.current += Math.abs(e.movementX) + Math.abs(e.movementY);
    const rect = containerRef.current!.getBoundingClientRect();
    const next = {
      tx: e.clientX - rect.left - dragStartRef.current.x,
      ty: e.clientY - rect.top  - dragStartRef.current.y,
      scale: transformRef.current.scale,
    };
    transformRef.current = next;
    setTrans(next);
  }, [isDragging]);

  const onMouseUp = useCallback(() => setIsDragging(false), []);
  const resetView = useCallback(() => {
    const next = { tx: 0, ty: 0, scale: 1 };
    transformRef.current = next;
    setTrans(next);
  }, []);

  const filteredEdges = edges.filter(e => activeTypes.has(e.type));

  return (
    <div
      ref={containerRef}
      className="relative rounded border border-[#D9DDE3] overflow-hidden select-none"
      style={{ height: 480, background: '#FAFBFC', cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <svg width="100%" height="100%" viewBox="0 0 640 560" preserveAspectRatio="xMidYMid meet">
        <g transform={`translate(${trans.tx} ${trans.ty}) scale(${trans.scale})`}>
          {filteredEdges.map((edge, i) => {
            const s = nodes[edge.source];
            const t = nodes[edge.target];
            if (!s || !t) return null;
            return (
              <line
                key={`e${i}`}
                x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                stroke={EDGE_COLOR[edge.type]}
                strokeWidth={0.8 / trans.scale}
                strokeOpacity={0.45}
              />
            );
          })}
          {nodes.map((node, i) => {
            const sel = selectedId === node.id;
            return (
              <g
                key={`n${i}`}
                transform={`translate(${node.x} ${node.y})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => {
                  const rect = containerRef.current!.getBoundingClientRect();
                  setTooltip({ node, x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onMouseLeave={() => setTooltip(null)}
                onClick={e => {
                  e.stopPropagation();
                  if (dragDist.current < 5) {
                    const next = sel ? null : node.id;
                    setSelectedId(next);
                    onNodeSelect?.(next ? node : null);
                  }
                }}
              >
                <circle
                  r={(sel ? 7.5 : 5.5) / trans.scale}
                  fill={NODE_FILL[node.risk]}
                  stroke={sel ? '#17202A' : 'rgba(255,255,255,0.6)'}
                  strokeWidth={1.2 / trans.scale}
                  fillOpacity={0.88}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {tooltip && (
        <div
          className="absolute z-20 bg-white border border-[#D9DDE3] rounded p-2.5 text-[11px] shadow-sm pointer-events-none"
          style={{
            left: Math.min(tooltip.x + 14, (containerRef.current?.offsetWidth ?? 600) - 175),
            top:  Math.max(tooltip.y - 12, 6),
            width: 170,
          }}
        >
          <div className="font-semibold text-[#17202A] mb-1.5">{tooltip.node.id}</div>
          <div className="space-y-0.5 text-[#667085]">
            <div>Amount: <span className="text-[#17202A] font-medium">{fmt(tooltip.node.amount)}</span></div>
            <div>Time: <span className="text-[#17202A] font-medium">{tooltip.node.timestamp}</span></div>
            <div>Device: <span className="text-[#17202A] font-medium font-mono">{tooltip.node.device}</span></div>
            <div>Network: <span className="text-[#17202A] font-medium font-mono">{tooltip.node.network}</span></div>
            <div className="pt-1 mt-1 border-t border-[#F3F4F6]">
              <RiskBadge level={tooltip.node.risk} />
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1">
        {Object.entries(EDGE_COLOR).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1 text-[10px]" style={{ color:'#667085' }}>
            <span style={{ display:'block', width:14, height:1.5, background:color, opacity:0.8 }} />
            {type}
          </div>
        ))}
        <div className="flex items-center gap-2 ml-3 text-[10px]" style={{ color:'#667085' }}>
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background:'#C62828' }} /> Critical
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background:'#D97706' }} /> High
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background:'#9CA3AF' }} /> Low
        </div>
      </div>

      <div className="absolute top-3 right-3 flex gap-1">
        {[
          { Icon: ZoomIn,   action: () => { const s=Math.min(6,trans.scale*1.2); const n={...trans,scale:s}; transformRef.current=n; setTrans(n); } },
          { Icon: ZoomOut,  action: () => { const s=Math.max(0.25,trans.scale*0.8); const n={...trans,scale:s}; transformRef.current=n; setTrans(n); } },
          { Icon: Maximize2,action: resetView },
        ].map(({ Icon, action }, i) => (
          <button
            key={i}
            onClick={action}
            className="w-6 h-6 flex items-center justify-center bg-white border border-[#D9DDE3] rounded text-[#667085] hover:bg-[#F7F8FA] transition-colors"
          >
            <Icon size={12} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── PAGE: OVERVIEW ───────────────────────────────────────────────────────────

function OverviewPage({ navigate }: { navigate: (p: Page, id?: string) => void }) {
  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Sample Rings"          value={String(RINGS.length)} delta="Historical examples" />
        <MetricCard label="Sample Critical Rings" value={String(RINGS.filter(r => r.riskLevel === 'critical').length)} delta="Exploratory scores" />
        <MetricCard label="Labeled Transactions" value="590,540" delta="IEEE-CIS research data" />
        <MetricCard label="Baseline ROC-AUC" value="0.7558" delta="Held-out Random Forest" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white border border-[#D9DDE3] rounded p-4">
          <div className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider mb-3">Illustrative Ring Activity</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ACTIVITY_DATA} margin={{ top:4, right:4, left:-18, bottom:0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize:10, fill:'#667085' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'#667085' }} axisLine={false} tickLine={false} />
              <RCTooltip
                contentStyle={{ border:'1px solid #D9DDE3', borderRadius:4, fontSize:11, padding:'5px 10px' }}
                labelStyle={{ color:'#17202A', fontWeight:600 }}
              />
              <Area type="monotone" dataKey="rings" stroke="#2457A6" strokeWidth={1.5} fill="#2457A6" fillOpacity={0.07} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-[#D9DDE3] rounded p-4">
          <div className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider mb-4">Illustrative Risk Distribution</div>
          <div className="space-y-4">
            {RISK_DIST.map(({ level, count, color }) => (
              <div key={level}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span style={{ color }} className="font-semibold">{level}</span>
                  <span className="tabular-nums font-bold text-[#17202A]">{count}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'#F3F4F6' }}>
                  <div className="h-full rounded-full" style={{ width:`${(count/108)*100}%`, background:color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#D9DDE3] rounded">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#D9DDE3]">
          <div className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider">Recent High-Risk Rings</div>
          <button onClick={() => navigate('ring-monitor')} className="text-[11px] text-[#2457A6] font-medium hover:underline">View all →</button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D9DDE3]">
              {['Ring ID','Detected','Transactions','Devices','Networks','Risk Score','Status','Action'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color:'#667085' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RINGS.slice(0, 6).map(ring => (
              <tr
                key={ring.id}
                className="border-b border-[#F3F4F6] transition-colors cursor-pointer"
                style={{ background:'white' }}
                onMouseEnter={e => (e.currentTarget.style.background='#FAFBFC')}
                onMouseLeave={e => (e.currentTarget.style.background='white')}
                onClick={() => navigate('ring-detail', ring.id)}
              >
                <td className="px-4 py-2.5 text-[12px] font-semibold" style={{ color:'#2457A6' }}>{ring.id}</td>
                <td className="px-4 py-2.5 text-[11px] tabular-nums" style={{ color:'#667085' }}>{ring.detected.split(', ')[1]}</td>
                <td className="px-4 py-2.5 text-[12px] tabular-nums" style={{ color:'#17202A' }}>{ring.transactions}</td>
                <td className="px-4 py-2.5 text-[12px] tabular-nums" style={{ color:'#17202A' }}>{ring.sharedDevices}</td>
                <td className="px-4 py-2.5 text-[12px] tabular-nums" style={{ color:'#17202A' }}>{ring.sharedNetworks}</td>
                <td className="px-4 py-2.5">
                  <span className="tabular-nums font-bold text-[13px]" style={{ color: RISK_COLOR[ring.riskLevel] }}>{ring.riskScore.toFixed(1)}%</span>
                </td>
                <td className="px-4 py-2.5"><StatusBadge status={ring.status} /></td>
                <td className="px-4 py-2.5">
                  <button
                    className="text-[11px] font-medium px-2 py-0.5 rounded border transition-colors"
                    style={{ borderColor:'#D9DDE3', color:'#2457A6', background:'transparent' }}
                    onClick={e => { e.stopPropagation(); navigate('ring-detail', ring.id); }}
                  >
                    {ring.riskLevel === 'critical' ? 'Investigate' : 'Review'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PAGE: RING MONITOR ───────────────────────────────────────────────────────

type SortField = keyof Ring;

function RingMonitorPage({ navigate }: { navigate: (p: Page, id?: string) => void }) {
  const [search, setSearch]         = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [statFilter, setStatFilter] = useState('all');
  const [sortField, setSortField]   = useState<SortField>('riskScore');
  const [sortDir, setSortDir]       = useState<'asc'|'desc'>('desc');
  const [pg, setPg]                 = useState(0);
  const PS = 8;

  const rows = [...RINGS]
    .filter(r => {
      if (riskFilter !== 'all' && r.riskLevel !== riskFilter) return false;
      if (statFilter !== 'all' && r.status !== statFilter) return false;
      if (search && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const va = a[sortField], vb = b[sortField];
      if (typeof va === 'number' && typeof vb === 'number') return sortDir==='asc' ? va-vb : vb-va;
      return sortDir==='asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  const paged = rows.slice(pg * PS, (pg + 1) * PS);
  const totalPg = Math.ceil(rows.length / PS);

  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortField(f); setSortDir('desc'); }
  };

  const SortArrow = ({ f }: { f: SortField }) =>
    sortField === f ? <span style={{ color:'#2457A6' }}>{sortDir==='asc'?' ↑':' ↓'}</span>
                    : <span style={{ color:'#D9DDE3' }}> ↕</span>;

  const cols: { key: SortField; label: string }[] = [
    { key:'id', label:'Ring ID' }, { key:'riskScore', label:'Risk Score' },
    { key:'transactions', label:'Txns' }, { key:'timeSpan', label:'Time Span' },
    { key:'sharedDevices', label:'Devices' }, { key:'sharedNetworks', label:'Networks' },
    { key:'signalDiversity', label:'Signals' }, { key:'exposure', label:'Exposure' },
    { key:'detected', label:'Detected' }, { key:'status', label:'Status' },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#667085]" />
          <input
            placeholder="Search ring ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPg(0); }}
            className="pl-7 pr-3 py-1.5 text-[12px] border border-[#D9DDE3] rounded bg-white placeholder:text-[#667085] focus:outline-none focus:border-[#2457A6] w-52"
            style={{ color:'#17202A' }}
          />
        </div>
        {[
          { val: riskFilter, set: (v: string) => { setRiskFilter(v); setPg(0); }, opts: [['all','All Risk Levels'],['critical','Critical'],['high','High'],['medium','Medium'],['low','Low']] },
          { val: statFilter, set: (v: string) => { setStatFilter(v); setPg(0); }, opts: [['all','All Statuses'],['active','Active'],['investigating','Investigating'],['escalated','Escalated'],['resolved','Resolved'],['false-positive','False Positive']] },
        ].map((sel, i) => (
          <select key={i} value={sel.val} onChange={e => sel.set(e.target.value)}
            className="px-2.5 py-1.5 text-[12px] border border-[#D9DDE3] rounded bg-white focus:outline-none focus:border-[#2457A6]"
            style={{ color:'#17202A' }}>
            {sel.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <span className="ml-auto text-[11px]" style={{ color:'#667085' }}>{rows.length} rings</span>
      </div>

      <div className="bg-white border border-[#D9DDE3] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D9DDE3]" style={{ background:'#F7F8FA' }}>
                {cols.map(({ key, label }) => (
                  <th key={key} onClick={() => toggleSort(key)}
                    className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer"
                    style={{ color:'#667085' }}>
                    {label}<SortArrow f={key} />
                  </th>
                ))}
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color:'#667085' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(ring => (
                <tr key={ring.id}
                  className="border-b border-[#F3F4F6] cursor-pointer transition-colors"
                  style={{ background:'white' }}
                  onMouseEnter={e => (e.currentTarget.style.background='#FAFBFC')}
                  onMouseLeave={e => (e.currentTarget.style.background='white')}
                  onClick={() => navigate('ring-detail', ring.id)}
                >
                  <td className="px-3 py-2.5 text-[12px] font-semibold whitespace-nowrap" style={{ color:'#2457A6' }}>{ring.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="tabular-nums font-bold text-[13px]" style={{ color: RISK_COLOR[ring.riskLevel] }}>{ring.riskScore.toFixed(1)}%</span>
                      <RiskBadge level={ring.riskLevel} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] tabular-nums" style={{ color:'#17202A' }}>{ring.transactions}</td>
                  <td className="px-3 py-2.5 text-[12px] whitespace-nowrap" style={{ color:'#667085' }}>{ring.timeSpan}</td>
                  <td className="px-3 py-2.5 text-[12px] tabular-nums" style={{ color:'#17202A' }}>{ring.sharedDevices}</td>
                  <td className="px-3 py-2.5 text-[12px] tabular-nums" style={{ color:'#17202A' }}>{ring.sharedNetworks}</td>
                  <td className="px-3 py-2.5 text-[12px] tabular-nums" style={{ color:'#17202A' }}>{ring.signalDiversity}</td>
                  <td className="px-3 py-2.5 text-[12px] tabular-nums whitespace-nowrap font-medium" style={{ color:'#17202A' }}>{fmt(ring.exposure)}</td>
                  <td className="px-3 py-2.5 text-[11px] whitespace-nowrap" style={{ color:'#667085' }}>{ring.detected}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={ring.status} /></td>
                  <td className="px-3 py-2.5">
                    <button
                      className="text-[11px] font-medium px-2 py-0.5 rounded border transition-colors"
                      style={{ borderColor:'#D9DDE3', color:'#2457A6', background:'transparent' }}
                      onClick={e => { e.stopPropagation(); navigate('ring-detail', ring.id); }}
                    >Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#D9DDE3]">
          <span className="text-[11px]" style={{ color:'#667085' }}>
            Showing {pg*PS+1}–{Math.min((pg+1)*PS, rows.length)} of {rows.length}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPg(p=>Math.max(0,p-1))} disabled={pg===0}
              className="px-2 py-1 text-[11px] border border-[#D9DDE3] rounded disabled:opacity-40 hover:bg-[#F7F8FA] transition-colors"
              style={{ color:'#667085' }}>Prev</button>
            {Array.from({ length: totalPg }, (_, i) => (
              <button key={i} onClick={() => setPg(i)}
                className="px-2 py-1 text-[11px] rounded border transition-colors"
                style={{
                  borderColor: i===pg ? '#2457A6' : '#D9DDE3',
                  color: i===pg ? '#2457A6' : '#667085',
                  background: i===pg ? '#EEF4FF' : 'transparent',
                }}>{i+1}</button>
            ))}
            <button onClick={() => setPg(p=>Math.min(totalPg-1,p+1))} disabled={pg===totalPg-1}
              className="px-2 py-1 text-[11px] border border-[#D9DDE3] rounded disabled:opacity-40 hover:bg-[#F7F8FA] transition-colors"
              style={{ color:'#667085' }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: RING DETAIL ────────────────────────────────────────────────────────


async function fetchLiveGeminiReport(ring: Ring): Promise<string> {
  const endpoint = '/api/investigate';

  const prompt = `
You are senior financial crime analyst at Razorpay.
Generate a formal, highly professional Forensic Fraud Investigation Report for Candidate Abuse Ring ${ring.id}:

[EVIDENCE PACKAGE]
- Ring ID: ${ring.id}
- GraphSAGE Risk Score: ${ring.riskScore.toFixed(1)}%
- Risk Level: ${ring.riskLevel.toUpperCase()}
- Ring Scale: ${ring.transactions} Transactions | 82 Graph Edges
- Time Window: ${ring.timeSpan}
- Financial Exposure: INR ${(ring.exposure).toLocaleString('en-IN')}
- Shared Identity Signals: ${ring.sharedDevices} Devices | ${ring.sharedNetworks} Networks | ${ring.signalDiversity} Signal Types

STRICT FORMALITY CONSTRAINTS:
1. ABSOLUTELY NO EMOJIS, ICONS, OR CONVERSATIONAL FILLER.
2. DO NOT USE DECORATIVE HORIZONTAL DIVIDERS LIKE '---' OR '***'.
3. USE FORMAL ENTERPRISE BANKING TERMINOLOGY ONLY.

Structure into 4 formal sections:
### SECTION 1: EXECUTIVE BRIEFING AND ACTION RECOMMENDATION
### SECTION 2: NETWORK TOPOLOGY AND CROSS-SIGNAL LINKAGE ANALYSIS
### SECTION 3: TEMPORAL BURST AND FINANCIAL EXPOSURE ANALYSIS
### SECTION 4: OPERATIONAL MITIGATION PROTOCOLS FOR RISK OPS
`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ringId: ring.id, prompt })
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return `Report service unavailable (HTTP ${res.status}). ${errJson.error?.message || 'Please try again later.'}`;
    }
    const data = await res.json();
    return data.report;
  } catch (err) {
    return 'Report service unavailable. Please try again later.';
  }
}

function MarkdownViewer({ content }: { content: string }) {
  if (!content) return null;

  const sanitize = (str: string) => {
    return str
      // Remove all emojis and symbols
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .trim();
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  lines.forEach((line, idx) => {
    const raw = line.trim();
    if (!raw) return;

    // Filter out decorative dividers (---, ***, ===, --- ***)
    if (/^[-*=_\s]{3,}$/.test(raw)) return;

    if (raw.startsWith('|')) {
      const cols = raw.split('|').map(c => sanitize(c)).filter(c => c.length > 0);
      if (cols.every(c => c.startsWith('-'))) return;

      if (!inTable) {
        inTable = true;
        tableHeader = cols;
        tableRows = [];
      } else {
        tableRows.push(cols);
      }
      return;
    } else if (inTable) {
      elements.push(
        <div key={`tbl-${idx}`} className="my-2 border border-[#D9DDE3] rounded overflow-hidden text-[10px]">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 border-b border-[#D9DDE3]">
                {tableHeader.map((th, i) => (
                  <th key={i} className="px-2 py-1 font-bold text-slate-700 font-mono">{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((tr, rIdx) => (
                <tr key={rIdx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  {tr.map((td, cIdx) => (
                    <td key={cIdx} className="px-2 py-1 font-mono text-slate-800">{td}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
    }

    const clean = sanitize(raw);
    if (!clean) return;

    if (raw.startsWith('#')) {
      const headingText = clean.replace(/^#+\s*/, '');
      elements.push(
        <div key={idx} className="mt-3.5 mb-1.5 font-mono text-[11px] font-bold text-[#17202A] border-l-2 border-[#2457A6] pl-2 uppercase tracking-wider bg-slate-100/80 py-1.5 rounded-r">
          {headingText}
        </div>
      );
      return;
    }

    if (raw.startsWith('* ') || raw.startsWith('- ')) {
      const bulletText = clean.replace(/^[*\-]\s*/, '');
      elements.push(
        <div key={idx} className="flex items-start gap-2 my-1 pl-1 text-[11px] text-slate-800 leading-normal font-sans">
          <span className="text-[#2457A6] font-bold font-mono text-xs leading-none mt-0.5">•</span>
          <span>{bulletText}</span>
        </div>
      );
      return;
    }

    elements.push(
      <p key={idx} className="my-1.5 text-[11px] leading-relaxed text-slate-800 font-sans">
        {clean}
      </p>
    );
  });

  return <div className="space-y-1">{elements}</div>;
}

function RingDetailPage({ ringId, navigate }: { ringId: string; navigate: (p: Page, id?: string) => void }) {
  const ring = RINGS.find(r => r.id === ringId) ?? RINGS[0];
  // Always start with empty state; DO NOT auto-load any cached report
  const [currentReport, setCurrentReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    // Reset report state to empty when switching rings
    setCurrentReport('');
  }, [ring.id]);

  const handleGenerateLiveReport = async () => {
    setIsGenerating(true);
    const reportText = await fetchLiveGeminiReport(ring);
    setCurrentReport(reportText);
    localStorage.setItem(`gemini_report_${ring.id}`, reportText);
    setIsGenerating(false);
  };
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(Object.keys(EDGE_COLOR)));

  const toggleType = (t: string) =>
    setActiveTypes(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });

  const evidence = [
    { name:'Temporal Burst',    sev:'HIGH',        desc:'Transactions concentrated within 2h 07m — a 94th-percentile compression ratio.', metric:'2h 07m / 37 txns' },
    { name:'Device Reuse',      sev:'HIGH',        desc:'8 transactions share suspicious device fingerprint relationships across the ring.', metric:'8 shared devices' },
    { name:'Network Overlap',   sev:'HIGH',        desc:'5 network identities connect multiple transactions; NET-01 appears in 14 of 37 txns.', metric:'5 nets / 14 links' },
    { name:'Identity Diversity',sev:'MEDIUM-HIGH', desc:'Multiple identity signals (device, card, network, address) converge on the same subgraph.', metric:'6 signal types' },
    { name:'Amount Pattern',    sev:'HIGH',        desc:'Transaction amounts cluster in ₹39,800–₹67,200 with anomalously low variance.', metric:'σ = ₹8,340' },
    { name:'Graph Density',     sev:'HIGH',        desc:'Local transaction neighborhood density 0.124 — 3× above ring baseline of 0.041.', metric:'density 0.124' },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Breadcrumb + header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5 text-[11px]" style={{ color:'#667085' }}>
          <button onClick={() => navigate('ring-monitor')} className="hover:underline">Ring Monitor</button>
          <span>/</span>
          <span style={{ color:'#17202A' }} className="font-medium">{ring.id}</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[18px] font-bold" style={{ color:'#17202A' }}>ABUSE RING {ring.id}</h1>
              <RiskBadge level={ring.riskLevel} />
              <StatusBadge status={ring.status} />
            </div>
            <div className="flex items-center gap-5 text-[11px]" style={{ color:'#667085' }}>
              <span>Detected: <span style={{ color:'#17202A' }} className="font-medium">{ring.detected}</span></span>
              <span>Transactions: <span style={{ color:'#17202A' }} className="font-medium tabular-nums">{ring.transactions}</span></span>
              <span>Time span: <span style={{ color:'#17202A' }} className="font-medium">{ring.timeSpan}</span></span>
              <span>Exposure: <span style={{ color:'#17202A' }} className="font-medium">{fmt(ring.exposure)}</span></span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color:'#667085' }}>Risk Score</div>
            <div className="text-4xl font-bold tabular-nums leading-none" style={{ color: RISK_COLOR[ring.riskLevel] }}>{ring.riskScore.toFixed(1)}%</div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: RISK_COLOR[ring.riskLevel] }}>
              {ring.riskLevel.toUpperCase()} RISK
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Investigation Workspace */}
      <div className="grid grid-cols-3 gap-5">

        {/* LEFT 2/3 COLUMN: Evidence Vectors & AI Forensic Report */}
        <div className="col-span-2 space-y-5">

          {/* 1. WHY THIS RING WAS FLAGGED (Prominent Evidence Table) */}
          <div className="bg-white border border-[#D9DDE3] rounded-lg shadow-2xs overflow-hidden">
            <div className="bg-slate-50 border-b border-[#D9DDE3] px-4 py-2.5 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-[#17202A] uppercase tracking-wider">Why This Ring Was Flagged</span>
              <span className="text-[10px] font-mono text-slate-500">6 Graph Evidence Vectors</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D9DDE3] bg-slate-50/70 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                    <th className="py-2.5 px-3 font-semibold w-36">Flagged Signal</th>
                    <th className="py-2.5 px-3 font-semibold w-24">Severity</th>
                    <th className="py-2.5 px-3 font-semibold w-36">Stat / Metric</th>
                    <th className="py-2.5 px-3 font-semibold">Evidence Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {evidence.map((ev, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#17202A] font-mono whitespace-nowrap">{ev.name}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider font-mono inline-block"
                          style={{
                            color: ev.sev === 'HIGH' ? '#C62828' : '#B26A00',
                            background: ev.sev === 'HIGH' ? '#FEF2F2' : '#FFF7ED',
                            border: `1px solid ${ev.sev === 'HIGH' ? '#FECACA' : '#FED7AA'}`,
                          }}>{ev.sev}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-mono font-bold text-[#17202A] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                          {ev.metric}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#667085] leading-normal">{ev.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. AI INVESTIGATION ASSISTANT (Spacious Full Width Panel) */}
          <div className="bg-white border border-[#D9DDE3] rounded-lg shadow-2xs overflow-hidden">
            <div className="bg-slate-50 border-b border-[#D9DDE3] px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-[#17202A] uppercase tracking-wider">AI Forensic Investigation Report</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                  GEMINI 3.6 FLASH RAG
                </span>
              </div>
              <button
                onClick={() => navigate('graph-explorer')}
                className="text-[11px] font-mono font-bold text-[#2457A6] hover:underline cursor-pointer"
              >
                Inspect in Graph Explorer →
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-100 pb-2">
                <span className="text-slate-500">Evidence Sources Grounded:</span>
                <div className="flex gap-2">
                  {[
                    `${ring.transactions} transactions`,
                    '82 relationships',
                    '13 ring features',
                    `GraphSAGE: ${ring.riskScore.toFixed(1)}%`
                  ].map(s => (
                    <span key={s} className="px-2 py-0.5 rounded border border-[#D9DDE3] bg-slate-50 text-slate-700 font-bold">{s}</span>
                  ))}
                </div>
              </div>

              {/* Rendered Markdown Output */}
              <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg text-[12px] min-h-[220px] max-h-[480px] overflow-y-auto leading-relaxed">
                {isGenerating ? (
                  <div className="py-12 text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div className="text-xs font-bold text-blue-700 font-mono">Gemini AI synthesizing live graph evidence...</div>
                  </div>
                ) : currentReport ? (
                  <MarkdownViewer content={currentReport} />
                ) : (
                  <div className="py-10 px-4 text-center space-y-3 bg-white/60 border border-dashed border-slate-300 rounded-lg my-2">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2457A6] flex items-center justify-center mx-auto text-lg font-bold border border-blue-200">
                      🤖
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold font-mono text-[#17202A]">Google Gemini 3.6 Flash RAG Engine Ready</div>
                      <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-normal">
                        Grounded on <strong>{ring.transactions} transactions</strong>, <strong>82 topology edges</strong>, and <strong>13 risk vectors</strong>. Click below to synthesize a live forensic report.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateLiveReport}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-2 text-[11px] font-mono font-bold px-4 py-2 rounded border border-[#2457A6] bg-[#2457A6] text-white hover:bg-blue-800 transition-all shadow-xs cursor-pointer"
                    >
                      Generate Live AI Report
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                <div className="flex gap-4 text-slate-500">
                  <span>Decision Engine: <strong className="text-[#17202A]">GraphSAGE GNN</strong></span>
                  <span>AI Assistant: <strong className="text-[#17202A]">Google Gemini 3.6 Flash</strong></span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateLiveReport}
                    disabled={isGenerating}
                    className="text-[10px] font-bold px-3 py-1.5 rounded border border-[#2457A6] bg-[#2457A6] text-white hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer font-mono"
                  >
                    {isGenerating ? 'Analyzing...' : 'Generate Live AI Report'}
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([currentReport || ''], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${ring.id}_Gemini_Report.md`;
                      a.click();
                    }}
                    className="text-[10px] font-bold px-3 py-1.5 rounded border border-[#D9DDE3] bg-white text-[#2457A6] hover:bg-slate-50 cursor-pointer font-mono"
                  >
                    Download Report
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT 1/3 COLUMN: Decision, Compact Graph Preview & Model Insights */}
        <div className="space-y-5">

          {/* 1. MODEL DECISION CARD */}
          <div className="bg-white border border-[#D9DDE3] rounded-lg shadow-2xs overflow-hidden">
            <div className="bg-slate-50 border-b border-[#D9DDE3] px-4 py-2.5 font-mono text-[11px] font-bold text-[#17202A] uppercase tracking-wider flex items-center justify-between">
              <span>Model Decision</span>
              <span className="text-[10px] text-slate-500 font-normal">GraphSAGE</span>
            </div>
            <div className="p-4 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-0.5">Classification</div>
              <div className="text-xl font-bold font-mono" style={{ color: RISK_COLOR[ring.riskLevel] }}>CRITICAL</div>

              <div className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">Recommended Action</div>
              <div className="px-3 py-1.5 rounded text-[12px] font-bold tracking-wide font-mono inline-block w-full"
                style={{ background:'#FEF2F2', color:'#C62828', border:'1px solid #FECACA' }}>HARD BLOCK</div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] font-mono text-left">
                {[['Confidence', `${ring.riskScore.toFixed(1)}%`], ['Model', 'GraphSAGE Ring Net'], ['Threshold', '0.70']].map(([k,v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-bold text-[#17202A]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. COMPACT TRANSACTION RELATIONSHIP GRAPH PREVIEW */}
          <div className="bg-white border border-[#D9DDE3] rounded-lg shadow-2xs overflow-hidden">
            <div className="bg-slate-50 border-b border-[#D9DDE3] px-3.5 py-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-[#17202A] uppercase tracking-wider">Topology Preview</span>
              <button
                onClick={() => navigate('graph-explorer')}
                className="text-[10px] font-mono font-bold text-[#2457A6] hover:underline cursor-pointer"
              >
                Full Screen →
              </button>
            </div>
            <div className="p-2">
              <TransactionGraph nodes={GRAPH_NODES} edges={GRAPH_EDGES} activeTypes={activeTypes} />
            </div>
          </div>

          {/* 3. RING STRUCTURE TOPOLOGY */}
          <div className="bg-white border border-[#D9DDE3] rounded-lg shadow-2xs overflow-hidden">
            <div className="bg-slate-50 border-b border-[#D9DDE3] px-4 py-2.5 font-mono text-[11px] font-bold text-[#17202A] uppercase tracking-wider">
              Ring Structure Metrics
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 font-mono">
              {[['Nodes', ring.transactions], ['Edges', '82'], ['Avg. Degree', '4.43'], ['Density', '0.124'], ['Components', '1'], ['Signal Types', '6']].map(([k,v]) => (
                <div key={k} className="p-2 bg-slate-50/80 border border-slate-200 rounded">
                  <div className="text-[10px] text-slate-500 uppercase">{k}</div>
                  <div className="text-[14px] font-bold text-[#17202A]">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. GRAPHSAGE MODEL INSIGHTS */}
          <div className="bg-white border border-[#D9DDE3] rounded-lg shadow-2xs overflow-hidden">
            <div className="bg-slate-50 border-b border-[#D9DDE3] px-4 py-2.5 font-mono text-[11px] font-bold text-[#17202A] uppercase tracking-wider">
              GraphSAGE Model Insights
            </div>
            <div className="p-4 space-y-3 font-mono">
              <div className="space-y-1.5 text-[11px]">
                {[['Model', 'GraphSAGE Classifier'], ['Emb. Dim.', '64'], ['GNN Layers', '2'], ['Threshold', '0.70'], ['Risk Score', `${ring.riskScore.toFixed(1)}%`]].map(([k,v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-bold text-[#17202A]">{v}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Top Feature Drivers</div>
                {[['Temporal Burst', 0.91], ['Graph Density', 0.86], ['Network Overlap', 0.83], ['Amount Conc.', 0.78]].map(([name, val]) => (
                  <div key={String(name)} className="mb-2">
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-slate-600">{name}</span>
                      <span className="font-bold text-[#17202A]">{Number(val).toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                      <div className="h-full rounded-full bg-[#2457A6]" style={{ width: `${Number(val) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// ─── PAGE: TRANSACTION EXPLORER ───────────────────────────────────────────────

function TransactionExplorerPage({ navigate }: { navigate: (p: Page, id?: string) => void }) {
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState<Transaction | null>(null);

  const rows = TRANSACTIONS.filter(t =>
    !search ||
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    t.device.toLowerCase().includes(search.toLowerCase()) ||
    t.ringId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 flex gap-4 min-h-0">
      <div className={`${selected ? 'w-2/3' : 'w-full'} space-y-4 flex-shrink-0`}>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#667085]" />
          <input
            placeholder="Search by transaction ID, device, card, network, ring..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-7 pr-3 py-1.5 text-[12px] border border-[#D9DDE3] rounded bg-white w-full placeholder:text-[#667085] focus:outline-none focus:border-[#2457A6]"
            style={{ color:'#17202A' }}
          />
        </div>
        <div className="bg-white border border-[#D9DDE3] rounded overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D9DDE3]" style={{ background:'#F7F8FA' }}>
                {['Transaction ID','Amount','Timestamp','Device','Network','Ring','Risk Score','Status'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color:'#667085' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(txn => (
                <tr key={txn.id}
                  className="border-b border-[#F3F4F6] cursor-pointer transition-colors"
                  style={{ background: selected?.id === txn.id ? '#EEF4FF' : 'white' }}
                  onMouseEnter={e => { if (selected?.id !== txn.id) e.currentTarget.style.background='#FAFBFC'; }}
                  onMouseLeave={e => { if (selected?.id !== txn.id) e.currentTarget.style.background='white'; }}
                  onClick={() => setSelected(selected?.id === txn.id ? null : txn)}
                >
                  <td className="px-3 py-2.5 text-[12px] font-semibold whitespace-nowrap" style={{ color:'#2457A6' }}>{txn.id}</td>
                  <td className="px-3 py-2.5 text-[12px] tabular-nums font-medium" style={{ color:'#17202A' }}>₹{txn.amount.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-[11px] whitespace-nowrap" style={{ color:'#667085' }}>{txn.timestamp}</td>
                  <td className="px-3 py-2.5 text-[11px] font-mono" style={{ color:'#17202A' }}>{txn.device}</td>
                  <td className="px-3 py-2.5 text-[11px] font-mono" style={{ color:'#17202A' }}>{txn.network}</td>
                  <td className="px-3 py-2.5">
                    <button className="text-[12px] font-semibold hover:underline" style={{ color:'#2457A6' }}
                      onClick={e => { e.stopPropagation(); navigate('ring-detail', txn.ringId); }}>{txn.ringId}</button>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="tabular-nums font-bold text-[12px]" style={{ color: RISK_COLOR[txn.riskLevel] }}>{txn.riskScore}%</span>
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge status={txn.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-1/3 flex-shrink-0 space-y-3">
          <div className="bg-white border border-[#D9DDE3] rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color:'#667085' }}>Transaction Detail</div>
              <button onClick={() => setSelected(null)} className="hover:text-[#17202A]" style={{ color:'#667085' }}>
                <X size={14} />
              </button>
            </div>
            <div className="text-[16px] font-bold mb-3" style={{ color:'#17202A' }}>{selected.id}</div>
            <div className="space-y-2">
              {[
                ['Amount',    `₹${selected.amount.toLocaleString()}`],
                ['Timestamp', selected.timestamp],
                ['Device',    selected.device],
                ['Network',   selected.network],
                ['Ring',      selected.ringId],
                ['Risk Score',`${selected.riskScore}%`],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between text-[12px]">
                  <span style={{ color:'#667085' }}>{k}</span>
                  <span className="font-medium" style={{ color:'#17202A' }}>{v}</span>
                </div>
              ))}
              <div className="flex justify-between text-[12px]">
                <span style={{ color:'#667085' }}>Status</span>
                <StatusBadge status={selected.status} />
              </div>
              <div className="flex justify-between text-[12px]">
                <span style={{ color:'#667085' }}>Risk Level</span>
                <RiskBadge level={selected.riskLevel} />
              </div>
            </div>
            <button
              onClick={() => navigate('ring-detail', selected.ringId)}
              className="mt-4 w-full py-2 text-[12px] font-medium rounded border transition-colors hover:bg-[#EEF4FF]"
              style={{ borderColor:'#2457A6', color:'#2457A6' }}
            >
              View Ring {selected.ringId} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE: GRAPH EXPLORER ─────────────────────────────────────────────────────

function GraphExplorerPage() {
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(Object.keys(EDGE_COLOR)));
  const [selNode, setSelNode] = useState<GraphNode | null>(null);

  const toggleType = (t: string) =>
    setActiveTypes(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });

  const edgeCounts = Object.keys(EDGE_COLOR).reduce((acc, t) => {
    acc[t] = GRAPH_EDGES.filter(e => e.type === t).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6">
      <div className="flex gap-4">
        <div className="w-52 flex-shrink-0 space-y-3">
          <div className="bg-white border border-[#D9DDE3] rounded p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:'#667085' }}>Relationship Type</div>
            <div className="space-y-2">
              {Object.entries(EDGE_COLOR).map(([type, color]) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={activeTypes.has(type)} onChange={() => toggleType(type)}
                    className="rounded" style={{ accentColor: color }} />
                  <span className="text-[12px] flex-1" style={{ color:'#17202A' }}>{type}</span>
                  <span className="text-[10px] tabular-nums" style={{ color:'#667085' }}>{edgeCounts[type]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#D9DDE3] rounded p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:'#667085' }}>Graph Stats</div>
            <div className="space-y-2">
              {[['Nodes','37'],['Active Edges',`${GRAPH_EDGES.filter(e=>activeTypes.has(e.type)).length}`],['Active Types',`${activeTypes.size}`],['Ring','AR-06441']].map(([k,v]) => (
                <div key={k} className="flex justify-between text-[12px]">
                  <span style={{ color:'#667085' }}>{k}</span>
                  <span className="font-semibold tabular-nums" style={{ color:'#17202A' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {selNode && (
            <div className="bg-white border border-[#D9DDE3] rounded p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color:'#667085' }}>Selected Node</div>
              <div className="text-[13px] font-bold mb-2" style={{ color:'#17202A' }}>{selNode.id}</div>
              <div className="space-y-1.5 text-[11px]">
                {[['Ring','AR-06441'],['Amount',fmt(selNode.amount)],['Time',selNode.timestamp],['Device',selNode.device],['Network',selNode.network]].map(([k,v]) => (
                  <div key={k} className="flex justify-between">
                    <span style={{ color:'#667085' }}>{k}</span>
                    <span className="font-medium" style={{ color:'#17202A' }}>{v}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <span style={{ color:'#667085' }}>Risk</span>
                  <RiskBadge level={selNode.risk} />
                </div>
                <div className="flex justify-between">
                  <span style={{ color:'#667085' }}>Neighbors</span>
                  <span className="font-medium tabular-nums" style={{ color:'#17202A' }}>
                    {GRAPH_EDGES.filter(e => {
                      const idx = GRAPH_NODES.indexOf(selNode);
                      return e.source === idx || e.target === idx;
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 bg-white border border-[#D9DDE3] rounded p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:'#17202A' }}>Graph Workspace — AR-06441</div>
          <TransactionGraph nodes={GRAPH_NODES} edges={GRAPH_EDGES} activeTypes={activeTypes} onNodeSelect={setSelNode} />
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: ALERTS ─────────────────────────────────────────────────────────────

function AlertsPage({ navigate }: { navigate: (p: Page, id?: string) => void }) {
  const [statFilter, setStatFilter] = useState('all');
  const [sevFilter,  setSevFilter]  = useState('all');

  const rows = ALERTS.filter(a =>
    (statFilter === 'all' || a.status === statFilter) &&
    (sevFilter === 'all' || a.severity === sevFilter)
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        {[
          { val:statFilter, set:setStatFilter, opts:[['all','All Statuses'],['new','New'],['investigating','Investigating'],['escalated','Escalated'],['resolved','Resolved'],['false-positive','False Positive']] },
          { val:sevFilter,  set:setSevFilter,  opts:[['all','All Severities'],['critical','Critical'],['high','High'],['medium','Medium'],['low','Low']] },
        ].map((sel, i) => (
          <select key={i} value={sel.val} onChange={e => sel.set(e.target.value)}
            className="px-2.5 py-1.5 text-[12px] border border-[#D9DDE3] rounded bg-white focus:outline-none focus:border-[#2457A6]"
            style={{ color:'#17202A' }}>
            {sel.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <span className="ml-auto text-[11px]" style={{ color:'#667085' }}>{rows.length} alerts</span>
      </div>

      <div className="bg-white border border-[#D9DDE3] rounded overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D9DDE3]" style={{ background:'#F7F8FA' }}>
              {['Alert ID','Ring ID','Risk Score','Severity','Detected','Exposure','Status','Assigned To','Action'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color:'#667085' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(a => (
              <tr key={a.id}
                className="border-b border-[#F3F4F6] cursor-pointer transition-colors"
                style={{ background:'white' }}
                onMouseEnter={e => (e.currentTarget.style.background='#FAFBFC')}
                onMouseLeave={e => (e.currentTarget.style.background='white')}
                onClick={() => navigate('ring-detail', a.ringId)}
              >
                <td className="px-3 py-2.5 text-[12px] font-semibold" style={{ color:'#17202A' }}>{a.id}</td>
                <td className="px-3 py-2.5 text-[12px] font-semibold" style={{ color:'#2457A6' }}>{a.ringId}</td>
                <td className="px-3 py-2.5">
                  <span className="tabular-nums font-bold text-[13px]" style={{ color: RISK_COLOR[a.severity] }}>{a.riskScore.toFixed(1)}%</span>
                </td>
                <td className="px-3 py-2.5"><RiskBadge level={a.severity} /></td>
                <td className="px-3 py-2.5 text-[11px] whitespace-nowrap" style={{ color:'#667085' }}>{a.detected}</td>
                <td className="px-3 py-2.5 text-[12px] tabular-nums font-medium" style={{ color:'#17202A' }}>{fmt(a.exposure)}</td>
                <td className="px-3 py-2.5"><StatusBadge status={a.status} /></td>
                <td className="px-3 py-2.5 text-[11px]" style={{ color:'#667085' }}>{a.assignedTo}</td>
                <td className="px-3 py-2.5">
                  <button
                    className="text-[11px] font-medium px-2 py-0.5 rounded border border-[#D9DDE3] transition-colors hover:bg-[#F7F8FA]"
                    style={{ color:'#2457A6' }}
                    onClick={e => { e.stopPropagation(); navigate('ring-detail', a.ringId); }}
                  >Investigate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PAGE: MODEL INSIGHTS ─────────────────────────────────────────────────────

function ModelInsightsPage() {
  const arch = ['Transaction Nodes','GraphSAGE Layer 1','GraphSAGE Layer 2','Node Embeddings','Ring Pooling','13 Ring Features','Classification Head','Abuse Probability'];
  const metrics = [
    ['ROC-AUC', '0.7558'], ['PR-AUC', '0.1998'], ['Precision', '18.86%'],
    ['Recall', '38.77%'], ['F1 Score', '0.2538'], ['Calibration', 'Pending'],
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-[#D9DDE3] rounded p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:'#667085' }}>Model Architecture</div>
           <div className="text-[12px] font-semibold mb-4" style={{ color:'#17202A' }}>Planned GraphSAGE Ring Classifier</div>
          <div className="space-y-0">
            {arch.map((step, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-full py-2 px-3 text-center text-[11px] font-medium rounded"
                  style={{
                    background: i===0 ? '#EEF4FF' : i===arch.length-1 ? '#FEF2F2' : '#F7F8FA',
                    color: i===0 ? '#2457A6' : i===arch.length-1 ? '#C62828' : '#17202A',
                    border: `1px solid ${i===0 ? '#BFD4FF' : i===arch.length-1 ? '#FECACA' : '#D9DDE3'}`,
                  }}>{step}</div>
                {i < arch.length-1 && <div className="w-px h-2.5" style={{ background:'#D9DDE3' }} />}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          <div className="bg-white border border-[#D9DDE3] rounded p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:'#667085' }}>Model Configuration</div>
            <div className="grid grid-cols-2 gap-x-8">
              {[
                 ['Model Type','GraphSAGE (planned)'], ['Task','Ring Classification'],
                 ['Embedding Dim.','64 (planned)'],    ['GNN Layers','2 (planned)'],
                 ['Aggregation','Mean (planned)'],     ['Threshold','To validate'],
                 ['Input Features','Node + 13 ring features'], ['Dataset','IEEE-CIS labeled train files'],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between text-[12px] py-1.5 border-b border-[#F3F4F6]">
                  <span style={{ color:'#667085' }}>{k}</span>
                  <span className="font-medium" style={{ color:'#17202A' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#D9DDE3] rounded p-4">
             <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:'#667085' }}>Verified Random Forest Baseline</div>
            <div className="grid grid-cols-3 gap-3">
               {metrics.map(([name, value]) => (
                 <div key={name} className="border border-[#D9DDE3] rounded p-3">
                   <div className="text-[10px] uppercase tracking-wider" style={{ color:'#667085' }}>{name}</div>
                   <div className="text-[17px] font-bold my-0.5" style={{ color:'#17202A' }}>{value}</div>
                   <div className="text-[9px] italic" style={{ color:'#667085' }}>Chronological holdout, candidate rings</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#D9DDE3] rounded p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:'#667085' }}>Dataset Splits</div>
            <div className="grid grid-cols-3 gap-3">
               {([['Training Period','330,702'],['Validation Period','82,676'],['Test Period','177,162']] as const).map(([name, count]) => (
                 <div key={name} className="border border-[#D9DDE3] rounded p-3">
                   <div className="text-[10px] uppercase tracking-wider" style={{ color:'#667085' }}>{name}</div>
                   <div className="text-[16px] font-bold my-0.5" style={{ color:'#17202A' }}>{count}</div>
                   <div className="text-[9px] italic" style={{ color:'#667085' }}>Chronological transactions</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: SYSTEM ─────────────────────────────────────────────────────────────

function SystemPage() {
  const pipeline = [
    { name:'Fingerprinting',           desc:'Device, network, and browser signal extraction from raw transactions.' },
    { name:'Graph Construction',       desc:'Identity relationship graph assembly from transaction signals.' },
    { name:'Candidate Ring Detection', desc:'Connected components from typed identity links.' },
    { name:'GraphSAGE Classification', desc:'Planned: train and validate a GNN on candidate subgraphs.' },
    { name:'Risk Policy',              desc:'Research review thresholds; automatic actions are disabled.' },
    { name:'AI Investigation',         desc:'Planned server-side report generation from evidence records.' },
  ];
  const services = [
    { name:'API' },
    { name:'Graph Engine' },
    { name:'GNN Model' },
    { name:'Database' },
    { name:'LLM Service' },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[#D9DDE3] rounded p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:'#667085' }}>Data Pipeline</div>
          <div className="divide-y divide-[#F3F4F6]">
            {pipeline.map(({ name, desc }, i) => (
              <div key={name} className="py-3 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                  style={{ borderColor:'#2457A6', color:'#2457A6' }}>{i+1}</div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-semibold" style={{ color:'#17202A' }}>{name}</span>
                     <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ color:'#667085', background:'#F3F4F6', border:'1px solid #D9DDE3' }}>{i < 3 ? 'Offline research' : 'Planned'}</span>
                  </div>
                  <p className="text-[10px]" style={{ color:'#667085' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-[#D9DDE3] rounded p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:'#667085' }}>System Health</div>
            <div className="divide-y divide-[#F3F4F6]">
               {services.map(({ name }) => (
                <div key={name} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:'#9CA3AF' }} />
                    <span className="text-[12px] font-medium" style={{ color:'#17202A' }}>{name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ color:'#667085', background:'#F3F4F6', border:'1px solid #D9DDE3' }}>Not connected</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#D9DDE3] rounded p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:'#667085' }}>Environment</div>
            <div className="divide-y divide-[#F3F4F6]">
              {[
                 ['Environment','Research demo'],
                 ['Dataset','IEEE-CIS labeled train files'],
                 ['Verified model','Random Forest baseline'],
                 ['GNN Status','Not evaluated'],
                 ['Last Evaluation','01 Oct 2026'],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2 text-[12px]">
                  <span style={{ color:'#667085' }}>{k}</span>
                  <span className="font-medium" style={{ color:'#17202A' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const PAGE_META: Record<Page, { title: string; subtitle: string }> = {
  overview:              { title:'Overview',              subtitle:'Research results and illustrative payment-abuse activity.' },
  'ring-monitor':        { title:'Ring Monitor',          subtitle:'Candidate abuse rings detected from transaction relationships.' },
  'ring-detail':         { title:'Ring Investigation',    subtitle:'Detailed evidence and graph analysis for the selected ring.' },
  'transaction-explorer':{ title:'Transaction Explorer',  subtitle:'Search and investigate individual transactions.' },
  'graph-explorer':      { title:'Graph Explorer',        subtitle:'Interactive graph analysis workspace.' },
  alerts:                { title:'Alerts',                subtitle:'Active alerts and risk notifications.' },
  'model-insights':      { title:'Model Insights',        subtitle:'GraphSAGE Ring Classifier — technical overview.' },
  system:                { title:'System',                subtitle:'Data pipeline status and system health.' },
};

export default function App() {
  const [page, setPage]         = useState<Page>('overview');
  const [ringId, setRingId]     = useState('AR-06441');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const navigate = useCallback((p: Page, id?: string) => {
    setPage(p);
    if (id && p === 'ring-detail') setRingId(id);
  }, []);

  const { title, subtitle } = PAGE_META[page];
  const detailTitle = page === 'ring-detail' ? `Abuse Ring ${ringId}` : title;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily:"'Inter', sans-serif", background:'#F7F8FA', fontSize:14 }}
    >
      <Sidebar current={page} navigate={navigate} collapsed={sidebarCollapsed} toggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader title={detailTitle} subtitle={subtitle} />
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-[11px] text-amber-900">
          Research demo: sample ring scores and illustrative transactions. No live payment decisions or service-health telemetry.
        </div>
        <main className="flex-1 overflow-y-auto">
          {page === 'overview'              && <OverviewPage navigate={navigate} />}
          {page === 'ring-monitor'          && <RingMonitorPage navigate={navigate} />}
          {page === 'ring-detail'           && <RingDetailPage ringId={ringId} navigate={navigate} />}
          {page === 'transaction-explorer'  && <TransactionExplorerPage navigate={navigate} />}
          {page === 'graph-explorer'        && <GraphExplorerPage />}
          {page === 'alerts'                && <AlertsPage navigate={navigate} />}
          {page === 'model-insights'        && <ModelInsightsPage />}
          {page === 'system'                && <SystemPage />}
        </main>
      </div>
    </div>
  );
}
