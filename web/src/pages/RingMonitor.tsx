import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilterBar } from '../components/common/FilterBar';
import { RiskBadge } from '../components/common/RiskBadge';
import { rings } from '../data/mockData';

export const RingMonitor: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRings = rings.filter((r) =>
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#17202A] tracking-tight font-mono">Ring Monitor</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Candidate abuse rings detected from transaction relationships.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500 bg-white border border-[#D9DDE3] px-3 py-1.5 rounded">
          Total Candidate Rings: <span className="font-bold text-[#17202A]">{rings.length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* Search Input */}
      <div className="bg-white p-3 border border-[#D9DDE3] rounded flex items-center justify-between">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search ring ID, device, card, network..."
          className="w-full text-xs bg-slate-50 border border-[#D9DDE3] rounded px-3 py-1.5 focus:outline-none focus:border-[#2457A6]"
        />
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#D9DDE3] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Ring ID</th>
                <th>Risk Score</th>
                <th>Transactions</th>
                <th>Time Span</th>
                <th>Shared Devices</th>
                <th>Shared Networks</th>
                <th>Signal Diversity</th>
                <th>Financial Exposure</th>
                <th>Detected</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRings.map((ring) => (
                <tr
                  key={ring.id}
                  onClick={() => navigate(`/rings/${ring.id}`)}
                  className="hover:bg-slate-50 cursor-pointer"
                >
                  <td className="font-mono font-bold text-[#2457A6]">{ring.id}</td>
                  <td className="font-mono font-bold">
                    <span className={ring.riskScore >= 70 ? 'text-red-700' : ring.riskScore >= 40 ? 'text-amber-800' : 'text-emerald-800'}>
                      {ring.riskScore.toFixed(1)}%
                    </span>
                  </td>
                  <td className="font-mono text-slate-700">{ring.transactions}</td>
                  <td className="font-mono text-slate-600">{ring.timeSpan}</td>
                  <td className="font-mono text-slate-700">{ring.sharedDevices}</td>
                  <td className="font-mono text-slate-700">{ring.sharedNetworks}</td>
                  <td className="font-mono text-slate-700">{ring.signalDiversity} signals</td>
                  <td className="font-mono font-semibold text-[#17202A]">
                    ₹{(ring.financialExposure / 100000).toFixed(2)}L
                  </td>
                  <td className="font-mono text-slate-500 text-xs">{ring.detected}</td>
                  <td>
                    <RiskBadge status={ring.status} showScore={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-slate-50 border-t border-[#D9DDE3] flex items-center justify-between text-xs text-slate-500 font-mono">
          <div>Showing 1-{filteredRings.length} of {filteredRings.length} rings</div>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 bg-white border border-[#D9DDE3] rounded disabled:opacity-50" disabled>Previous</button>
            <button className="px-2 py-1 bg-white border border-[#D9DDE3] rounded disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
