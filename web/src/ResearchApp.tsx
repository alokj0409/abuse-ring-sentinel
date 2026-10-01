import { useMemo, useState } from 'react';
import { Activity, ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Download, FileText, Filter, Network, Search, ShieldAlert } from 'lucide-react';
import researchResults from './data/researchResults.json';
import './ResearchApp.css';

type Case = {
  id: string;
  riskProbability: number;
  reviewTier: string;
  ringSize: number;
  totalAmount: number;
  timeSpanSeconds: number;
  temporalBurst: number;
  mismatchRate: number;
  signalTypes: number;
  deviceCount: number;
  cardCount: number;
  networkCount: number;
  transactionIds: number[];
  sampledTransactionCount: number;
  relationships: Record<string, number>;
};

type ResultSet = {
  metadata: {
    dataset: string;
    model: string;
    linkPolicy: string;
    testCandidateRings: number;
    testPositiveRings: number;
    sampleSize: number;
    samplePolicy: string;
    testMetrics: {
      roc_auc: number;
      pr_auc: number;
      brier_score: number;
      precision: number;
      recall: number;
      f1: number;
      threshold: number;
    };
  };
  rings: Case[];
};

type ReviewState = 'Unreviewed' | 'Investigating' | 'Escalated' | 'Cleared';
type View = 'overview' | 'cases' | 'method';
const results = researchResults as ResultSet;
const fmt = (value: number, digits = 1) => value.toLocaleString('en-US', { maximumFractionDigits: digits });
const pct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;
const relationName = (key: string) => ({
  device: 'Device', card_loose: 'Loose card', card_strict: 'Strict card',
  address_card: 'Address + card', network: 'Network', email_card: 'Email + card', browser: 'Browser',
} as Record<string, string>)[key] || key;

function tierLabel(tier: string) {
  return tier === 'HIGH_PRIORITY_REVIEW' ? 'High-priority review'
    : tier === 'STEP_UP_REVIEW' ? 'Step-up review' : 'Routine review';
}

