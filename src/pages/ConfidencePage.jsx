import { useState, useEffect } from 'react';
import * as api from '../api';

const TASK_TIERS = [
  { task: 'search_suppliers', label: 'Search Suppliers', defaultConf: 0.95, icon: '🔍' },
  { task: 'send_initial_inquiry', label: 'Send Initial Inquiry', defaultConf: 0.90, icon: '📨' },
  { task: 'compare_quotes', label: 'Compare Quotes', defaultConf: 0.88, icon: '📊' },
  { task: 'auto_follow_up', label: 'Auto Follow-up (3d no reply)', defaultConf: 0.85, icon: '⏰' },
  { task: 'negotiate_price', label: 'Negotiate / Push Price', defaultConf: 0.70, icon: '💬' },
  { task: 'accept_quote', label: 'Accept Quote', defaultConf: 0.60, icon: '✅' },
  { task: 'create_po', label: 'Create Purchase Order', defaultConf: 0.50, icon: '📝' },
  { task: 'approve_payment', label: 'Approve Payment', defaultConf: 0.35, icon: '💳' },
  { task: 'release_milestone', label: 'Release Milestone Payment', defaultConf: 0.30, icon: '🏦' },
];

function confColor(c) { return c >= 0.85 ? 'var(--green)' : c >= 0.6 ? 'var(--yellow)' : 'var(--red)'; }
function confLabel(c) { return c >= 0.85 ? 'AUTO' : c >= 0.6 ? 'SEMI-AUTO' : 'MANUAL'; }
function confBadge(c) { const cl = c >= 0.85 ? 'green' : c >= 0.6 ? 'yellow' : 'red'; return <span className={`badge badge-${cl}`}>{confLabel(c)}</span>; }

export default function ConfidencePage() {
  const [data, setData] = useState(null);
  const [tiers, setTiers] = useState(TASK_TIERS.map(t => ({ ...t, confidence: t.defaultConf })));

  useEffect(() => { api.fetchConfidence().then(setData).catch(() => {}); }, []);

  return (
    <>
      <h2 className="page-title">Confidence System</h2>
      <p className="page-sub">Controls which tasks AI executes autonomously vs. which require your approval</p>

      <div className="panel">
        <div className="panel-header"><span className="panel-title">Task Automation Tiers</span></div>
        <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: 16 }}>
          <span className="badge badge-green">AUTO</span> {'>'}0.85 — AI executes without asking{' '}
          <span className="badge badge-yellow" style={{ marginLeft: 12 }}>SEMI-AUTO</span> 0.6–0.85 — AI drafts, you approve{' '}
          <span className="badge badge-red" style={{ marginLeft: 12 }}>MANUAL</span> {'<'}0.6 — Must be done by you
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['','Task','Confidence','Mode','Threshold'].map(h => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {tiers.map((t, i) => (
              <tr key={t.task}>
                <td className="td" style={{ fontSize: '1.2rem', width: 36 }}>{t.icon}</td>
                <td className="td" style={{ fontWeight: 600 }}>{t.label}</td>
                <td className="td">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="range" min="0" max="100" value={Math.round(t.confidence * 100)}
                      onChange={e => { const v = Number(e.target.value) / 100; setTiers(prev => prev.map((p, j) => j === i ? { ...p, confidence: v } : p)); }}
                      style={{ width: 120, accentColor: confColor(t.confidence) }} />
                    <span style={{ fontWeight: 700, color: confColor(t.confidence), minWidth: 42 }}>{(t.confidence * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td className="td">{confBadge(t.confidence)}</td>
                <td className="td" style={{ fontSize: '.82rem', color: 'var(--text3)' }}>
                  {t.confidence >= 0.85 ? 'Executes automatically' : t.confidence >= 0.6 ? 'Drafts for approval' : 'Requires manual action'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="panel-title">Today's AI Activity</div>
        <div className="kpis" style={{ marginTop: 12 }}>
          <div className="kpi"><div className="kpi-label">Auto-executed</div><div className="kpi-value" style={{ color: 'var(--green)' }}>—</div></div>
          <div className="kpi"><div className="kpi-label">Awaiting Approval</div><div className="kpi-value" style={{ color: 'var(--yellow)' }}>—</div></div>
          <div className="kpi"><div className="kpi-label">Requires Manual</div><div className="kpi-value" style={{ color: 'var(--red)' }}>—</div></div>
        </div>
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: '.85rem' }}>
          Activity feed will populate as AI agents execute tasks
        </div>
      </div>

      {data?.config && <div className="panel"><div className="panel-title">Backend Config</div><pre style={{ fontSize: '.78rem', color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre></div>}
    </>
  );
}
