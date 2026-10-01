import React from 'react';
import { Search, Bell, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="h-13 bg-white border-b border-[#D9DDE3] px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Current Page Title */}
      <h1 className="text-sm font-bold text-[#17202A] tracking-tight font-mono uppercase">
        {title}
      </h1>

      {/* Top Header Utilities */}
      <div className="flex items-center gap-4">
        {/* Search Field */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search ring ID, device, card, network..."
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-[#D9DDE3] rounded w-64 text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#2457A6] focus:bg-white"
          />
        </div>

        {/* Notifications Indicator */}
        <button className="relative p-1.5 text-slate-500 hover:text-[#17202A] rounded hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-red-600 absolute top-1 right-1" />
        </button>

        {/* Analyst Profile Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-[#D9DDE3]">
          <div className="w-6 h-6 rounded bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center font-mono">
            AL
          </div>
          <div className="text-xs">
            <span className="font-semibold text-[#17202A] block leading-tight">Alok Jha</span>
            <span className="text-[10px] text-slate-500 block leading-tight">Senior Fraud Analyst</span>
          </div>
        </div>

        {/* Environment Indicator Badge */}
        <div className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          LIVE
        </div>
      </div>
    </header>
  );
};
