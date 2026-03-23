import { useState, useEffect } from 'react';
import * as api from '../api';

const fmt = (n) => n == null ? '—' : typeof n === 'number' ? n.toLocaleString() : n;
const pct = (n) => n == null ? '—' : `${(n * 100).toFixed(1)}%`;

const RISK_BADGE = { low: 'badge-green', medium: 'badge-yellow', high: 'badge-red', critical: 'badge-red' };
const CHECK_BADGE = { quality_inspection: 'badge-blue', financial_review: 'badge-purple', compliance_audit: 'badge-yellow', sanctions_screening: 'badge-red' };
const CERT_STATUS_BADGE = { active: 'badge-green', expiring_soon: 'badge-yellow', expired: 'badge-red', pending: 'badge-blue' };

function creditColor(score) {
  if (score >= 70) return 'var(--green)';
  if (score >= 40) return 'var(--yellow)';
  return 'var(--red)';
}

export default function CompliancePage() {
  const [dash, setDash] = useState({});
  const [credits, setCredits] = useState([]);
  const [checks, setChecks] = useState([]);
  const [certs, setCerts] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [view, setView] = useState('credit');

  useEffect(() => {
    api.fetchComplianceDash().then(d => setDash(d)).catch(() => {});
    api.fetchSupplierCredits().then(d => setCredits(d.suppliers || [])).catch(() => {});
    api.fetchComplianceChecks().then(d => setChecks(d.checks || [])).catch(() => {});
    api.fetchCertifications().then(d => setCerts(d.certifications || [])).catch(() => {});
    api.fetchExpiringCerts(30).then(d => setExpiring(d.certifications || [])).catch(() => {});
  }, []);

  const kpis = [
    { label: 'Suppliers Assessed', value: fmt(dash.total_suppliers_assessed) },
    { label: 'Avg Credit Score', value: fmt(dash.avg_credit_score), color: creditColor(dash.avg_credit_score || 0) },
    { label: 'High Risk', value: fmt(dash.high_risk_count), color: dash.high_risk_count > 0 ? 'var(--red)' : 'var(--green)' },
    { label: 'Pending Checks', value: fmt(dash.pending_checks), color: dash.pending_checks > 0 ? 'var(--yellow)' : undefined },
    { label: 'Expiring Certs (30d)', value: fmt(dash.expiring_certs_30d), color: dash.expiring_certs_30d > 0 ? 'var(--yellow)' : 'var(--green)' },
    { label: 'Compliance Pass Rate', value: pct(dash.compliance_pass_rate), color: (dash.compliance_pass_rate || 0) >= 0.9 ? 'var(--green)' : 'var(--yellow)' },
  ];

  return (
    <>
      <h2 className="page-title">Risk & Compliance</h2>
      <p className="page-sub">Supplier credit scoring, compliance checks, and certification tracking</p>

      <div className="kpis">
        {kpis.map(k => (
          <div className="kpi" key={k.label}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={k.color ? { color: k.color } : undefined}>{k.value}</div>
          </div>
        ))}
      </div>

      {expiring.length > 0 && (
        <div className="panel" style={{ borderLeft: '4px solid var(--yellow)' }}>
          <div className="panel-title" style={{ color: 'var(--yellow)' }}>Expiring Certifications (next 30 days)</div>
          {expiring.map(c => (
            <div key={c.id} className="card" style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>{c.supplier_name}</strong> — {c.cert_type} · #{c.cert_number} · Expires: {c.expiry_date?.slice(0, 10)}</div>
              <span className="badge badge-yellow">Expiring Soon</span>
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-sm" style={view === 'credit' ? { background: 'var(--accent)', color: '#fff' } : {}} onClick={() => setView('credit')}>💳 Credit</button>
            <button className="btn-sm" style={view === 'checks' ? { background: 'var(--accent)', color: '#fff' } : {}} onClick={() => setView('checks')}>✅ Checks</button>
            <button className="btn-sm" style={view === 'certs' ? { background: 'var(--accent)', color: '#fff' } : {}} onClick={() => setView('certs')}>📜 Certs</button>
          </div>
        </div>

        {view === 'credit' && (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Supplier', 'Credit Score', 'Financial Health', 'Risk Level', 'Delivery', 'Quality', 'Last Assessed'].map(h => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {credits.map(s => (
                  <tr key={s.supplier_name || s.id}>
                    <td className="td" style={{ fontWeight: 600 }}>{s.supplier_name}</td>
                    <td className="td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: creditColor(s.credit_score), minWidth: 28 }}>{s.credit_score}</span>
                        <div className="progress" style={{ flex: 1, maxWidth: 100 }}>
                          <div className="progress-fill" style={{ width: `${s.credit_score}%`, background: creditColor(s.credit_score) }} />
                        </div>
                      </div>
                    </td>
                    <td className="td">{s.financial_health || '—'}</td>
                    <td className="td"><span className={`badge ${RISK_BADGE[s.risk_level] || 'badge-blue'}`}>{s.risk_level}</span></td>
                    <td className="td">{s.delivery_score != null ? `${s.delivery_score}%` : '—'}</td>
                    <td className="td">{s.quality_score != null ? `${s.quality_score}%` : '—'}</td>
                    <td className="td" style={{ fontSize: '.82rem' }}>{s.last_assessed?.slice(0, 10) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!credits.length && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No supplier credit data</div>}
          </>
        )}

        {view === 'checks' && (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Order', 'Supplier', 'Check Type', 'Status', 'Details', 'Date'].map(h => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {checks.map(c => (
                  <tr key={c.id}>
                    <td className="td" style={{ fontWeight: 600 }}>{c.order_id || c.po_number || '—'}</td>
                    <td className="td">{c.supplier_name || '—'}</td>
                    <td className="td"><span className={`badge ${CHECK_BADGE[c.check_type] || 'badge-blue'}`}>{c.check_type?.replace(/_/g, ' ')}</span></td>
                    <td className="td"><span className={`badge ${c.status === 'passed' ? 'badge-green' : c.status === 'failed' ? 'badge-red' : 'badge-yellow'}`}>{c.status}</span></td>
                    <td className="td" style={{ fontSize: '.82rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.details || '—'}</td>
                    <td className="td" style={{ fontSize: '.82rem' }}>{c.check_date?.slice(0, 10) || c.created_at?.slice(0, 10) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!checks.length && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No compliance checks found</div>}
          </>
        )}

        {view === 'certs' && (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Supplier', 'Cert Type', 'Cert #', 'Issued', 'Expiry', 'Status'].map(h => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {certs.map(c => (
                  <tr key={c.id}>
                    <td className="td" style={{ fontWeight: 600 }}>{c.supplier_name || '—'}</td>
                    <td className="td"><span className="badge badge-blue">{c.cert_type}</span></td>
                    <td className="td" style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>{c.cert_number || '—'}</td>
                    <td className="td" style={{ fontSize: '.82rem' }}>{c.issue_date?.slice(0, 10) || '—'}</td>
                    <td className="td" style={{ fontSize: '.82rem' }}>{c.expiry_date?.slice(0, 10) || '—'}</td>
                    <td className="td"><span className={`badge ${CERT_STATUS_BADGE[c.status] || 'badge-blue'}`}>{c.status?.replace(/_/g, ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!certs.length && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No certifications found</div>}
          </>
        )}
      </div>
    </>
  );
}
