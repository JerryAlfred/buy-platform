import { useState, useEffect } from 'react';
import * as api from '../api';

function StarBar({ score, max = 5 }) {
  return <div className="stars">{Array.from({ length: max }, (_, i) => <span key={i} className={`star ${i < Math.round(score) ? 'on' : 'off'}`}>★</span>)}</div>;
}

export default function TrustScorePage() {
  const [suppliers, setSuppliers] = useState([]);
  const [reliability, setReliability] = useState([]);
  useEffect(() => {
    api.fetchSuppliers({ limit: 100 }).then(d => setSuppliers(d.suppliers || [])).catch(() => {});
    api.fetchReliability().then(d => setReliability(d.reliability || [])).catch(() => {});
  }, []);

  const enriched = suppliers.map(s => {
    const r = reliability.find(x => x.supplier_id === s.id) || {};
    const trustScore = (
      (s.quality_score || 0) * 0.3 +
      (s.price_score || 0) * 0.15 +
      (s.response_speed_score || 0) * 0.15 +
      (r.on_time_rate || 0) * 5 * 0.25 +
      (r.quality_pass_rate || 0) * 5 * 0.15
    );
    return { ...s, ...r, trustScore: Math.min(5, trustScore) };
  }).sort((a, b) => b.trustScore - a.trustScore);

  const tierColor = (s) => s >= 4 ? 'var(--green)' : s >= 3 ? 'var(--yellow)' : s >= 2 ? 'var(--orange)' : 'var(--red)';
  const tierLabel = (s) => s >= 4 ? 'TRUSTED' : s >= 3 ? 'STANDARD' : s >= 2 ? 'CAUTION' : 'NEW/UNVERIFIED';

  return (
    <>
      <h2 className="page-title">Supplier Trust Scores</h2>
      <p className="page-sub">Composite scoring: fulfillment history, quality, communication, on-time rate, verification status</p>

      <div className="panel">
        <div className="panel-header"><span className="panel-title">Trust Tiers</span></div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          {[
            { label: 'TRUSTED', min: 4, color: 'var(--green)', desc: 'Proven track record, auto-approve eligible' },
            { label: 'STANDARD', min: 3, color: 'var(--yellow)', desc: 'Generally reliable, normal oversight' },
            { label: 'CAUTION', min: 2, color: 'var(--orange)', desc: 'Issues flagged, extra verification needed' },
            { label: 'NEW', min: 0, color: 'var(--red)', desc: 'Unverified, full inspection required' },
          ].map(t => (
            <div key={t.label} style={{ flex: 1, padding: 12, background: `${t.color}11`, border: `1px solid ${t.color}33`, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: t.color }}>{t.label}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{t.desc}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 4 }}>{enriched.filter(s => s.trustScore >= t.min && (t.min >= 4 || s.trustScore < t.min + 1)).length}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Supplier Rankings</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead><tr>{['Rank','Supplier','Platform','Trust','Quality','Price','Speed','On-time','QC Pass','Tier',''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>{enriched.slice(0, 50).map((s, i) => (
            <tr key={s.id}>
              <td className="td" style={{ fontWeight: 600, color: 'var(--text3)' }}>#{i + 1}</td>
              <td className="td"><strong>{s.name}</strong><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{s.location}</div></td>
              <td className="td"><span className="badge badge-blue">{s.platform}</span></td>
              <td className="td"><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: '1.1rem', fontWeight: 700, color: tierColor(s.trustScore) }}>{s.trustScore.toFixed(1)}</span><StarBar score={s.trustScore} /></div></td>
              <td className="td">{s.quality_score?.toFixed(1) || '—'}</td>
              <td className="td">{s.price_score?.toFixed(1) || '—'}</td>
              <td className="td">{s.response_speed_score?.toFixed(1) || '—'}</td>
              <td className="td" style={{ color: (s.on_time_rate || 0) >= 0.9 ? 'var(--green)' : 'var(--yellow)' }}>{s.on_time_rate ? `${(s.on_time_rate * 100).toFixed(0)}%` : '—'}</td>
              <td className="td" style={{ color: (s.quality_pass_rate || 0) >= 0.95 ? 'var(--green)' : 'var(--yellow)' }}>{s.quality_pass_rate ? `${(s.quality_pass_rate * 100).toFixed(0)}%` : '—'}</td>
              <td className="td"><span className="badge" style={{ background: `${tierColor(s.trustScore)}22`, color: tierColor(s.trustScore) }}>{tierLabel(s.trustScore)}</span></td>
              <td className="td">
                <button className="btn-sm">Detail</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {!enriched.length && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>Add suppliers to see trust scores</div>}
      </div>

      <div className="panel">
        <div className="panel-title">Scoring Methodology</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Factor','Weight','Source'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {[
              { f: 'Quality Score', w: '30%', s: 'Manual rating + quality records' },
              { f: 'On-time Delivery Rate', w: '25%', s: 'Order fulfillment history' },
              { f: 'Quality Pass Rate', w: '15%', s: 'Inspection / QC records' },
              { f: 'Price Competitiveness', w: '15%', s: 'RFQ comparison data' },
              { f: 'Communication Speed', w: '15%', s: 'Response time tracking' },
            ].map(r => <tr key={r.f}><td className="td" style={{ fontWeight: 600 }}>{r.f}</td><td className="td">{r.w}</td><td className="td" style={{ color: 'var(--text2)' }}>{r.s}</td></tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}
