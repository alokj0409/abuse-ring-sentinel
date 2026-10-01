import React, { useState } from 'react';
import { Search, Filter, ArrowRight } from 'lucide-react';
import { transactions } from '../data/mockData';

export const TransactionExplorer: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<any | null>(null);

  const filteredTxns = transactions.filter((t) =>
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    t.device.toLowerCase().includes(search.toLowerCase()) ||
    t.network.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      {/* Page Header */}
      <div>
        <h2 className="text-base font-bold text-[#17202A] tracking-tight font-mono">Transaction Explorer</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Query individual transactions, extract identity signals, and inspect ring membership.
        </p>
      </div>

      {/* Search & Filter bar */}
      <div className="p-3 bg-white border border-[#D9DDE3] rounded flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Transaction ID, Device, Card, Network, Address, Email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-[#D9DDE3] rounded focus:outline-none focus:border-[#2457A6]"
          />
        </div>
        <button className="px-3 py-1.5 bg-slate-100 border border-[#D9DDE3] rounded text-xs font-mono font-medium hover:bg-slate-200 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          Filter
        </button>
      </div>

      {/* Main Table + Side Inspector Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left 2 Columns: Data Table */}
        <div className={`bg-white border border-[#D9DDE3] rounded overflow-hidden ${selectedTxn ? 'col-span-2' : 'col-span-3'}`}>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Timestamp</th>
                  <th>Device Fingerprint</th>
                  <th>Network / IP</th>
                  <th>Card Token</th>
                  <th>Ring ID</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.map((txn) => (
                  <tr
                    key={txn.id}
                    onClick={() => setSelectedTxn(txn)}
                    className={`hover:bg-slate-50 cursor-pointer ${selectedTxn?.id === txn.id ? 'bg-blue-50/50' : ''}`}
                  >
                    <td className="font-mono font-bold text-[#2457A6]">{txn.id}</td>
                    <td className="font-mono font-semibold">₹{txn.amount.toFixed(2)}</td>
                    <td className="font-mono text-slate-500 text-xs">{txn.timestamp.replace('T', ' ')}</td>
                    <td className="font-mono text-slate-700 text-xs truncate max-w-[150px]">{txn.device}</td>
                    <td className="font-mono text-slate-700">{txn.network}</td>
                    <td className="font-mono text-slate-600">{txn.card}</td>
                    <td className="font-mono text-slate-700">{txn.ringId || 'None'}</td>
                    <td className="font-mono font-bold">
                      <span className={txn.riskScore >= 70 ? 'text-red-700' : 'text-slate-800'}>
                        {txn.riskScore.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${
                        txn.status === 'blocked' ? 'bg-red-100 text-red-800 border-red-300' :
                        txn.status === 'flagged' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                        'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column: Selected Transaction Detail Inspector */}
        {selectedTxn && (
          <div className="bg-white border border-[#D9DDE3] rounded p-4 space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[#D9DDE3] pb-2">
              <div className="text-xs font-bold text-[#17202A] uppercase">
                Transaction Detail
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Transaction ID</span>
                <span className="font-bold text-[#2457A6]">{selectedTxn.id}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Amount & Time</span>
                <span className="font-semibold text-[#17202A]">₹{selectedTxn.amount}</span>
                <span className="text-slate-500 block text-[11px]">{selectedTxn.timestamp}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Device Fingerprint</span>
                <span className="text-slate-800 text-[11px] break-all">{selectedTxn.device}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Network / IP</span>
                <span className="text-slate-800">{selectedTxn.network}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Email Address</span>
                <span className="text-slate-800">{selectedTxn.email}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Associated Ring</span>
                <span className="font-bold text-[#2457A6]">{selectedTxn.ringId || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Risk Contribution</span>
                <span className="font-bold text-red-700">{selectedTxn.riskScore.toFixed(1)}%</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#D9DDE3]">
              <button
                onClick={() => selectedTxn.ringId && window.location.assign(`/rings/${selectedTxn.ringId}`)}
                className="w-full py-1.5 bg-[#2457A6] text-white rounded text-xs font-semibold hover:bg-blue-800 flex items-center justify-center gap-1"
              >
                Inspect Ring {selectedTxn.ringId} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
