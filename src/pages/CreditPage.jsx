import { useState, useEffect } from 'react';
import * as api from '../api';
import { useI18n } from '../i18n';

const TIERS = [
  { label: 'Platinum', min: 90, color: 'var(--purple)', terms: 'Net 60', limit: '$500K', auto: '$50K' },
  { label: 'Gold', min: 70, color: 'var(--yellow)', terms: 'Net 30', limit: '$200K', auto: '$20K' },
  { label: 'Silver', min: 50, color: 'var(--text2)', terms: 'Net 15', limit: '$50K', auto: '$5K' },
  { label: 'Bronze', min: 0, color: 'var(--orange)', terms: 'Prepay Only', limit: '$10K', auto: '$0' },
];

function computeCredit(s, r) {
  const onTime = (r?.on_time_rate || 0.7) * 25;
  const qcPass = (r?.quality_pass_rate || 0.8) * 20;
  const financial = (s.quality_score || 3) / 5 * 15;
  const comms = (s.response_speed_score || 3) / 5 * 15;
  const years = Math.min(15, ((s.established_year ? (2025 - s.established_year) : 3) / 20) * 15);
  const verified = s.verification_status === 'factory_verified' ? 10 : s.verification_status === 'trade_company' ? 5 : 0;
  return Math.min(100, Math.round(onTime + qcPass + financial + comms + years + verified));
}

function getTier(score) {
  return TIERS.find(t => score >= t.min) || TIERS[3];
}

