import React from 'react';

interface RiskBadgeProps {
  status: 'critical' | 'high' | 'medium' | 'low' | 'flagged' | 'blocked' | 'approved' | 'review';
  score?: number;
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ status, score, showScore = true }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'critical':
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
      case 'flagged':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'medium':
      case 'review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'critical': return 'CRITICAL';
      case 'high': return 'HIGH RISK';
      case 'medium': return 'MEDIUM';
      case 'low': return 'LOW';
      case 'blocked': return 'HARD BLOCK';
      case 'flagged': return 'STEP-UP OTP';
      case 'approved': return 'ALLOW';
      case 'review': return 'REVIEW';
      default: return String(status).toUpperCase();
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-bold uppercase rounded border ${getBadgeStyle()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{getLabel()}</span>
      {showScore && score !== undefined && (
        <span className="opacity-80">({score.toFixed(1)}%)</span>
      )}
    </span>
  );
};
