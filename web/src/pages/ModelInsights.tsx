import React from 'react';
import { Cpu, CheckCircle2 } from 'lucide-react';
import { modelMetrics } from '../data/mockData';

export const ModelInsights: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-base font-bold text-[#17202A] tracking-tight font-mono">Model Insights</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Technical specifications, architecture details, and out-of-sample benchmark evaluation.
        </p>
      </div>

      {/* Model Overview Section */}
      <div className="bg-white border border-[#D9DDE3] rounded p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-[#D9DDE3] pb-2 font-mono">
          <div className="flex items-center gap-2 text-xs font-bold text-[#17202A] uppercase">
            <Cpu className="w-4 h-4 text-[#2457A6]" />
            GraphSAGE Ring Classifier (PyTorch Geometric)
          </div>
          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            VALIDATED OUT-OF-SAMPLE
          </span>
        </div>

        {/* Text-Based Architecture Flow Diagram */}
        <div className="p-4 bg-slate-900 text-slate-100 rounded font-mono text-xs space-y-2 overflow-x-auto">
          <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-2">// GraphSAGE Neural Pipeline Architecture</div>
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <span>Transaction Nodes (7-dim)</span>
            <span>→</span>
            <span>GraphSAGE Layer 1 (64-dim)</span>
            <span>→</span>
            <span>GraphSAGE Layer 2 (64-dim)</span>
          </div>
          <div className="pl-4 text-slate-400">│</div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <span>Node Embeddings</span>
            <span>→</span>
            <span>Dual Global Pooling (Mean ∥ Max = 128-dim)</span>
            <span>+</span>
            <span>13 Domain Features</span>
          </div>
          <div className="pl-4 text-slate-400">│</div>
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <span>Fused Vectors (141-dim)</span>
            <span>→</span>
            <span>3-Layer MLP Head (128 → 64 → 1)</span>
            <span>→</span>
            <span>Sigmoid Abuse Probability P(Abuse Ring)</span>
          </div>
        </div>
      </div>

      {/* Model Performance Metrics Table */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-[#D9DDE3] rounded p-4 space-y-3">
          <h3 className="text-xs font-bold font-mono text-[#17202A] uppercase">
            Out-of-Sample Performance Benchmarks (30% Test Set)
          </h3>

          <table className="font-mono text-xs">
            <thead>
              <tr>
                <th>Metric Name</th>
                <th>Measured Score</th>
                <th>Baseline Delta</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold text-slate-800">ROC-AUC Score</td>
                <td className="font-bold text-[#2457A6]">0.7830</td>
                <td className="text-emerald-700 font-bold">+0.0424 (+5.7%)</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-800">Fraud Ring Recall (@0.50)</td>
                <td className="font-bold text-[#2457A6]">63.43%</td>
                <td className="text-emerald-700 font-bold">+22.52% (+55.0%)</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-800">Precision (@0.50)</td>
                <td className="font-bold text-slate-800">18.32%</td>
                <td className="text-slate-500">+1.21%</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-800">F1-Score (@0.50)</td>
                <td className="font-bold text-slate-800">0.2650</td>
                <td className="text-emerald-700 font-bold">+0.0237</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-800">PR-AUC Score</td>
                <td className="font-bold text-slate-800">0.3412</td>
                <td className="text-slate-500">+0.0310</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-800">Model Parameters</td>
                <td className="font-bold text-slate-800">36,353</td>
                <td className="text-slate-500">Deep Neural Net</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Dataset Evaluation Periods */}
        <div className="bg-white border border-[#D9DDE3] rounded p-4 space-y-4 font-mono">
          <h3 className="text-xs font-bold text-[#17202A] uppercase">
            Dataset Chronological Split Windows
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Training Period (70% Earliest)</div>
              <div className="font-bold text-[#17202A] text-sm mt-0.5">413,378 Transactions</div>
              <div className="text-[11px] text-slate-600">TransactionDT ≤ 10,437,998 | Frequency bounds (2 ≤ N ≤ 100) learned strictly here</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Held-Out Test Period (30% Latest)</div>
              <div className="font-bold text-[#2457A6] text-sm mt-0.5">177,162 Transactions (7,301 Candidate Rings)</div>
              <div className="text-[11px] text-slate-600">TransactionDT &gt; 10,437,998 | Zero historical leakage | Evaluated chronologically</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
