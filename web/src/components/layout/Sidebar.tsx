import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Radio,
  FileSearch,
  Search,
  Network,
  Bell,
  Cpu,
  Server
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/rings', label: 'Ring Monitor', icon: Radio },
  { path: '/rings/AR-06441', label: 'Investigations', icon: FileSearch },
  { path: '/transactions', label: 'Transaction Explorer', icon: Search },
  { path: '/graph', label: 'Graph Explorer', icon: Network },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/model', label: 'Model Insights', icon: Cpu },
  { path: '/system', label: 'System', icon: Server },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-60 bg-[#172B4D] text-white flex flex-col justify-between h-screen fixed left-0 top-0 z-30 select-none border-r border-[#101D33]">
      <div>
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-[#243B61] flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#2457A6] flex items-center justify-center text-white shrink-0 border border-[#3B72C4]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs tracking-wider uppercase text-white font-mono leading-tight">
              ABUSE-RING
            </div>
            <div className="text-xs font-semibold text-sky-400 tracking-widest uppercase font-mono leading-tight">
              SENTINEL
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="mt-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded transition-colors ${
                    isActive
                      ? 'bg-[#2457A6] text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-[#1E3A5F] hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-slate-300" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Operational Metadata Footer */}
      <div className="p-4 border-t border-[#243B61] bg-[#11213D] text-[11px] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Model Status</span>
          <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            GNN ONLINE
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#1D3256] pt-1.5">
          <span className="text-slate-400">Dataset</span>
          <span className="text-slate-200 font-mono font-semibold">IEEE-CIS</span>
        </div>

        <div className="flex items-center justify-between border-t border-[#1D3256] pt-1.5">
          <span className="text-slate-400">Environment</span>
          <span className="text-slate-200 font-mono">Production / Demo</span>
        </div>
      </div>
    </aside>
  );
};
