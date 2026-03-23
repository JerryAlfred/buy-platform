import { useState, useEffect } from 'react';
import * as api from '../api';
import { useI18n } from '../i18n';

function StarBar({ score, max = 5 }) {
  return <div className="stars">{Array.from({ length: max }, (_, i) => <span key={i} className={`star ${i < Math.round(score) ? 'on' : 'off'}`}>★</span>)}</div>;
}

export default function TrustScorePage() {
  const { lang } = useI18n();
  const [suppliers, setSuppliers] = useState([]);
  const [reliability, setReliability] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

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

  const tiers = [
    { label: 'TRUSTED', min: 4, max: 5.01, color: 'var(--green)', desc: lang === 'zh' ? '优秀记录，可自动审批' : 'Proven track record, auto-approve eligible' },
    { label: 'STANDARD', min: 3, max: 4, color: 'var(--yellow)', desc: lang === 'zh' ? '总体可靠，常规监督' : 'Generally reliable, normal oversight' },
    { label: 'CAUTION', min: 2, max: 3, color: 'var(--orange)', desc: lang === 'zh' ? '有问题标记，需额外验证' : 'Issues flagged, extra verification needed' },
    { label: 'NEW', min: 0, max: 2, color: 'var(--red)', desc: lang === 'zh' ? '未验证，需全面检查' : 'Unverified, full inspection required' },
  ];

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? '信任评分' : 'Trust Scores'}</h2>
      <p className="page-sub">{lang === 'zh' ? '综合评分：履约历史、质量、沟通、准时率、验证状态' : 'Composite scoring: fulfillment history, quality, communication, on-time rate, verification status'}</p>

      <div className="panel">
        <div className="panel-header"><span className="panel-title">{lang === 'zh' ? '信任层级' : 'Trust Tiers'}</span></div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          {tiers.map(t => (
            <div key={t.label} style={{ flex: 1, padding: 12, background: `${t.color}11`, border: `1px solid ${t.color}33`, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: t.color }}>{t.label}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{t.desc}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 4 }}>{enriched.filter(s => s.trustScore >= t.min && s.trustScore < t.max).length}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">{lang === 'zh' ? '供应商排名' : 'Supplier Rankings'}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead><tr>{[lang === 'zh' ? '排名' : 'Rank', lang === 'zh' ? '供应商' : 'Supplier', lang === 'zh' ? '平台' : 'Platform', lang === 'zh' ? '信任分' : 'Trust', lang === 'zh' ? '质量' : 'Quality', lang === 'zh' ? '价格' : 'Price', lang === 'zh' ? '速度' : 'Speed', lang === 'zh' ? '准时率' : 'On-time', lang === 'zh' ? 'QC通过率' : 'QC Pass', lang === 'zh' ? '层级' : 'Tier', ''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>{enriched.slice(0, 50).map((s, i) => (<>
            <tr key={s.id} style={{ cursor: 'pointer', background: selectedSupplier?.id === s.id ? 'rgba(59,130,246,.05)' : 'transparent' }} onClick={() => setSelectedSupplier(selectedSupplier?.id === s.id ? null : s)}>
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
                <button className="btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedSupplier(selectedSupplier?.id === s.id ? null : s); }}>{lang === 'zh' ? '详情' : 'Detail'}</button>
              </td>
            </tr>
            {selectedSupplier?.id === s.id && (
              <tr key={`${s.id}-detail`}>
                <td colSpan={11} className="td" style={{ background: 'rgba(59,130,246,.03)', padding: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, fontSize: '.85rem' }}>
                    <div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: 4 }}>{lang === 'zh' ? '总订单' : 'Total Orders'}</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.total_orders || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: 4 }}>{lang === 'zh' ? '总消费' : 'Total Spend'}</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>${s.total_spend_usd?.toFixed(0) || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: 4 }}>{lang === 'zh' ? '平均延迟' : 'Avg Delay'}</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: (s.avg_delay_days || 0) <= 2 ? 'var(--green)' : 'var(--red)' }}>{s.avg_delay_days?.toFixed(1) || 0} {lang === 'zh' ? '天' : 'days'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: 4 }}>{lang === 'zh' ? '沟通评分' : 'Comm Score'}</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.communication_score?.toFixed(1) || '—'}/5</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: 4 }}>{lang === 'zh' ? '分数构成' : 'Score Breakdown'}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { label: lang === 'zh' ? '质量' : 'Quality', val: s.quality_score, weight: '30%' },
                        { label: lang === 'zh' ? '准时率' : 'On-time', val: s.on_time_rate ? (s.on_time_rate * 5).toFixed(1) : '—', weight: '25%' },
                        { label: lang === 'zh' ? 'QC通过' : 'QC Pass', val: s.quality_pass_rate ? (s.quality_pass_rate * 5).toFixed(1) : '—', weight: '15%' },
                        { label: lang === 'zh' ? '价格' : 'Price', val: s.price_score, weight: '15%' },
                        { label: lang === 'zh' ? '响应' : 'Speed', val: s.response_speed_score, weight: '15%' },
                      ].map(b => (
                        <div key={b.label} style={{ flex: 1, padding: 8, background: 'var(--bg)', borderRadius: 6, textAlign: 'center' }}>
                          <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{b.label} ({b.weight})</div>
                          <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{b.val || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </>))}</tbody>
        </table>
        {!enriched.length && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>{lang === 'zh' ? '添加供应商以查看信任评分' : 'Add suppliers to see trust scores'}</div>}
      </div>

      <div className="panel">
        <div className="panel-title">{lang === 'zh' ? '评分方法论' : 'Scoring Methodology'}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{[lang === 'zh' ? '因素' : 'Factor', lang === 'zh' ? '权重' : 'Weight', lang === 'zh' ? '数据来源' : 'Source'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {[
              { f: lang === 'zh' ? '质量评分' : 'Quality Score', w: '30%', s: lang === 'zh' ? '人工评分 + 质量记录' : 'Manual rating + quality records' },
              { f: lang === 'zh' ? '准时交货率' : 'On-time Delivery Rate', w: '25%', s: lang === 'zh' ? '订单履约历史' : 'Order fulfillment history' },
              { f: lang === 'zh' ? '质检通过率' : 'Quality Pass Rate', w: '15%', s: lang === 'zh' ? '验货/QC 记录' : 'Inspection / QC records' },
              { f: lang === 'zh' ? '价格竞争力' : 'Price Competitiveness', w: '15%', s: lang === 'zh' ? 'RFQ 比价数据' : 'RFQ comparison data' },
              { f: lang === 'zh' ? '沟通速度' : 'Communication Speed', w: '15%', s: lang === 'zh' ? '回复时间追踪' : 'Response time tracking' },
            ].map(r => <tr key={r.f}><td className="td" style={{ fontWeight: 600 }}>{r.f}</td><td className="td">{r.w}</td><td className="td" style={{ color: 'var(--text2)' }}>{r.s}</td></tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}
