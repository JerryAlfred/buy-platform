import { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const TABS = [
  { id: 'arch', icon: '📐', en: 'Revenue Architecture', zh: '收入结构' },
  { id: 'packages', icon: '📦', en: 'Standard Packages', zh: '标准化高价包' },
  { id: 'attach', icon: '🔗', en: 'Attach Strategy', zh: '交叉销售策略' },
  { id: 'risk_price', icon: '🎯', en: 'Risk Pricing', zh: '风险定价' },
  { id: 'growth', icon: '📈', en: 'Growth Metrics', zh: '增长仪表盘' },
  { id: 'actions', icon: '⚡', en: 'Action Board', zh: '5大行动' },
];

const s = {
  card: { padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 },
  kpi: (c) => ({ padding: '12px 14px', background: `${c}08`, border: `1px solid ${c}20`, borderRadius: 10, textAlign: 'center' }),
  badge: (c) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '.68rem', fontWeight: 600, background: `${c}15`, color: c }),
  bar: (pct, c) => ({ width: `${Math.min(pct, 100)}%`, height: 8, background: c, borderRadius: 4, transition: 'width .5s' }),
  ring: (score, size = 56) => ({
    width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: size > 50 ? '1rem' : '.8rem',
    background: `conic-gradient(${score > 60 ? '#22c55e' : score > 35 ? '#f59e0b' : '#ef4444'} ${score * 3.6}deg, var(--border) 0deg)`,
  }),
};

