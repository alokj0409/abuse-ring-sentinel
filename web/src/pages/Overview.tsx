import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { MetricPanel } from '../components/common/MetricPanel';
import { RiskBadge } from '../components/common/RiskBadge';
import { overviewMetrics, riskActivityData, riskDistribution, rings } from '../data/mockData';

export const Overview: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-base font-bold text-[#17202A] tracking-tight font-mono">Overview</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time view of coordinated payment abuse activity.
        </p>
      </div>

      {/* Top 4 Compact Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricPanel
          label="Active Rings"
          value={overviewMetrics.activeRings}
          trend={overviewMetrics.activeRingsDelta}
          subtext="Detected candidate clusters"
        />
        <MetricPanel
          label="High Risk Rings"
          value={overviewMetrics.highRiskRings}
          trend={overviewMetrics.highRiskDelta}
          subtext="Requires immediate action"
          isAlert={true}
        />
        <MetricPanel
          label="Transactions Analyzed"
          value={overviewMetrics.transactionsAnalyzed}
          subtext="70/30 Chronological Split"
        />
        <MetricPanel
          label="Blocked Exposure"
          value={overviewMetrics.blockedExposure}
          subtext="Protected financial volume"
        />
      </div>

      {/* Risk Activity Section (Two Columns) */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Ring Risk Activity Chart */}
        <div className="col-span-2 bg-white border border-[#D9DDE3] rounded p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-[#17202A] font-mono uppercase tracking-wider">
                Ring Risk Activity
              </h3>
              <p className="text-[11px] text-slate-500">Temporal concentration of detected candidate rings (24h)</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Interval: 2h</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDetected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2457A6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2457A6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#17202A', color: '#FFF', fontSize: 11, borderRadius: 4 }}
                />
                <Area type="monotone" dataKey="detected" stroke="#2457A6" strokeWidth={2} fillOpacity={1} fill="url(#colorDetected)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Risk Distribution Horizontal Bars */}
        <div className="bg-white border border-[#D9DDE3] rounded p-4 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[#17202A] font-mono uppercase tracking-wider">
              Risk Distribution
            </h3>
            <p className="text-[11px] text-slate-500">Candidate rings categorized by GraphSAGE score</p>
          </div>

          <div className="space-y-3 pt-2">
            {riskDistribution.map((item) => {
              const maxCount = 50;
              const pct = (item.count / maxCount) * 100;
              return (
                <div key={item.level} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-slate-700">{item.level}</span>
                    <span className="font-bold text-[#17202A]">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent High-Risk Rings Data Table */}
      <div className="bg-white border border-[#D9DDE3] rounded">
        <div className="p-4 border-b border-[#D9DDE3] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#17202A] font-mono uppercase tracking-wider">
              Recent High-Risk Candidate Rings
            </h3>
            <p className="text-[11px] text-slate-500">Top candidate rings flagged by GraphSAGE neural network</p>
          </div>
          <button
            onClick={() => navigate('/rings')}
            className="text-xs font-mono font-semibold text-[#2457A6] hover:underline"
          >
            View All Rings →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Ring ID</th>
                <th>Detected</th>
                <th>Transactions</th>
                <th>Devices</th>
                <th>Networks</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rings.slice(0, 5).map((ring) => (
                <tr key={ring.id} onClick={() => navigate(`/rings/${ring.id}`)}>
                  <td className="font-mono font-bold text-[#2457A6]">{ring.id}</td>
                  <td className="font-mono text-slate-500">{ring.detected.split(', ')[1]}</td>
                  <td className="font-mono text-slate-700">{ring.transactions}</td>
                  <td className="font-mono text-slate-700">{ring.sharedDevices}</td>
                  <td className="font-mono text-slate-700">{ring.sharedNetworks}</td>
                  <td className="font-mono font-bold">
                    <span className={ring.riskScore >= 70 ? 'text-red-700' : 'text-amber-800'}>
                      {ring.riskScore.toFixed(1)}%
                    </span>
                  </td>
                  <td>
                    <RiskBadge status={ring.status} showScore={false} />
                  </td>
                  <td className="font-mono font-semibold text-xs">
                    <button className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-slate-800 hover:bg-slate-200">
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
