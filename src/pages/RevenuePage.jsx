import { useState, useEffect } from 'react';
import * as api from '../api';
import { useI18n } from '../i18n';

const money = (n) => n == null ? '—' : `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const moneyK = (n) => n == null ? '—' : n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toLocaleString()}`;
const pctFmt = (n) => n == null ? '—' : `${(n * 100).toFixed(2)}%`;

const LAYER_CONFIG = {
  saas: { label: 'Layer 1 · SaaS', sub: '订阅费', accent: 'var(--accent)', bg: 'rgba(59,130,246,.06)', border: 'rgba(59,130,246,.2)' },
  transaction: { label: 'Layer 2 · Transaction', sub: '交易佣金', accent: 'var(--green)', bg: 'rgba(34,197,94,.06)', border: 'rgba(34,197,94,.2)' },
  financial: { label: 'Layer 3 · Financial', sub: '金融服务', accent: 'var(--purple)', bg: 'rgba(168,85,247,.06)', border: 'rgba(168,85,247,.2)' },
};

const TIER_CONFIG = [
  { name: 'Free', price: '$0/mo', commission: '5%', accent: 'var(--text2)', features: ['Up to 3 suppliers', 'Basic search', 'Community support', 'Limited RFQs'] },
  { name: 'Starter', price: '$99/mo', commission: '3.5%', accent: 'var(--accent)', features: ['Up to 20 suppliers', 'AI sourcing', 'Email support', 'Unlimited RFQs', 'Basic analytics'] },
  { name: 'Growth', price: '$499/mo', commission: '2%', accent: 'var(--green)', features: ['Up to 100 suppliers', 'AI negotiation', 'Priority support', 'Advanced analytics', 'API access', 'Custom workflows'] },
  { name: 'Enterprise', price: 'Custom', commission: '1%', accent: 'var(--purple)', features: ['Unlimited suppliers', 'Dedicated CSM', 'SLA guarantee', 'White-label options', 'Custom integrations', 'On-premise option'] },
];

const SCENARIO_LABELS = { conservative: 'badge-yellow', moderate: 'badge-blue', aggressive: 'badge-green' };

