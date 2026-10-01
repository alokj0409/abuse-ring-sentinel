import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  onFilterChange?: (filters: any) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange }) => {
  return (
    <div className="p-3 bg-white border border-[#D9DDE3] rounded mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Filters:</span>
        </div>

        {/* Date Range Select */}
        <select className="px-2.5 py-1 bg-slate-50 border border-[#D9DDE3] rounded text-slate-800 focus:outline-none focus:border-[#2457A6]">
          <option>Last 24 Hours</option>
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>Custom Range</option>
        </select>

        {/* Risk Level Select */}
        <select className="px-2.5 py-1 bg-slate-50 border border-[#D9DDE3] rounded text-slate-800 focus:outline-none focus:border-[#2457A6]">
          <option>All Risk Levels</option>
          <option>Critical (≥90%)</option>
          <option>High (70%-89%)</option>
          <option>Medium (40%-69%)</option>
          <option>Low (&lt;40%)</option>
        </select>

        {/* Ring Size Select */}
        <select className="px-2.5 py-1 bg-slate-50 border border-[#D9DDE3] rounded text-slate-800 focus:outline-none focus:border-[#2457A6]">
          <option>All Ring Sizes</option>
          <option>Large (&gt;20 nodes)</option>
          <option>Medium (5-20 nodes)</option>
          <option>Small (&lt;5 nodes)</option>
        </select>

        {/* Relationship Type Select */}
        <select className="px-2.5 py-1 bg-slate-50 border border-[#D9DDE3] rounded text-slate-800 focus:outline-none focus:border-[#2457A6]">
          <option>All Relationships</option>
          <option>Shared Device</option>
          <option>Shared Card</option>
          <option>Shared Network/IP</option>
          <option>Shared Address</option>
        </select>
      </div>

      <button className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium text-xs px-2 py-1 rounded hover:bg-slate-100 transition-colors">
        <RotateCcw className="w-3 h-3" />
        <span>Reset Filters</span>
      </button>
    </div>
  );
};