function readReviews(): Record<string, ReviewState> {
  try {
    const value = JSON.parse(localStorage.getItem('sentinel-research-reviews') || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

export default function ResearchApp() {
  const [view, setView] = useState<View>('overview');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState('all');
  const [reviews, setReviews] = useState<Record<string, ReviewState>>(readReviews);
  const [accessToken, setAccessToken] = useState('');
  const [report, setReport] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const selected = results.rings.find(ring => ring.id === selectedId) || null;
  const filtered = useMemo(() => results.rings.filter(ring =>
    ring.id.toLowerCase().includes(query.trim().toLowerCase()) && (tier === 'all' || ring.reviewTier === tier),
  ), [query, tier]);
  const top = results.rings.filter(ring => ring.reviewTier === 'HIGH_PRIORITY_REVIEW').length;

  const selectCase = (id: string) => {
    setSelectedId(id);
    setView('cases');
    setReport('');
    setReportError('');
  };

  const updateReview = (state: ReviewState) => {
    if (!selected) return;
    const next = { ...reviews, [selected.id]: state };
    setReviews(next);
    localStorage.setItem('sentinel-research-reviews', JSON.stringify(next));
  };

  const generateReport = async () => {
    if (!selected || !accessToken.trim()) {
      setReportError('Enter the analyst access token configured on the server.');
      return;
    }
    setReportBusy(true);
    setReportError('');
    setReport('');
    try {
      const response = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ ringId: selected.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Server returned ${response.status}`);
      setReport(data.report);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : 'Report generation failed.');
    } finally {
      setReportBusy(false);
    }
  };

  const downloadReport = () => {
    if (!selected || !report) return;
    const url = URL.createObjectURL(new Blob([report], { type: 'text/markdown' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selected.id}-research-report.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Network size={21} /></span><div><strong>ABUSE-RING</strong><span>SENTINEL / RESEARCH</span></div></div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav aria-label="Main navigation">
        <button className={view === 'overview' ? 'active' : ''} onClick={() => { setView('overview'); setSelectedId(null); }}><Activity size={18} /> Overview</button>
        <button className={view === 'cases' ? 'active' : ''} onClick={() => setView('cases')}><ShieldAlert size={18} /> Held-out cases <span className="nav-count">{results.rings.length}</span></button>
        <button className={view === 'method' ? 'active' : ''} onClick={() => { setView('method'); setSelectedId(null); }}><CircleHelp size={18} /> Methodology</button>
      </nav>
      <div className="sidebar-bottom"><span className="status-dot" /> Offline evaluation<br /><small>No live transaction feed</small></div>
    </aside>
    <div className="main-column">
      <header className="topbar"><div className="breadcrumb">RESEARCH CONSOLE <span>/</span> {selected ? selected.id : view.toUpperCase()}</div><span className="topbar-pill">HUMAN REVIEW ONLY</span></header>
      <main className="content">
        <div className="research-banner"><ShieldAlert size={18} /><span>These are sampled IEEE-CIS held-out results, not live payments. Scores are research estimates; no payment is blocked or approved here.</span></div>
        {view === 'overview' && <>
          <div className="page-heading"><div><div className="eyebrow">MODEL EVALUATION · 01 OCT 2026</div><h1>See the signal. Keep the judgment human.</h1><p>A reproducible graph-based research run, with measured limits kept in view.</p></div><button className="primary-button" onClick={() => setView('cases')}>Explore cases <ArrowRight size={16} /></button></div>
          <div className="metric-grid">
            <Metric label="Held-out candidate rings" value={fmt(results.metadata.testCandidateRings, 0)} note="Full evaluated population" />
            <Metric label="Positive candidate rings" value={fmt(results.metadata.testPositiveRings, 0)} note="Any-fraud proxy label" />
            <Metric label="Sample cases shown" value={fmt(results.rings.length, 0)} note={results.metadata.samplePolicy} />
            <Metric label="High-priority samples" value={String(top)} note="Review tier, not a block" />
          </div>
          <div className="two-columns">
            <section className="panel"><div className="panel-title"><div><div className="eyebrow">HELD-OUT PERFORMANCE</div><h2>Typed GraphSAGE</h2></div><span className="outline-pill">Chronological test</span></div>
              <div className="performance-grid"><Performance label="ROC-AUC" value={results.metadata.testMetrics.roc_auc} /><Performance label="PR-AUC" value={results.metadata.testMetrics.pr_auc} /><Performance label="Precision" value={results.metadata.testMetrics.precision} /><Performance label="Recall" value={results.metadata.testMetrics.recall} /></div>
              <p className="panel-footnote">These metrics apply only to eligible candidate rings. The validation-selected classification threshold is {results.metadata.testMetrics.threshold.toFixed(3)}; review tiers use separate illustrative cutoffs.</p>
            </section>
            <section className="panel"><div className="panel-title"><div><div className="eyebrow">READ THIS FIRST</div><h2>What the model cannot see</h2></div></div>
              <div className="limitation"><span>01</span><p>Only 2,497 of 6,125 fraud-labeled test transactions entered eligible candidate rings (40.8%).</p></div>
              <div className="limitation"><span>02</span><p>A positive ring means at least one fraud-labeled transaction, not proof of a coordinated abuse ring.</p></div>
              <div className="limitation"><span>03</span><p>Risk probabilities were calibrated on validation data, but action thresholds have not been approved for real-world use.</p></div>
            </section>
          </div>
          <section className="panel"><div className="panel-title"><div><div className="eyebrow">EXAMPLE CASES</div><h2>Highest-scored held-out rings</h2></div><button className="text-button" onClick={() => setView('cases')}>All samples <ArrowRight size={15} /></button></div><CaseTable cases={results.rings.slice(0, 6)} reviews={reviews} onSelect={selectCase} /></section>
        </>}
        {view === 'cases' && !selected && <>
          <div className="page-heading"><div><div className="eyebrow">TRACEABLE SAMPLES</div><h1>Held-out case explorer</h1><p>{results.rings.length} label-free examples selected by score rank from {fmt(results.metadata.testCandidateRings, 0)} candidate rings.</p></div></div>
          <div className="filter-row"><label className="search-box"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search ring ID" aria-label="Search ring ID" /></label><label className="select-box"><Filter size={16} /><select value={tier} onChange={event => setTier(event.target.value)} aria-label="Filter review tier"><option value="all">All review tiers</option><option value="HIGH_PRIORITY_REVIEW">High priority</option><option value="STEP_UP_REVIEW">Step-up</option><option value="ROUTINE_REVIEW">Routine</option></select></label><span className="result-count">{filtered.length} shown</span></div>
          <section className="panel table-panel"><CaseTable cases={filtered} reviews={reviews} onSelect={selectCase} /></section>
        </>}
        {view === 'cases' && selected && <>
          <button className="back-button" onClick={() => setSelectedId(null)}><ArrowLeft size={16} /> Back to all cases</button>
          <div className="case-heading"><div><div className="eyebrow">HELD-OUT CASE · {selected.id}</div><h1>{selected.id}</h1><p>{tierLabel(selected.reviewTier)} · {selected.ringSize} linked transactions · IEEE-CIS relative time</p></div><div className="score-block"><small>CALIBRATED RISK ESTIMATE</small><strong>{pct(selected.riskProbability)}</strong><span>Not an enforcement decision</span></div></div>
          <div className="metric-grid case-metrics"><Metric label="Transactions" value={fmt(selected.ringSize, 0)} note="Within candidate component" /><Metric label="Total amount" value={fmt(selected.totalAmount, 2)} note="Dataset units; not INR" /><Metric label="Time span" value={`${fmt(selected.timeSpanSeconds / 3600)} h`} note="Relative transaction time" /><Metric label="Signal types" value={String(selected.signalTypes)} note="Observed identity types" /></div>
          <div className="two-columns detail-columns"><div className="stack">
            <section className="panel"><div className="panel-title"><div><div className="eyebrow">OBSERVED GRAPH EVIDENCE</div><h2>Shared relationship pairs</h2></div></div><div className="relation-list">{Object.entries(selected.relationships).map(([name, count]) => <div key={name}><span>{relationName(name)}</span><strong>{fmt(count, 0)}</strong></div>)}</div><p className="panel-footnote">Pair counts may overlap across relationship types. They are descriptive evidence, not explanations of the model score.</p></section>
            <section className="panel"><div className="panel-title"><div><div className="eyebrow">FEATURE SNAPSHOT</div><h2>Ring-level measurements</h2></div></div><div className="feature-list"><div><span>Temporal burst ratio</span><strong>{pct(selected.temporalBurst)}</strong></div><div><span>Identity mismatch rate</span><strong>{pct(selected.mismatchRate)}</strong></div><div><span>Distinct devices</span><strong>{fmt(selected.deviceCount, 0)}</strong></div><div><span>Distinct strict cards</span><strong>{fmt(selected.cardCount, 0)}</strong></div><div><span>Distinct networks</span><strong>{fmt(selected.networkCount, 0)}</strong></div></div></section>
            <section className="panel"><div className="panel-title"><div><div className="eyebrow">REFERENCES</div><h2>Transaction IDs</h2></div></div><p className="muted">The first {selected.sampledTransactionCount} of {selected.ringSize} member IDs are shown. No raw identity fingerprints are published.</p><div className="id-list">{selected.transactionIds.map(id => <code key={id}>{id}</code>)}</div></section>
          </div><div className="stack">
            <section className="panel"><div className="panel-title"><div><div className="eyebrow">VERIFIER WORKFLOW</div><h2>Record a review state</h2></div></div><p className="muted">This state stays in this browser only. It is not sent to a server or shared with another analyst.</p><label className="field-label" htmlFor="review-state">Case disposition</label><select id="review-state" className="field" value={reviews[selected.id] || 'Unreviewed'} onChange={event => updateReview(event.target.value as ReviewState)}><option>Unreviewed</option><option>Investigating</option><option>Escalated</option><option>Cleared</option></select><p className="inline-note"><CheckCircle2 size={15} /> Human review is required before any operational action.</p></section>
            <section className="panel"><div className="panel-title"><div><div className="eyebrow">OPTIONAL AI ASSISTANT</div><h2>Evidence-grounded report</h2></div><FileText size={20} /></div><p className="muted">Requires the server-side Gemini key and analyst token. The provider receives this selected, label-free evidence only. Verify every statement before use.</p><label className="field-label" htmlFor="access-token">Analyst access token</label><input id="access-token" className="field" type="password" value={accessToken} onChange={event => setAccessToken(event.target.value)} autoComplete="off" placeholder="Configured on the server" /><button className="primary-button report-button" disabled={reportBusy} onClick={generateReport}>{reportBusy ? 'Generating…' : 'Generate report'} <ArrowRight size={15} /></button>{reportError && <p role="alert" className="error-message">{reportError}</p>}{report && <><div className="report-output">{report}</div><button className="text-button" onClick={downloadReport}><Download size={15} /> Download Markdown</button></>}</section>
          </div></div>
        </>}
        {view === 'method' && <><div className="page-heading"><div><div className="eyebrow">HOW THIS RESEARCH RUN WORKS</div><h1>Methodology and boundaries</h1><p>The safeguards matter as much as the score.</p></div></div><div className="method-grid"><section className="panel"><div className="eyebrow">01 / DATA</div><h2>Chronological, not random</h2><p>IEEE-CIS labeled training transactions are split 56% / 14% / 30% by transaction time. No synthetic transactions are included in classifier training or evaluation.</p></section><section className="panel"><div className="eyebrow">02 / GRAPH</div><h2>Conservative membership</h2><p>Device, strict-card, and address-plus-card links form candidate components. All seven relationship types are retained within a ring. Fingerprint values are learned from the training period only.</p></section><section className="panel"><div className="eyebrow">03 / MODEL</div><h2>Validation before test</h2><p>Two-layer typed GraphSAGE uses seven node features and 13 ring features. The epoch, calibration, and classification threshold are selected using validation data; the test period remains held out.</p></section><section className="panel"><div className="eyebrow">04 / LIMITS</div><h2>Prototype, not payment control</h2><p>Labels mean “contains any fraud-labeled transaction.” Ring recall does not measure end-to-end fraud capture. This dashboard has no live scoring, case database, payment enforcement, or shared analyst workflow.</p></section></div><section className="panel method-footer"><h2>Reproduce and inspect</h2><p>Run the versioned Python commands in the repository README. The exact split, counts, decisions, and model comparison are recorded in the project reports. Generated model artifacts and raw data are intentionally excluded from Git.</p></section></>}
      </main>
    </div>
  </div>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="metric-card"><div className="metric-label">{label}</div><strong>{value}</strong><small>{note}</small></div>;
}

function Performance({ label, value }: { label: string; value: number }) {
  return <div className="performance"><span>{label}</span><strong>{value.toFixed(3)}</strong><div className="performance-bar"><i style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} /></div></div>;
}

function CaseTable({ cases, reviews, onSelect }: { cases: Case[]; reviews: Record<string, ReviewState>; onSelect: (id: string) => void }) {
  return <div className="table-scroll"><table className="case-table"><thead><tr><th>Ring ID</th><th>Risk estimate</th><th>Review tier</th><th>Transactions</th><th>Signal types</th><th>Local review</th><th></th></tr></thead><tbody>{cases.map(ring => <tr key={ring.id} onClick={() => onSelect(ring.id)}><td><strong>{ring.id}</strong></td><td><span className="risk-value">{pct(ring.riskProbability)}</span></td><td><span className={`tier tier-${ring.reviewTier.toLowerCase()}`}>{tierLabel(ring.reviewTier)}</span></td><td>{ring.ringSize}</td><td>{ring.signalTypes}</td><td>{reviews[ring.id] || 'Unreviewed'}</td><td><ArrowRight size={16} /></td></tr>)}</tbody></table>{cases.length === 0 && <div className="empty-state">No cases match this filter.</div>}</div>;
}