export default function RevenuePage() {
  const { lang } = useI18n();
  const [dash, setDash] = useState({});
  const [pricing, setPricing] = useState({});
  const [projections, setProjections] = useState({});

  useEffect(() => {
    api.fetchRevenueDash().then(d => setDash(d)).catch(() => {});
    api.fetchRevenuePricing().then(d => setPricing(d)).catch(() => {});
    api.fetchRevenueProjections().then(d => setProjections(d)).catch(() => {});
  }, []);

  const layers = dash.revenue_layers || {};
  const trend = dash.revenue_trend || [];
  const scenarios = projections.scenarios || [];

  const heroKpis = [
    { label: 'GMV Total', value: money(dash.gmv_total) },
    { label: 'GMV MTD', value: money(dash.gmv_mtd), color: 'var(--accent)' },
    { label: 'MRR', value: money(dash.mrr), color: 'var(--green)' },
    { label: 'Take Rate', value: pctFmt(dash.take_rate), color: 'var(--purple)' },
    { label: 'Total Revenue', value: money(dash.total_revenue), color: 'var(--green)' },
    { label: 'Revenue MTD', value: money(dash.revenue_mtd), color: 'var(--accent)' },
  ];

  const maxTrendVal = Math.max(...trend.map(t => (t.saas || 0) + (t.transaction || 0) + (t.financial || 0)), 1);
  const barWidth = trend.length ? Math.floor(280 / trend.length) : 40;

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? '营收中心' : 'Revenue Hub'}</h2>
      <p className="page-sub">{lang === 'zh' ? 'RobotBuy OS 营收分层、定价方案和增长预测' : 'RobotBuy OS revenue layers, pricing tiers, and growth projections'}</p>

      <div className="kpis">
        {heroKpis.map(k => (
          <div className="kpi" key={k.label}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={k.color ? { color: k.color } : undefined}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-3">
        {Object.entries(LAYER_CONFIG).map(([key, cfg]) => {
          const layer = layers[key] || {};
          return (
            <div key={key} className="card" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderTop: `3px solid ${cfg.accent}` }}>
              <div style={{ fontSize: '.78rem', color: cfg.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>{cfg.label}</div>
              <div style={{ fontSize: '.82rem', color: 'var(--text3)', marginBottom: 12 }}>{cfg.sub}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Total</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: cfg.accent }}>{money(layer.total)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>MTD</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>{money(layer.mtd)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {trend.length > 0 && (
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Revenue Trend (Last 6 Months)</span></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, height: 180, padding: '16px 0' }}>
            {trend.slice(-6).map((t, i) => {
              const saas = t.saas || 0;
              const tx = t.transaction || 0;
              const fin = t.financial || 0;
              const total = saas + tx + fin;
              const h = (total / maxTrendVal) * 140;
              const sH = (saas / total) * h || 0;
              const tH = (tx / total) * h || 0;
              const fH = (fin / total) * h || 0;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: barWidth }}>
                  <div style={{ fontSize: '.68rem', fontWeight: 600, marginBottom: 4, color: 'var(--text2)' }}>{moneyK(total)}</div>
                  <div style={{ display: 'flex', flexDirection: 'column-reverse', borderRadius: 4, overflow: 'hidden' }}>
                    {sH > 0 && <div style={{ width: barWidth - 8, height: sH, background: 'var(--accent)' }} />}
                    {tH > 0 && <div style={{ width: barWidth - 8, height: tH, background: 'var(--green)' }} />}
                    {fH > 0 && <div style={{ width: barWidth - 8, height: fH, background: 'var(--purple)' }} />}
                  </div>
                  <div style={{ fontSize: '.7rem', color: 'var(--text3)', marginTop: 6 }}>{t.month || `M${i + 1}`}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: '.75rem', color: 'var(--text3)' }}>
            <span>🔵 SaaS</span><span>🟢 Transaction</span><span>🟣 Financial</span>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header"><span className="panel-title">Pricing Tiers</span></div>
        <div style={{ display: 'flex', gap: 14 }}>
          {(pricing.tiers || TIER_CONFIG).map((t, i) => {
            const cfg = TIER_CONFIG[i] || TIER_CONFIG[0];
            return (
              <div key={t.name || cfg.name} style={{ flex: 1, padding: 16, background: `${cfg.accent}08`, border: `1px solid ${cfg.accent}22`, borderRadius: 10, borderTop: `3px solid ${cfg.accent}`, textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: cfg.accent }}>{t.name || cfg.name}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, margin: '8px 0' }}>{t.price || cfg.price}</div>
                <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: 12 }}>Commission: {t.commission || cfg.commission}</div>
                <div style={{ textAlign: 'left' }}>
                  {(t.features || cfg.features).map(f => (
                    <div key={f} style={{ fontSize: '.78rem', padding: '3px 0', color: 'var(--text2)' }}>✓ {f}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {scenarios.length > 0 && (
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Growth Projections</span></div>
          <div className="grid-3">
            {scenarios.map(s => (
              <div key={s.name} className="card" style={{ borderTop: `3px solid ${s.name === 'aggressive' ? 'var(--green)' : s.name === 'moderate' ? 'var(--accent)' : 'var(--yellow)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize' }}>{s.name}</span>
                  <span className={`badge ${SCENARIO_LABELS[s.name] || 'badge-blue'}`}>{s.name}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase' }}>Customers</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.customers?.toLocaleString() || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase' }}>GMV</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{money(s.gmv)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase' }}>Take Rate</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{pctFmt(s.take_rate)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase' }}>Annual Revenue</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--green)' }}>{money(s.annual_revenue)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {scenarios.length === 0 && (
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Growth Projections</span></div>
          <div className="grid-3">
            {[
              { name: 'Conservative', customers: 50, gmv: 5000000, take_rate: 0.025, annual_revenue: 125000 },
              { name: 'Moderate', customers: 200, gmv: 25000000, take_rate: 0.03, annual_revenue: 750000 },
              { name: 'Aggressive', customers: 800, gmv: 120000000, take_rate: 0.035, annual_revenue: 4200000 },
            ].map(s => (
              <div key={s.name} className="card" style={{ borderTop: `3px solid ${s.name === 'Aggressive' ? 'var(--green)' : s.name === 'Moderate' ? 'var(--accent)' : 'var(--yellow)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{s.name}</span>
                  <span className={`badge ${s.name === 'Aggressive' ? 'badge-green' : s.name === 'Moderate' ? 'badge-blue' : 'badge-yellow'}`}>{s.name}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase' }}>Customers</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.customers.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase' }}>GMV</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{money(s.gmv)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase' }}>Take Rate</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{pctFmt(s.take_rate)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase' }}>Annual Revenue</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--green)' }}>{money(s.annual_revenue)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
