import React from 'react';

interface EvidenceItemProps {
  name: string;
  severity: 'high' | 'medium-high' | 'medium' | 'low';
  description: string;
  score: number;
}

export const EvidenceItemRow: React.FC<EvidenceItemProps> = ({
  name,
  severity,
  description,
  score
}) => {
  const getSeverityBadge = () => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium-high':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="py-2.5 px-3 bg-white border border-[#D9DDE3] rounded flex items-center justify-between text-xs hover:border-[#2457A6] transition-colors">
      <div className="space-y-0.5 max-w-xl">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#17202A] font-mono">{name}</span>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold uppercase rounded border ${getSeverityBadge()}`}>
            {severity.toUpperCase()}
          </span>
        </div>
        <div className="text-slate-600 text-xs">{description}</div>
      </div>
      <div className="font-mono text-xs font-bold text-[#17202A] bg-slate-100 px-2 py-1 rounded border border-slate-200">
        Score: {score.toFixed(2)}
      </div>
    </div>
  );
};
