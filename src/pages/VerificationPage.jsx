import { useState } from 'react';
import { useI18n } from '../i18n';

const EVIDENCE_TYPES = [
  { key: 'photo', label: 'Photo', icon: '📷', desc: 'Production line / workstation photo' },
  { key: 'video', label: 'Video', icon: '🎥', desc: 'Process video clip' },
  { key: 'document', label: 'Document', icon: '📄', desc: 'Test report / work order' },
  { key: 'packaging', label: 'Packaging', icon: '📦', desc: 'Packaging / labeling photo' },
  { key: 'serial', label: 'Serial #', icon: '🔢', desc: 'Serial number proof' },
];

const DEMO_VERIFICATIONS = [
  { id: 1, order: 'PO-A1B2C3D4', supplier: 'Shenzhen Motor Co.', milestone: 'Sample Complete', status: 'pending_review', evidence: 3, risk: 'low', date: '2026-03-20' },
  { id: 2, order: 'PO-E5F6G7H8', supplier: 'Dongguan CNC Works', milestone: 'EVT', status: 'flagged', evidence: 1, risk: 'high', date: '2026-03-18' },
  { id: 3, order: 'PO-I9J0K1L2', supplier: 'Shanghai Electronics', milestone: 'Pre-Shipment', status: 'verified', evidence: 5, risk: 'low', date: '2026-03-15' },
];

export default function VerificationPage() {
  const { lang } = useI18n();
  const [tab, setTab] = useState('overview');

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? '生产验证' : 'Production Verification'}</h2>
      <p className="page-sub">{lang === 'zh' ? 'AI 照片/视频审核 + 深圳验厂员现场 + 分层验证体系' : 'AI photo/video review + Shenzhen inspector on-site + layered verification system'}</p>

      <div style={{ display: 'flex', gap: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, width: 'fit-content', marginBottom: 20 }}>
        {[{ id: 'overview', label: 'Overview' }, { id: 'evidence', label: 'Evidence Check' }, { id: 'inspector', label: 'Inspector' }].map(t =>
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 24px', border: 'none', background: tab === t.id ? 'var(--accent)' : 'none', color: tab === t.id ? '#fff' : 'var(--text2)', cursor: 'pointer', borderRadius: 10, fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</button>
        )}
      </div>

      {tab === 'overview' && (<>
        <div className="kpis">
          <div className="kpi"><div className="kpi-label">Pending Review</div><div className="kpi-value" style={{ color: 'var(--yellow)' }}>1</div></div>
          <div className="kpi"><div className="kpi-label">Flagged</div><div className="kpi-value" style={{ color: 'var(--red)' }}>1</div></div>
          <div className="kpi"><div className="kpi-label">Verified</div><div className="kpi-value" style={{ color: 'var(--green)' }}>1</div></div>
          <div className="kpi"><div className="kpi-label">Inspections Scheduled</div><div className="kpi-value" style={{ color: 'var(--accent)' }}>0</div></div>
        </div>

        <div className="panel">
          <div className="panel-title">Verification Queue</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead><tr>{['Order','Supplier','Milestone','Evidence','Risk','Status','Date',''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{DEMO_VERIFICATIONS.map(v => (
              <tr key={v.id}>
                <td className="td" style={{ fontWeight: 600 }}>{v.order}</td>
                <td className="td">{v.supplier}</td>
                <td className="td">{v.milestone}</td>
                <td className="td">{v.evidence} items</td>
                <td className="td"><span className={`badge badge-${v.risk === 'high' ? 'red' : 'green'}`}>{v.risk}</span></td>
                <td className="td"><span className={`badge badge-${v.status === 'verified' ? 'green' : v.status === 'flagged' ? 'red' : 'yellow'}`}>{v.status.replace('_', ' ')}</span></td>
                <td className="td" style={{ fontSize: '.82rem', color: 'var(--text3)' }}>{v.date}</td>
                <td className="td"><button className="btn-sm">Review</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </>)}

      {tab === 'evidence' && (<>
        <div className="panel">
          <div className="panel-title">AI Evidence Review</div>
          <p style={{ fontSize: '.85rem', color: 'var(--text2)', marginBottom: 16 }}>Upload photos/videos from supplier. AI checks for: new progress, duplicate images, timestamp consistency, visual anomalies.</p>
          <div className="grid-3">
            {EVIDENCE_TYPES.map(e => (
              <div key={e.key} className="card" style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{e.icon}</div>
                <div style={{ fontWeight: 600 }}>{e.label}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: 4 }}>{e.desc}</div>
                <button className="btn btn-secondary" style={{ marginTop: 10 }}>Upload</button>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">AI Review Checklist (per milestone)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Check','Description','Status'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {[
                { check: 'New content', desc: 'Photos not seen before (no duplicates from previous milestone)', status: 'pass' },
                { check: 'Timestamp match', desc: 'EXIF/metadata timestamp within expected window', status: 'pass' },
                { check: 'Progress visible', desc: 'Clear evidence of manufacturing progress vs previous stage', status: 'warning' },
                { check: 'Quantity match', desc: 'Visible quantity consistent with order', status: 'pending' },
                { check: 'Quality indicators', desc: 'No visible defects, scratches, misalignments', status: 'pending' },
              ].map(c => (
                <tr key={c.check}>
                  <td className="td" style={{ fontWeight: 600 }}>{c.check}</td>
                  <td className="td" style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{c.desc}</td>
                  <td className="td"><span className={`badge badge-${c.status === 'pass' ? 'green' : c.status === 'warning' ? 'yellow' : 'blue'}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>)}

      {tab === 'inspector' && (
        <div className="panel">
          <div className="panel-title">Shenzhen Inspector Network</div>
          <p style={{ fontSize: '.85rem', color: 'var(--text2)', marginBottom: 16 }}>For high-value or high-risk orders, schedule an on-site inspector at the supplier's facility.</p>

          <div className="grid-2">
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>When to dispatch inspector</div>
              {[
                'Order value > $5,000',
                'First-time supplier',
                'AI flagged inconsistent evidence',
                'Previous quality issue with this supplier',
                'Critical milestone (EVT/DVT/PVT)',
                'Customer request',
              ].map(r => <div key={r} style={{ fontSize: '.82rem', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>• {r}</div>)}
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Inspector Checklist</div>
              {[
                'Verify factory is real and operational',
                'Confirm materials are on-site',
                'Check production line status',
                'Inspect first article / samples',
                'Verify test equipment and records',
                'Photo documentation with timestamp',
                'Talk to production manager',
                'Report within 24 hours',
              ].map(r => <div key={r} style={{ fontSize: '.82rem', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>• {r}</div>)}
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button className="btn btn-primary">Schedule Inspection</button>
            <button className="btn btn-secondary">View Past Reports</button>
          </div>
        </div>
      )}
    </>
  );
}
