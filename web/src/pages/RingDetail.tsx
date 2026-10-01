import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldAlert, Cpu, Bot, FileText, Download, UserPlus, ArrowLeft } from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { EvidenceItemRow } from '../components/common/EvidenceItem';
import { GraphViewer } from '../components/graph/GraphViewer';
import { rings, evidenceItems, ringGraphData, investigationReport, modelMetrics } from '../data/mockData';

export const RingDetail: React.FC = () => {
  const { ringId } = useParams<{ ringId: string }>();
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const ring = rings.find((r) => r.id === ringId) || rings[0];

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Back Button & Navigation Header */}
      <div className="flex items-center justify-between border-b border-[#D9DDE3] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/rings')}
            className="p-1.5 bg-white border border-[#D9DDE3] rounded hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-[#17202A] font-mono">ABUSE RING {ring.id}</h2>
              <RiskBadge status={ring.status} score={ring.riskScore} />
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              Detected: {ring.detected} | Transactions: {ring.transactions} | Time Span: {ring.timeSpan} | Exposure: ₹{(ring.financialExposure / 100000).toFixed(2)}M
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-white border border-[#D9DDE3] rounded text-xs font-mono font-semibold text-slate-800 hover:bg-slate-50 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Evidence JSON
          </button>
          <button className="px-3 py-1.5 bg-[#C62828] text-white rounded text-xs font-mono font-bold hover:bg-red-800 transition-colors">
            EXECUTE HARD BLOCK
          </button>
        </div>
      </div>

      {/* Grid Layout: Top Row (Risk Decision Panel + Ring Structure Summary) */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Risk Decision Panel */}
        <div className="col-span-2 bg-white border border-[#D9DDE3] rounded p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#D9DDE3] pb-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#17202A] uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-[#C62828]" />
              Model Decision Engine
            </div>
            <span className="text-[11px] font-mono text-slate-500">Decision Engine: GraphSAGE</span>
          </div>

          <div className="grid grid-cols-4 gap-4 pt-1">
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase">Risk Level</div>
              <div className="text-base font-bold font-mono text-[#C62828]">CRITICAL</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase">Recommended Action</div>
              <div className="text-base font-bold font-mono text-[#C62828]">{ring.action.toUpperCase()}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase">Model Confidence</div>
              <div className="text-base font-bold font-mono text-[#17202A]">{ring.riskScore.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase">Classifier Architecture</div>
              <div className="text-xs font-mono font-semibold text-slate-700">GraphSAGE Ring Net</div>
            </div>
          </div>
        </div>

        {/* Right Column: Ring Structure Summary */}
        <div className="bg-white border border-[#D9DDE3] rounded p-4 space-y-2">
          <div className="font-mono text-xs font-bold text-[#17202A] uppercase tracking-wider border-b border-[#D9DDE3] pb-2">
            Ring Structure Summary
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Nodes:</span>
              <span className="font-bold text-[#17202A]">{ring.transactions}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Edges:</span>
              <span className="font-bold text-[#17202A]">{ring.edges}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Avg Degree:</span>
              <span className="font-bold text-[#17202A]">{ring.avgDegree}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Graph Density:</span>
              <span className="font-bold text-[#17202A]">{ring.graphDensity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Components:</span>
              <span className="font-bold text-[#17202A]">{ring.connectedComponents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Signal Types:</span>
              <span className="font-bold text-[#17202A]">{ring.relationshipTypes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Evidence Section ("Why this ring was flagged") */}
      <div className="bg-white border border-[#D9DDE3] rounded p-4 space-y-3">
        <h3 className="text-xs font-bold font-mono text-[#17202A] uppercase tracking-wider">
          Why this ring was flagged (Graph & Signal Evidence)
        </h3>

        <div className="space-y-2">
          {evidenceItems.map((item) => (
            <EvidenceItemRow key={item.name} {...item} />
          ))}
        </div>
      </div>

      {/* Interactive Transaction Relationship Graph */}
      <div className="bg-white border border-[#D9DDE3] rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold font-mono text-[#17202A] uppercase tracking-wider">
              Transaction Relationship Graph
            </h3>
            <p className="text-[11px] text-slate-500">
              Interactive typed identity graph. Nodes = Transactions, Edges = Shared Fingerprints.
            </p>
          </div>
          {selectedNode && (
            <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded border border-slate-300">
              Selected: <span className="font-bold text-[#2457A6]">{selectedNode}</span>
            </div>
          )}
        </div>

        {/* Cytoscape.js Component */}
        <GraphViewer
          nodes={ringGraphData.nodes}
          edges={ringGraphData.edges}
          onNodeSelect={handleNodeSelect}
        />
      </div>

      {/* Two Column Section: GraphSAGE Model Insights + AI Investigation Assistant */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: GraphSAGE Model Insights */}
        <div className="bg-white border border-[#D9DDE3] rounded p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#D9DDE3] pb-2 font-mono text-xs font-bold text-[#17202A] uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-[#2457A6]" />
            GraphSAGE Model Insights
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[10px] text-slate-500">Embedding Dimension</div>
              <div className="font-bold text-[#17202A]">{modelMetrics.embeddingDim}</div>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[10px] text-slate-500">GNN Message-Passing Layers</div>
              <div className="font-bold text-[#17202A]">{modelMetrics.gnnLayers}</div>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[10px] text-slate-500">Classification Threshold</div>
              <div className="font-bold text-[#17202A]">{modelMetrics.classificationThreshold}</div>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[10px] text-slate-500">Computed Risk Score</div>
              <div className="font-bold text-red-700">{ring.riskScore.toFixed(1)}%</div>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono font-bold text-slate-700 uppercase mb-2">
              Top Contributing Features
            </div>
            <div className="space-y-2">
              {[
                { name: 'Temporal Burst', score: ring.burstRatio },
                { name: 'Graph Density', score: ring.graphDensity },
                { name: 'Identity Mismatch Rate', score: ring.mismatchRate },
                { name: 'Amount Concentration', score: ring.amountConcentration },
              ].map((feat) => (
                <div key={feat.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600">{feat.name}</span>
                    <span className="font-bold text-[#17202A]">{feat.score.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#2457A6] h-full" style={{ width: `${feat.score * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: AI Investigation Assistant (Non-ChatGPT style) */}
        <div className="bg-white border border-[#D9DDE3] rounded p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#D9DDE3] pb-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#17202A] uppercase tracking-wider">
              <Bot className="w-4 h-4 text-[#2457A6]" />
              AI Investigation Assistant
            </div>
            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              Gemini 3.6 Flash + RAG
            </span>
          </div>

          <div className="text-xs font-mono text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
            <strong>Evidence Sources:</strong> {investigationReport.evidenceSources.transactions} transactions | {investigationReport.evidenceSources.relationships} relationships | {investigationReport.evidenceSources.features} ring features | GraphSAGE score: {investigationReport.evidenceSources.modelScore}
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-mono font-bold text-[#17202A] uppercase mb-1">
                Executive Assessment
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                {investigationReport.executiveAssessment}
              </p>
            </div>

            <div>
              <div className="text-[11px] font-mono font-bold text-[#17202A] uppercase mb-1">
                Key Findings
              </div>
              <ul className="space-y-1 text-xs text-slate-700">
                {investigationReport.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#2457A6] font-bold">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-2 border-t border-[#D9DDE3] flex items-center justify-between">
            <div className="text-xs font-mono">
              <span className="text-slate-500">Decision Engine:</span> <span className="font-bold text-[#17202A]">GraphSAGE</span> | <span className="text-slate-500">Assistant:</span> <span className="font-bold text-[#17202A]">LLM RAG</span>
            </div>
            <div className="flex gap-2">
              <button className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-medium hover:bg-slate-200">
                Generate Report
              </button>
              <button className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-medium hover:bg-slate-200">
                Export Evidence
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
