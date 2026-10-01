import React, { useState } from 'react';
import { GraphViewer } from '../components/graph/GraphViewer';
import { ringGraphData } from '../data/mockData';

export const GraphExplorer: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('txn-3677800');

  const selectedNode = ringGraphData.nodes.find((n) => n.id === selectedNodeId) || ringGraphData.nodes[0];

  return (
    <div className="p-6 space-y-4">
      {/* Page Header */}
      <div>
        <h2 className="text-base font-bold text-[#17202A] tracking-tight font-mono">Graph Explorer</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Dedicated full-screen graph analysis workspace for inspecting identity topology.
        </p>
      </div>

      {/* Graph Control Bar */}
      <div className="p-3 bg-white border border-[#D9DDE3] rounded flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-700">Filter Controls:</span>

          <select className="px-2 py-1 bg-slate-50 border border-[#D9DDE3] rounded text-slate-800">
            <option>All Relationship Types</option>
            <option>Device Only</option>
            <option>Card Only</option>
            <option>Network Only</option>
            <option>Address Only</option>
          </select>

          <select className="px-2 py-1 bg-slate-50 border border-[#D9DDE3] rounded text-slate-800">
            <option>Min Connections: ≥ 2</option>
            <option>Min Connections: ≥ 5</option>
            <option>Min Connections: ≥ 10</option>
          </select>

          <select className="px-2 py-1 bg-slate-50 border border-[#D9DDE3] rounded text-slate-800">
            <option>Risk Threshold: All</option>
            <option>High Risk Only (≥70%)</option>
            <option>Critical Only (≥90%)</option>
          </select>
        </div>

        <div className="text-slate-500">
          Showing <span className="font-bold text-[#17202A]">37 nodes</span>, <span className="font-bold text-[#17202A]">82 edges</span>
        </div>
      </div>

      {/* Main Graph Area + Selected Node Panel */}
      <div className="grid grid-cols-4 gap-6">
        {/* Left 3 Columns: Graph Viewer */}
        <div className="col-span-3 bg-white border border-[#D9DDE3] rounded p-4">
          <GraphViewer
            nodes={ringGraphData.nodes}
            edges={ringGraphData.edges}
            onNodeSelect={(nodeId) => setSelectedNodeId(nodeId)}
          />
        </div>

        {/* Right 1 Column: Selected Node Panel */}
        <div className="bg-white border border-[#D9DDE3] rounded p-4 space-y-4 font-mono">
          <div className="border-b border-[#D9DDE3] pb-2 text-xs font-bold text-[#17202A] uppercase">
            Selected Node Details
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Transaction ID</span>
              <span className="font-bold text-[#2457A6]">{selectedNode.id}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Ring Membership</span>
              <span className="font-bold text-[#17202A]">AR-06441</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Node Status</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border inline-block mt-0.5 ${
                selectedNode.status === 'high_risk' ? 'bg-red-100 text-red-800 border-red-300' :
                selectedNode.status === 'suspicious' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                {selectedNode.status.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Risk Contribution</span>
              <span className="font-bold text-red-700">{(selectedNode.riskContribution * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Device</span>
              <span className="text-slate-800 text-[11px]">{selectedNode.device}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Network / IP</span>
              <span className="text-slate-800">{selectedNode.network}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Amount</span>
              <span className="font-semibold text-[#17202A]">₹{selectedNode.amount}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D9DDE3]">
            <div className="text-[10px] text-slate-500 uppercase mb-1">Direct Neighbors</div>
            <div className="text-xs text-slate-700 font-bold">12 Connected Transactions</div>
          </div>
        </div>
      </div>
    </div>
  );
};
