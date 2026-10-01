import React from 'react';
import { Server, CheckCircle, Database, Cpu, Bot, Network, ShieldCheck } from 'lucide-react';

export const System: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-base font-bold text-[#17202A] tracking-tight font-mono">System Health & Pipeline</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Operational infrastructure status and data processing pipeline tracking.
        </p>
      </div>

      {/* Pipeline Flow Diagram */}
      <div className="bg-white border border-[#D9DDE3] rounded p-4 space-y-4 font-mono">
        <h3 className="text-xs font-bold text-[#17202A] uppercase">
          End-to-End Execution Pipeline
        </h3>

        <div className="grid grid-cols-6 gap-2 text-center text-xs">
          {[
            { step: '1', title: 'Fingerprinting', desc: '7 Composite Links' },
            { step: '2', title: 'Graph Build', desc: 'NetworkX Typed Graph' },
            { step: '3', title: 'Ring Detection', desc: 'Max 500 Nodes Cap' },
            { step: '4', title: 'GraphSAGE GNN', desc: '36.3K Parameters' },
            { step: '5', title: 'Risk Policy', desc: '3 Proportional Tiers' },
            { step: '6', title: 'AI Investigator', desc: 'Gemini 3.6 Flash RAG' },
          ].map((item) => (
            <div key={item.step} className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
              <div className="w-5 h-5 rounded-full bg-[#2457A6] text-white text-[10px] font-bold flex items-center justify-center mx-auto">
                {item.step}
              </div>
              <div className="font-bold text-[#17202A] text-xs">{item.title}</div>
              <div className="text-[10px] text-slate-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational System Health Checks */}
      <div className="bg-white border border-[#D9DDE3] rounded p-4 space-y-4 font-mono">
        <h3 className="text-xs font-bold text-[#17202A] uppercase">
          Service Health Monitors
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'REST API Service', icon: Server, status: 'Online', latency: '12ms' },
            { name: 'Graph Construction Engine', icon: Network, status: 'Online', latency: '45ms' },
            { name: 'GraphSAGE GNN Model Inference', icon: Cpu, status: 'Online', latency: '28ms' },
            { name: 'Transaction Database', icon: Database, status: 'Online', latency: '4ms' },
            { name: 'Google Gemini LLM RAG Service', icon: Bot, status: 'Online', latency: '120ms' },
            { name: 'Razorpay Action Policy Engine', icon: ShieldCheck, status: 'Online', latency: '2ms' },
          ].map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.name} className="p-3 bg-white border border-[#D9DDE3] rounded flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded text-slate-700">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#17202A]">{service.name}</div>
                    <div className="text-[10px] text-slate-500">Latency: {service.latency}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-300">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  {service.status}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