export default function CreditPage() {
  const { lang } = useI18n();
  const [suppliers, setSuppliers] = useState([]);
  const [reliability, setReliability] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.fetchSuppliers({ limit: 100 }).then(d => d.suppliers || []).catch(() => []),
      api.fetchReliability().then(d => d.reliability || []).catch(() => []),
    ]).then(([s, r]) => { setSuppliers(s); setReliability(r); setLoading(false); });
  }, []);

  const enriched = suppliers.map(s => {
    const r = reliability.find(x => x.supplier_id === s.id) || {};
    const score = computeCredit(s, r);
    const tier = getTier(score);
    return { ...s, reliability: r, score, tier };
  }).sort((a, b) => b.score - a.score);

  const tierCounts = TIERS.map(t => ({ ...t, count: enriched.filter(s => getTier(s.score).label === t.label).length }));
  const avgScore = enriched.length ? Math.round(enriched.reduce((a, s) => a + s.score, 0) / enriched.length) : 0;
  const detail = selected ? enriched.find(s => s.id === selected) : null;

  const HISTORY = [
    { date: '2025-01-10', event: 'Score recalculated — quarterly review', delta: '+3' },
    { date: '2024-12-01', event: 'On-time delivery improvement detected', delta: '+5' },
    { date: '2024-10-15', event: 'Factory verification completed', delta: '+10' },
    { date: '2024-09-01', event: 'Late shipment penalty applied', delta: '-4' },
    { date: '2024-07-20', event: 'Initial credit score assigned', delta: 'New' },
  ];

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? '供应商信用' : 'Supplier Credit System'}</h2>
      <p className="page-sub">{lang === 'zh' ? '基于履约、质量、财务、沟通和验证的综合信用评分' : 'Composite credit scores based on fulfillment, quality, financials, communication, and verification'}</p>

      <div className="kpis">
        <div className="kpi"><div className="kpi-label">Suppliers Scored</div><div className="kpi-value">{enriched.length}</div></div>
        <div className="kpi"><div className="kpi-label">Avg Credit Score</div><div className="kpi-value" style={{ color: getTier(avgScore).color }}>{avgScore}</div></div>
        {tierCounts.map(t => (
          <div className="kpi" key={t.label}><div className="kpi-label">{t.label}</div><div className="kpi-value" style={{ color: t.color }}>{t.count}</div></div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-header"><span className="panel-title">Credit Tiers & Benefits</span></div>
        <div style={{ display: 'flex', gap: 14 }}>
          {TIERS.map(t => (
            <div key={t.label} style={{ flex: 1, padding: 14, background: `${t.color}11`, border: `1px solid ${t.color}33`, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: t.color, fontSize: '1rem' }}>{t.label}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text3)', margin: '4px 0' }}>{t.min}+ score</div>
              <div style={{ fontSize: '.82rem' }}>{t.terms}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text2)' }}>Limit: {t.limit}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text2)' }}>Auto-approve: {t.auto}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={selected ? 'grid-sidebar' : ''}>
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Supplier Rankings</span></div>
          {loading && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>Loading suppliers…</div>}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['#', 'Supplier', 'Score', 'Tier', 'On-time', 'QC Pass', 'Verified'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{enriched.map((s, i) => (
              <tr key={s.id} style={{ cursor: 'pointer', background: selected === s.id ? 'rgba(59,130,246,.06)' : undefined }} onClick={() => setSelected(s.id)}>
                <td className="td" style={{ fontWeight: 600, color: 'var(--text3)' }}>#{i + 1}</td>
                <td className="td"><strong>{s.name}</strong><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{s.location}</div></td>
                <td className="td">
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: s.tier.color }}>{s.score}</span>
                  <div className="progress" style={{ width: 60, marginTop: 4 }}><div className="progress-fill" style={{ width: `${s.score}%`, background: s.tier.color }} /></div>
                </td>
                <td className="td"><span className="badge" style={{ background: `${s.tier.color}22`, color: s.tier.color }}>{s.tier.label}</span></td>
                <td className="td" style={{ color: (s.reliability.on_time_rate || 0) >= 0.9 ? 'var(--green)' : 'var(--yellow)' }}>{s.reliability.on_time_rate ? `${(s.reliability.on_time_rate * 100).toFixed(0)}%` : '—'}</td>
                <td className="td" style={{ color: (s.reliability.quality_pass_rate || 0) >= 0.95 ? 'var(--green)' : 'var(--yellow)' }}>{s.reliability.quality_pass_rate ? `${(s.reliability.quality_pass_rate * 100).toFixed(0)}%` : '—'}</td>
                <td className="td"><span className={`badge ${s.verification_status === 'factory_verified' ? 'badge-green' : s.verification_status === 'trade_company' ? 'badge-yellow' : 'badge-red'}`}>{s.verification_status || 'unverified'}</span></td>
              </tr>
            ))}</tbody>
          </table>
          {!enriched.length && !loading && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No suppliers found</div>}
        </div>

        {detail && (
          <div>
            <div className="panel">
              <div className="panel-header"><span className="panel-title">{detail.name} — Credit Detail</span></div>

              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: detail.tier.color }}>{detail.score}</div>
                <span className="badge" style={{ background: `${detail.tier.color}22`, color: detail.tier.color, fontSize: '.88rem', padding: '4px 16px' }}>{detail.tier.label}</span>
              </div>

              <div className="panel-title" style={{ marginBottom: 8 }}>Score Breakdown</div>
              {[
                { label: 'On-time Delivery (25%)', value: detail.reliability.on_time_rate ? (detail.reliability.on_time_rate * 25).toFixed(1) : '17.5', max: 25 },
                { label: 'Quality Pass Rate (20%)', value: detail.reliability.quality_pass_rate ? (detail.reliability.quality_pass_rate * 20).toFixed(1) : '16.0', max: 20 },
                { label: 'Financial Stability (15%)', value: ((detail.quality_score || 3) / 5 * 15).toFixed(1), max: 15 },
                { label: 'Communication (15%)', value: ((detail.response_speed_score || 3) / 5 * 15).toFixed(1), max: 15 },
                { label: 'Years in Business (15%)', value: Math.min(15, ((detail.established_year ? (2025 - detail.established_year) : 3) / 20) * 15).toFixed(1), max: 15 },
                { label: 'Verification (10%)', value: detail.verification_status === 'factory_verified' ? '10.0' : detail.verification_status === 'trade_company' ? '5.0' : '0.0', max: 10 },
              ].map(b => (
                <div key={b.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 2 }}><span>{b.label}</span><span style={{ fontWeight: 600 }}>{b.value}/{b.max}</span></div>
                  <div className="progress"><div className="progress-fill" style={{ width: `${(parseFloat(b.value) / b.max) * 100}%`, background: parseFloat(b.value) / b.max >= 0.8 ? 'var(--green)' : parseFloat(b.value) / b.max >= 0.5 ? 'var(--yellow)' : 'var(--red)' }} /></div>
                </div>
              ))}

              <div className="panel-title" style={{ marginTop: 16, marginBottom: 8 }}>Tier Benefits</div>
              <div className="form-grid">
                {[['Payment Terms', detail.tier.terms], ['Order Limit', detail.tier.limit], ['Auto-approve', detail.tier.auto], ['Tier', detail.tier.label]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase' }}>{l}</div><div style={{ fontWeight: 600 }}>{v}</div></div>
                ))}
              </div>

              <div className="panel-title" style={{ marginTop: 16, marginBottom: 8 }}>Credit History</div>
              <div style={{ paddingLeft: 16, borderLeft: '2px solid var(--border)' }}>
                {HISTORY.map((h, i) => (
                  <div key={i} style={{ position: 'relative', paddingBottom: 14, paddingLeft: 14 }}>
                    <div style={{ position: 'absolute', left: -23, top: 4, width: 10, height: 10, borderRadius: '50%', background: h.delta.startsWith('+') ? 'var(--green)' : h.delta.startsWith('-') ? 'var(--red)' : 'var(--accent)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '.82rem' }}>{h.event}</span>
                      <span style={{ fontWeight: 700, color: h.delta.startsWith('+') ? 'var(--green)' : h.delta.startsWith('-') ? 'var(--red)' : 'var(--accent)', fontSize: '.82rem' }}>{h.delta}</span>
                    </div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{h.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
