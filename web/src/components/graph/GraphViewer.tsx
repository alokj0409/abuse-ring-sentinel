import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

interface GraphViewerProps {
  nodes: Array<{
    id: string;
    label: string;
    riskContribution: number;
    status: 'normal' | 'suspicious' | 'high_risk';
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
  }>;
  onNodeSelect?: (nodeId: string) => void;
}

export const GraphViewer: React.FC<GraphViewerProps> = ({
  nodes,
  edges,
  onNodeSelect
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements = [
      ...nodes.map((n) => ({
        data: {
          id: n.id,
          label: n.label,
          status: n.status,
          risk: n.riskContribution
        }
      })),
      ...edges.map((e, idx) => ({
        data: {
          id: `e-${idx}`,
          source: e.source,
          target: e.target,
          type: e.type
        }
      }))
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'width': 22,
            'height': 22,
            'font-size': '9px',
            'font-family': 'monospace',
            'text-valign': 'bottom',
            'text-margin-y': 4,
            'color': '#17202A',
            'background-color': '#94A3B8',
            'border-width': 1.5,
            'border-color': '#64748B'
          }
        },
        {
          selector: 'node[status = "high_risk"]',
          style: {
            'background-color': '#C62828',
            'border-color': '#880E4F',
            'width': 28,
            'height': 28,
            'color': '#C62828',
            'font-weight': 'bold'
          }
        },
        {
          selector: 'node[status = "suspicious"]',
          style: {
            'background-color': '#B26A00',
            'border-color': '#784200',
            'width': 24,
            'height': 24,
            'color': '#B26A00'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.2,
            'line-color': '#CBD5E1',
            'curve-style': 'bezier',
            'opacity': 0.7
          }
        },
        {
          selector: 'edge[type = "device"]',
          style: { 'line-color': '#2457A6', 'width': 1.5 }
        },
        {
          selector: 'edge[type = "card"]',
          style: { 'line-color': '#C62828', 'width': 1.5 }
        },
        {
          selector: 'edge[type = "network"]',
          style: { 'line-color': '#7E22CE', 'width': 1.5 }
        },
        {
          selector: 'edge[type = "address"]',
          style: { 'line-color': '#B26A00', 'width': 1.5 }
        },
        {
          selector: ':selected',
          style: {
            'border-width': 3,
            'border-color': '#17202A',
            'line-color': '#17202A',
            'opacity': 1.0
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        componentSpacing: 40,
        nodeOverlap: 10,
        idealEdgeLength: 45
      }
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      if (onNodeSelect) {
        onNodeSelect(node.id());
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [nodes, edges]);

  const handleResetView = () => {
    if (cyRef.current) {
      cyRef.current.fit();
      cyRef.current.center();
    }
  };

  return (
    <div className="relative w-full h-[450px] bg-slate-50 border border-[#D9DDE3] rounded overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* Controls & Legend overlay */}
      <div className="absolute bottom-3 right-3 bg-white/90 border border-[#D9DDE3] px-3 py-2 rounded text-[11px] font-mono space-y-1 z-10 shadow-xs">
        <div className="font-bold text-[#17202A] mb-1 text-[10px] uppercase tracking-wider">Edge Relationship Types</div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-[#2457A6]" /> Device</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-[#C62828]" /> Card</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-[#7E22CE]" /> Network</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-[#B26A00]" /> Address</span>
        </div>
      </div>

      <button
        onClick={handleResetView}
        className="absolute top-3 right-3 bg-white border border-[#D9DDE3] px-2.5 py-1 rounded text-xs font-mono font-medium hover:bg-slate-100 z-10"
      >
        Reset View
      </button>
    </div>
  );
};