/* ═══════════════ 1. REVENUE ARCHITECTURE ═══════════════ */
function ArchTab({ lang }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.fetchRevenueArch().then(setD).catch(() => {}); }, []);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;
  const cur = d.current_mix?.layers || [];
  const evo = d.evolution_roadmap || [];
  const rq = d.revenue_quality_score || {};

  return (
    <div>
      {/* Current Mix */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>📊 {lang === 'zh' ? '当前收入结构 (2026)' : 'Current Revenue Mix (2026)'}</div>
        {cur.map(l => (
          <div key={l.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '.84rem' }}>{l.name}</span>
                <span style={s.badge(l.sexy_score >= 7 ? '#22c55e' : l.sexy_score >= 4 ? '#f59e0b' : '#6b7280')}>
                  sexy: {l.sexy_score}/10
                </span>
                <span style={{ fontSize: '.68rem', color: 'var(--text3)' }}>{l.nature} · margin {l.margin_pct}%</span>
              </div>
              <span style={{ fontWeight: 800, color: l.color }}>{l.share_pct}% · ${l.revenue_k}K</span>
            </div>
            <div style={{ width: '100%', height: 10, background: 'var(--border)', borderRadius: 5 }}>
              <div style={{ ...s.bar(l.share_pct, l.color), height: 10 }} />
            </div>
            <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginTop: 2 }}>{l.description}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Evolution Roadmap */}
        <div style={s.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>🚀 {lang === 'zh' ? '收入进化路径 2026→2030' : 'Revenue Evolution 2026→2030'}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.76rem' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
              <th style={{ textAlign: 'left', padding: 5 }}>{lang === 'zh' ? '年份' : 'Year'}</th>
              <th style={{ textAlign: 'right', padding: 5 }}>ARR</th>
              <th style={{ textAlign: 'right', padding: 5 }}>HW%</th>
              <th style={{ textAlign: 'right', padding: 5 }}>Deploy%</th>
              <th style={{ textAlign: 'right', padding: 5 }}>SW%</th>
              <th style={{ textAlign: 'right', padding: 5 }}>Txn%</th>
              <th style={{ textAlign: 'right', padding: 5 }}>Risk%</th>
              <th style={{ textAlign: 'right', padding: 5 }}>{lang === 'zh' ? '毛利' : 'Margin'}</th>
              <th style={{ textAlign: 'right', padding: 5 }}>{lang === 'zh' ? '倍数' : 'Multiple'}</th>
              <th style={{ textAlign: 'right', padding: 5 }}>{lang === 'zh' ? '估值' : 'Valuation'}</th>
            </tr></thead>
            <tbody>
              {evo.map(r => (
                <tr key={r.year} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: 5, fontWeight: 700 }}>{r.year}</td>
                  <td style={{ padding: 5, textAlign: 'right', color: '#22c55e', fontWeight: 700 }}>${r.arr_k >= 1000 ? `${(r.arr_k / 1000).toFixed(0)}M` : `${r.arr_k}K`}</td>
                  <td style={{ padding: 5, textAlign: 'right', color: '#6b7280' }}>{r.hardware_pct}%</td>
                  <td style={{ padding: 5, textAlign: 'right', color: '#f59e0b' }}>{r.deployment_pct}%</td>
                  <td style={{ padding: 5, textAlign: 'right', color: '#3b82f6' }}>{r.software_pct}%</td>
                  <td style={{ padding: 5, textAlign: 'right', color: '#22c55e' }}>{r.transaction_pct}%</td>
                  <td style={{ padding: 5, textAlign: 'right', color: '#a855f7' }}>{r.risk_pct}%</td>
                  <td style={{ padding: 5, textAlign: 'right' }}>{r.blended_margin}%</td>
                  <td style={{ padding: 5, textAlign: 'right', fontWeight: 700 }}>{r.valuation_multiple}x</td>
                  <td style={{ padding: 5, textAlign: 'right', color: '#22c55e', fontWeight: 800 }}>${r.implied_val_m}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Revenue Quality Score */}
        <div style={s.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>💎 {lang === 'zh' ? '收入质量评分' : 'Revenue Quality Score'}</div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div style={s.ring(rq.current, 80)}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: rq.current > 60 ? '#22c55e' : '#f59e0b' }}>{rq.current}</div>
                <div style={{ fontSize: '.6rem', color: 'var(--text3)' }}>/ {rq.target}</div>
              </div>
            </div>
          </div>
          {(rq.factors || []).map((f, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', marginBottom: 2 }}>
                <span>{f.factor}</span>
                <span style={{ fontWeight: 600 }}>{f.current} → {f.target}</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3 }}>
                <div style={s.bar(f.current, f.current > f.target * 0.6 ? '#22c55e' : '#f59e0b')} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ 2. STANDARD PACKAGES ═══════════════ */
function PackagesTab({ lang }) {
  const [pkgs, setPkgs] = useState([]);
  const [pipe, setPipe] = useState(null);
  useEffect(() => { api.fetchPackages().then(d => setPkgs(d.packages || [])).catch(() => {}); api.fetchPackagesPipeline().then(setPipe).catch(() => {}); }, []);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }}>
        {pkgs.map(p => (
          <div key={p.id} style={{ ...s.card, borderTop: `3px solid ${p.id === 'launch' ? '#3b82f6' : p.id === 'operate' ? '#22c55e' : '#a855f7'}` }}>
            <div style={{ fontSize: '2rem', textAlign: 'center' }}>{p.icon}</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', textAlign: 'center', marginBottom: 2 }}>{p.name}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--text3)', textAlign: 'center', marginBottom: 8 }}>{p.tagline}</div>
            <div style={{ fontSize: '.82rem', fontWeight: 700, textAlign: 'center', color: 'var(--accent)', marginBottom: 10 }}>{p.price_range}</div>
            <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 8 }}>
              <span style={s.badge(p.revenue_type?.includes('recurring') ? '#22c55e' : '#3b82f6')}>{p.revenue_type}</span>
            </div>
            {p.includes?.map((inc, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, padding: '3px 0', fontSize: '.74rem' }}>
                <span style={{ color: '#22c55e' }}>✓</span>
                <span>{inc.item}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, padding: '6px 8px', background: 'var(--bg)', borderRadius: 6, fontSize: '.7rem' }}>
              <span style={{ fontWeight: 600 }}>{lang === 'zh' ? '追加销售' : 'Upsells'}:</span> {p.upsells?.join(' · ')}
            </div>
            {p.metrics && (
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: '.68rem' }}>
                {Object.entries(p.metrics).map(([k, v]) => (
                  <div key={k} style={{ padding: '3px 6px', background: 'var(--bg)', borderRadius: 4, textAlign: 'center' }}>
                    <div style={{ color: 'var(--text3)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</div>
                    <div style={{ fontWeight: 700 }}>{typeof v === 'number' && v > 100 ? `$${v}K` : v}{k.includes('rate') ? '%' : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {pipe && (
        <div style={s.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>🎯 {lang === 'zh' ? '销售流水线' : 'Sales Pipeline'} — ${pipe.total_pipeline_k}K total</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.entries(pipe.pipeline || {}).map(([stage, data]) => (
              <div key={stage} style={{ flex: 1, padding: '10px 8px', background: 'var(--bg)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '.66rem', color: 'var(--text3)', textTransform: 'capitalize' }}>{stage.replace(/_/g, ' ')}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: stage === 'closed_won' ? '#22c55e' : 'var(--text)' }}>{data.count}</div>
                <div style={{ fontSize: '.66rem', fontWeight: 600 }}>${data.value_k}K</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ 3. ATTACH STRATEGY ═══════════════ */
function AttachTab({ lang }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.fetchAttachOverview().then(setD).catch(() => {}); }, []);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;
  const m = d.current_metrics || {};

  return (
    <div>
      <div style={{ ...s.card, marginBottom: 16, background: 'linear-gradient(135deg, rgba(168,85,247,.06), rgba(34,197,94,.06))' }}>
        <div style={{ fontWeight: 800, fontSize: '.92rem', marginBottom: 4 }}>💡 {lang === 'zh' ? '收入公式' : 'Revenue Formula'}</div>
        <div style={{ fontSize: '.84rem', fontFamily: 'monospace', color: 'var(--accent)' }}>{d.attach_formula}</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          <div style={s.kpi('#22c55e')}>
            <div style={{ fontSize: '.66rem', color: 'var(--text3)' }}>LTV {lang === 'zh' ? '有交叉' : 'w/ Attach'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22c55e' }}>${(m.ltv_with_attach || 0).toLocaleString()}</div>
          </div>
          <div style={s.kpi('#6b7280')}>
            <div style={{ fontSize: '.66rem', color: 'var(--text3)' }}>LTV {lang === 'zh' ? '无交叉' : 'w/o Attach'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#6b7280' }}>${(m.ltv_without_attach || 0).toLocaleString()}</div>
          </div>
          <div style={s.kpi('#a855f7')}>
            <div style={{ fontSize: '.66rem', color: 'var(--text3)' }}>LTV {lang === 'zh' ? '乘数' : 'Multiplier'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a855f7' }}>{m.ltv_multiplier}x</div>
          </div>
          <div style={s.kpi('#3b82f6')}>
            <div style={{ fontSize: '.66rem', color: 'var(--text3)' }}>{lang === 'zh' ? '每客户产品数' : 'Products/Customer'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3b82f6' }}>{m.avg_products_per_customer} / {m.target_products_per_customer}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={s.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>📊 {lang === 'zh' ? '交叉销售漏斗' : 'Attach Waterfall'}</div>
          {(d.attach_waterfall || []).map((w, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.76rem', marginBottom: 2 }}>
                <span>{w.stage}</span>
                <span style={{ fontWeight: 700, color: w.color }}>{w.pct}% · {w.revenue_index}x</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'var(--border)', borderRadius: 4 }}>
                <div style={{ ...s.bar(w.pct, w.color), height: 8 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={s.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>🎯 {lang === 'zh' ? '交叉销售机会' : 'Cross-Sell Opportunities'}</div>
          {(d.top_cross_sell_opportunities || []).map((o, i) => (
            <div key={i} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '.82rem' }}>{o.customer}</span>
                <span style={{ fontWeight: 800, color: '#22c55e' }}>+${o.potential_arr_k}K ARR</span>
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 2 }}>
                {lang === 'zh' ? '当前' : 'Current'}: {o.current_products.join(', ')} → <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{o.recommended}</span>
              </div>
              <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 4 }}>
                <div style={{ ...s.bar(o.probability_pct, '#22c55e'), height: 4 }} />
              </div>
              <div style={{ fontSize: '.64rem', color: 'var(--text3)', textAlign: 'right' }}>{o.probability_pct}% {lang === 'zh' ? '概率' : 'probability'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ 4. RISK-ADJUSTED PRICING ═══════════════ */
function RiskPriceTab({ lang }) {
  const [d, setD] = useState(null);
  const [quote, setQuote] = useState(null);
  const [form, setForm] = useState({ asset_type: 'Unitree G1', environment: 'indoor_warehouse', operator_trained: true, asset_age_months: 0, customer_risk_score: 80, quantity: 1 });
  useEffect(() => { api.fetchRiskPricingEngine().then(setD).catch(() => {}); }, []);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;

  const handleQuote = async () => { setQuote(await api.generateRiskQuote(form)); };

  return (
    <div>
      {/* Pricing Dimensions */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>🎯 {lang === 'zh' ? '定价维度' : 'Pricing Dimensions'}</div>
        {(d.pricing_dimensions || []).map((dim, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.76rem' }}>
            <div style={{ width: 180, fontWeight: 700 }}>{dim.dimension}</div>
            <div style={{ width: 50, textAlign: 'center' }}><span style={s.badge('#3b82f6')}>{(dim.weight * 100).toFixed(0)}%</span></div>
            <div style={{ flex: 1, color: 'var(--text3)' }}>{dim.impact}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Quote Generator */}
        <div style={s.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>💰 {lang === 'zh' ? '报价生成器' : 'Quote Generator'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <select value={form.asset_type} onChange={e => setForm({ ...form, asset_type: e.target.value })} style={{ padding: '8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
              {['Unitree G1', 'SO-101', 'UR5e', 'Franka'].map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })} style={{ padding: '8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
              {['indoor_warehouse', 'indoor_lab', 'outdoor', 'construction', 'harsh'].map(e => <option key={e}>{e}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.78rem' }}>
              <input type="checkbox" checked={form.operator_trained} onChange={e => setForm({ ...form, operator_trained: e.target.checked })} />
              {lang === 'zh' ? '操作员已培训' : 'Operator Trained'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{lang === 'zh' ? '数量' : 'Qty'}</span>
              <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} style={{ width: 50, padding: '6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{lang === 'zh' ? '设备年龄(月)' : 'Age(mo)'}</span>
              <input type="number" value={form.asset_age_months} onChange={e => setForm({ ...form, asset_age_months: Number(e.target.value) })} style={{ width: 50, padding: '6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{lang === 'zh' ? '风险分' : 'Risk Score'}</span>
              <input type="number" value={form.customer_risk_score} onChange={e => setForm({ ...form, customer_risk_score: Number(e.target.value) })} style={{ width: 50, padding: '6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </div>
          </div>
          <button onClick={handleQuote} style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            {lang === 'zh' ? '生成报价' : 'Generate Quote'}
          </button>
          {quote?.quote && (
            <div style={{ marginTop: 12, padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700 }}>{quote.quote.asset_type} × {quote.quote.quantity}</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#22c55e' }}>${(quote.quote.total_monthly || 0).toLocaleString()}/mo</span>
              </div>
              <div style={{ fontSize: '.76rem' }}>
                <div>{lang === 'zh' ? '基础价' : 'Base'}: ${quote.quote.base_monthly_per_unit}/mo → {lang === 'zh' ? '调整' : 'Adj'}: {quote.quote.risk_adjustment_pct > 0 ? '+' : ''}{quote.quote.risk_adjustment_pct}% → ${quote.quote.final_monthly_per_unit}/mo</div>
                <div>{lang === 'zh' ? '保险费率' : 'Protection'}: {quote.quote.protection_premium_pct}% · {lang === 'zh' ? '账期' : 'Terms'}: {quote.quote.recommended_terms} · {lang === 'zh' ? '可融资' : 'Financing'}: {quote.quote.financing_eligible ? '✅' : '❌'}</div>
              </div>
              {quote.quote.adjustment_factors?.length > 0 && (
                <div style={{ marginTop: 6, fontSize: '.7rem' }}>
                  {quote.quote.adjustment_factors.map((f, i) => (
                    <span key={i} style={s.badge(f.adjustment_pct > 0 ? '#ef4444' : '#22c55e')}>{f.factor} {f.adjustment_pct > 0 ? '+' : ''}{f.adjustment_pct}%</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Rules */}
        <div style={s.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>⚙️ {lang === 'zh' ? '动态定价规则' : 'Dynamic Pricing Rules'}</div>
          {(d.dynamic_pricing_rules || []).map((r, i) => (
            <div key={i} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: '.78rem' }}>{r.rule}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{r.action}</div>
              <span style={s.badge('#22c55e')}>{r.revenue_impact}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Example Scenarios */}
      <div style={{ ...s.card, marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>📋 {lang === 'zh' ? '场景示例' : 'Example Scenarios'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {(d.example_scenarios || []).map((ex, i) => (
            <div key={i} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ fontSize: '.74rem', marginBottom: 6 }}>{ex.scenario}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem' }}>
                <span style={{ color: 'var(--text3)' }}>${ex.base_monthly}/mo</span>
                <span style={{ fontWeight: 800, color: ex.risk_adjustment > 0 ? '#ef4444' : '#22c55e' }}>{ex.risk_adjustment > 0 ? '+' : ''}{ex.risk_adjustment}%</span>
                <span style={{ fontWeight: 800, color: '#22c55e' }}>${ex.final_monthly}/mo</span>
              </div>
              <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginTop: 4 }}>
                Protect: {ex.protection_premium_pct}% · Finance: {ex.financing_eligible ? '✅' : '❌'} · {ex.terms_offered}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ 5. GROWTH METRICS ═══════════════ */
function GrowthTab({ lang }) {
  const [d, setD] = useState(null);
  const [sim, setSim] = useState(null);
  const [simForm, setSimForm] = useState({ customers: 20, avg_assets_per_customer: 3, avg_recurring_per_asset_mo: 800, avg_risk_premium_per_asset_mo: 150, avg_transaction_take_rate_pct: 2.5, avg_gmv_per_customer_mo: 10000 });
  useEffect(() => { api.fetchGrowthMetrics().then(setD).catch(() => {}); }, []);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;
  const h = d.headline_kpis || {};

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { l: 'ARR', v: `$${h.arr_k}K`, sub: `+${h.arr_growth_pct}%`, c: '#22c55e' },
          { l: 'NRR', v: `${h.nrr_pct}%`, c: '#3b82f6' },
          { l: lang === 'zh' ? '毛利率' : 'Gross Margin', v: `${h.gross_margin_pct}%`, c: '#a855f7' },
          { l: 'LTV/CAC', v: `${h.ltv_cac_ratio}x`, c: '#f59e0b' },
        ].map((k, i) => (
          <div key={i} style={s.kpi(k.c)}>
            <div style={{ fontSize: '.66rem', color: 'var(--text3)' }}>{k.l}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: k.c }}>{k.v}</div>
            {k.sub && <div style={{ fontSize: '.64rem', color: '#22c55e' }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={s.card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>🤖 Installed Base</div>
          {d.installed_base && Object.entries(d.installed_base).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '.78rem' }}>
              <span style={{ color: 'var(--text3)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
              <span style={{ fontWeight: 600 }}>{v}{k.includes('pct') ? '%' : ''}</span>
            </div>
          ))}
        </div>
        <div style={s.card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>🔗 Attach Rates</div>
          {d.attach_rates && Object.entries(d.attach_rates).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '.78rem' }}>
              <span style={{ color: 'var(--text3)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
              <span style={{ fontWeight: 600, color: k.includes('target') ? '#22c55e' : 'var(--text)' }}>{v}{k.includes('pct') ? '%' : ''}</span>
            </div>
          ))}
        </div>
        <div style={s.card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>💰 Transaction Flow</div>
          {d.transaction_flow && Object.entries(d.transaction_flow).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '.78rem' }}>
              <span style={{ color: 'var(--text3)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
              <span style={{ fontWeight: 600 }}>{k.includes('_k') ? `$${v}K` : k.includes('pct') ? `${v}%` : v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Simulator */}
      <div style={{ ...s.card, background: 'linear-gradient(135deg, rgba(34,197,94,.04), rgba(59,130,246,.04))' }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>🧮 {lang === 'zh' ? '收入模拟器' : 'Revenue Simulator'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
          {[
            { k: 'customers', l: lang === 'zh' ? '客户数' : 'Customers' },
            { k: 'avg_assets_per_customer', l: lang === 'zh' ? '每客户设备数' : 'Assets/Customer' },
            { k: 'avg_recurring_per_asset_mo', l: lang === 'zh' ? '每设备月经常收入' : '$/Asset/mo (recurring)' },
            { k: 'avg_risk_premium_per_asset_mo', l: lang === 'zh' ? '每设备月风险收入' : '$/Asset/mo (risk)' },
            { k: 'avg_transaction_take_rate_pct', l: lang === 'zh' ? '交易抽成%' : 'Take Rate %' },
            { k: 'avg_gmv_per_customer_mo', l: lang === 'zh' ? '每客户月GMV' : 'GMV/Customer/mo' },
          ].map(f => (
            <div key={f.k}>
              <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginBottom: 2 }}>{f.l}</div>
              <input type="number" value={simForm[f.k]} onChange={e => setSimForm({ ...simForm, [f.k]: Number(e.target.value) })}
                style={{ width: '100%', padding: '7px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box' }} />
            </div>
          ))}
        </div>
        <button onClick={async () => setSim(await api.simulateRevenue(simForm))} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
          {lang === 'zh' ? '模拟' : 'Simulate'}
        </button>
        {sim?.simulation && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--card)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--accent)', marginBottom: 8 }}>{sim.simulation.sexy_formula}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 10 }}>
              <div style={s.kpi('#22c55e')}>
                <div style={{ fontSize: '.62rem', color: 'var(--text3)' }}>Total MRR</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#22c55e' }}>${sim.simulation.monthly.total_mrr.toLocaleString()}</div>
              </div>
              <div style={s.kpi('#3b82f6')}>
                <div style={{ fontSize: '.62rem', color: 'var(--text3)' }}>ARR</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3b82f6' }}>${sim.simulation.annual.arr.toLocaleString()}</div>
              </div>
              <div style={s.kpi('#a855f7')}>
                <div style={{ fontSize: '.62rem', color: 'var(--text3)' }}>Recurring %</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a855f7' }}>{sim.simulation.annual.recurring_share_pct}%</div>
              </div>
              <div style={s.kpi('#f59e0b')}>
                <div style={{ fontSize: '.62rem', color: 'var(--text3)' }}>Risk %</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>{sim.simulation.annual.risk_share_pct}%</div>
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: 6 }}>{lang === 'zh' ? '增长杠杆' : 'Growth Levers'}</div>
            {sim.simulation.growth_levers?.map((lev, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: '.76rem' }}>
                <span>{lev.lever}</span>
                <span style={{ fontWeight: 700, color: '#22c55e' }}>+${lev.impact_mrr.toLocaleString()}/mo</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════ 6. ACTION BOARD ═══════════════ */
function ActionsTab({ lang }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.fetchActionBoard().then(setD).catch(() => {}); }, []);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;
  const statusColor = { completed: '#22c55e', in_progress: '#3b82f6', planning: '#f59e0b' };
  const prioColor = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6' };

  return (
    <div>
      {(d.actions || []).map(a => (
        <div key={a.id} style={{ ...s.card, marginBottom: 12, borderLeft: `4px solid ${statusColor[a.status] || '#6b7280'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: '1rem' }}>#{a.id}</span>
              <span style={{ fontWeight: 700, fontSize: '.92rem' }}>{a.title}</span>
              <span style={s.badge(prioColor[a.priority] || '#6b7280')}>{a.priority}</span>
              <span style={s.badge(statusColor[a.status] || '#6b7280')}>{a.status}</span>
            </div>
            <span style={{ fontWeight: 800, color: a.progress_pct >= 80 ? '#22c55e' : '#3b82f6' }}>{a.progress_pct}%</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3, marginBottom: 8 }}>
            <div style={{ ...s.bar(a.progress_pct, statusColor[a.status] || '#6b7280'), height: 6 }} />
          </div>
          <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginBottom: 8 }}>{a.description}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '.74rem', marginBottom: 4 }}>KPIs</div>
              {a.kpis?.map((k, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '.72rem' }}>
                  <span style={{ color: 'var(--text3)' }}>{k.metric}</span>
                  <span><span style={{ color: '#f59e0b' }}>{k.current}</span> → <span style={{ color: '#22c55e', fontWeight: 600 }}>{k.target}</span></span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '.74rem', marginBottom: 4 }}>{lang === 'zh' ? '下一步' : 'Next Steps'}</div>
              {a.next_steps?.map((step, i) => (
                <div key={i} style={{ padding: '2px 0', fontSize: '.72rem' }}>
                  <span style={{ color: 'var(--text3)', marginRight: 4 }}>•</span> {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const TAB_COMPS = { arch: ArchTab, packages: PackagesTab, attach: AttachTab, risk_price: RiskPriceTab, growth: GrowthTab, actions: ActionsTab };

export default function RevenueOSPage() {
  const { lang } = useI18n();
  const [tab, setTab] = useState('arch');
  const Comp = TAB_COMPS[tab];
  return (
    <div>
      <h2 style={{ margin: '0 0 4px' }}>💎 {lang === 'zh' ? '收入操作系统' : 'Revenue OS'}</h2>
      <p style={{ color: 'var(--text3)', fontSize: '.82rem', margin: '0 0 16px' }}>
        {lang === 'zh'
          ? '把收入结构从"重服务"转变为"平台化 · 交易化 · 金融化"——让增长更陡、估值更高'
          : 'Transform revenue from heavy-service to platform + transaction + risk — steeper growth, higher multiples'}
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 14px', borderRadius: 8, border: tab === t.id ? '2px solid var(--accent)' : '1px solid var(--border)',
            background: tab === t.id ? 'rgba(59,130,246,.08)' : 'var(--card)',
            color: tab === t.id ? 'var(--accent)' : 'var(--text2)',
            cursor: 'pointer', fontWeight: tab === t.id ? 700 : 400, fontSize: '.78rem', whiteSpace: 'nowrap',
          }}>
            {t.icon} {lang === 'zh' ? t.zh : t.en}
          </button>
        ))}
      </div>
      {Comp && <Comp lang={lang} />}
    </div>
  );
}
