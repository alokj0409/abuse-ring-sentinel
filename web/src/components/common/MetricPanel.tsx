import React from 'react';

interface MetricPanelProps {
  label: string;
  value: string | number;
  trend?: string;
  subtext?: string;
  isAlert?: boolean;
}

export const MetricPanel: React.FC<MetricPanelProps> = ({
  label,
  value,
  trend,
  subtext,
  isAlert = false
}) => {
  return (
    <div className={`p-4 bg-white border rounded shadow-xs ${isAlert ? 'border-red-300 bg-red-50/20' : 'border-[#D9DDE3]'}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold font-mono tracking-tight ${isAlert ? 'text-red-700' : 'text-[#17202A]'}`}>
        {value}
      </div>
      {(trend || subtext) && (
        <div className="mt-2 flex items-center justify-between text-xs">
          {trend && (
            <span className={`font-mono text-[11px] font-semibold ${trend.startsWith('+') ? 'text-red-600' : 'text-emerald-600'}`}>
              {trend}
            </span>
          )}
          {subtext && (
            <span className="text-slate-400 text-[11px]">{subtext}</span>
          )}
        </div>
      )}
    </div>
  );
};
