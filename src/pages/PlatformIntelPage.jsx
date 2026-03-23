import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const TABS = [
  { id: 'control', icon: '🗼', en: 'AI Control Tower', zh: 'AI 控制塔' },
  { id: 'marketing', icon: '📣', en: 'Marketing Engine', zh: '营销引擎' },
  { id: 'bi', icon: '📊', en: 'Business Intelligence', zh: '生意参谋' },
  { id: 'warehouse', icon: '🏭', en: 'Warehouse Intel', zh: '智能仓储' },
  { id: 'crossborder', icon: '🌍', en: 'Cross-Border', zh: '跨境合规' },
  { id: 'fba', icon: '📦', en: 'Fulfillment Opt.', zh: '履约优化' },
];

const SEV_COLORS = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6', high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const css = {
  card: { padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 },
  kpi: (color) => ({ padding: '12px 14px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 10, textAlign: 'center' }),
  badge: (color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '.68rem', fontWeight: 600, background: `${color}15`, color }),
};

function ControlTowerTab({ lang }) {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  useEffect(() => { api.fetchControlTower().then(setData).catch(() => {}); api.fetchControlAlerts().then(d => setAlerts(d.alerts || [])).catch(() => {}); }, []);
  if (!data) return <div style={{ padding: 20, color: 'var(--text3)' }}>Loading...</div>;
  const sc = data.supply_chain_status || {};
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { l: lang === 'zh' ? '健康分' : 'Health Score', v: data.health_score, c: '#22c55e' },
          { l: lang === 'zh' ? '活跃告警' : 'Active Alerts', v: data.active_alerts, c: '#ef4444' },
          { l: lang === 'zh' ? '预测风险' : 'Predicted Risks', v: data.predicted_disruptions, c: '#f59e0b' },
          { l: lang === 'zh' ? '今日自动操作' : 'Auto Actions Today', v: data.auto_actions_today, c: '#3b82f6' },
        ].map((k, i) => (
          <div key={i} style={css.kpi(k.c)}>
            <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{k.l}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{lang === 'zh' ? '供应链状态' : 'Supply Chain Status'}</div>
          {Object.entries(sc).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ textTransform: 'capitalize', fontSize: '.82rem' }}>{k}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 80, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${v.score}%`, height: '100%', background: v.score > 80 ? '#22c55e' : v.score > 60 ? '#f59e0b' : '#ef4444', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: '.72rem', fontWeight: 600 }}>{v.score}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{lang === 'zh' ? 'AI 预测洞察' : 'Predictive Insights'}</div>
          {(data.predictive_insights || []).map((p, i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '.78rem' }}>
              <div style={{ fontWeight: 600 }}>{p.message.slice(0, 80)}...</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span style={css.badge('#3b82f6')}>{(p.confidence * 100).toFixed(0)}% conf</span>
                <span style={{ color: '#22c55e', fontSize: '.72rem' }}>→ {p.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div style={{ ...css.card, marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>🚨 {lang === 'zh' ? '实时告警' : 'Real-time Alerts'}</div>
        {alerts.map(a => (
          <div key={a.id} style={{ padding: '8px 12px', border: `1px solid ${SEV_COLORS[a.severity]}30`, borderRadius: 8, marginBottom: 8, background: `${SEV_COLORS[a.severity]}05` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '.82rem' }}>{a.title}</span>
              <span style={css.badge(SEV_COLORS[a.severity])}>{a.severity}</span>
            </div>
            <div style={{ fontSize: '.76rem', color: 'var(--text2)', margin: '4px 0' }}>{a.detail}</div>
            <div style={{ fontSize: '.7rem', color: '#22c55e' }}>🤖 {a.auto_action}</div>
          </div>
        ))}
      </div>

      {/* Auto-reorder */}
      <div style={{ ...css.card, marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>🔄 {lang === 'zh' ? '智能补货队列' : 'Auto-Reorder Queue'}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
            <th style={{ textAlign: 'left', padding: 6 }}>{lang === 'zh' ? '产品' : 'Product'}</th>
            <th style={{ textAlign: 'right', padding: 6 }}>{lang === 'zh' ? '库存' : 'Stock'}</th>
            <th style={{ textAlign: 'right', padding: 6 }}>{lang === 'zh' ? '补货量' : 'Reorder'}</th>
            <th style={{ textAlign: 'right', padding: 6 }}>{lang === 'zh' ? '费用' : 'Cost'}</th>
            <th style={{ textAlign: 'center', padding: 6 }}>{lang === 'zh' ? '状态' : 'Status'}</th>
          </tr></thead>
          <tbody>
            {(data.auto_reorder_queue || []).map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 6, fontWeight: 600 }}>{r.product}</td>
                <td style={{ padding: 6, textAlign: 'right', color: r.current_stock <= r.reorder_point ? '#ef4444' : 'var(--text)' }}>{r.current_stock}/{r.reorder_point}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{r.recommended_qty}</td>
                <td style={{ padding: 6, textAlign: 'right', color: '#22c55e' }}>${r.estimated_cost}</td>
                <td style={{ padding: 6, textAlign: 'center' }}><span style={css.badge(r.status === 'auto_ordered' ? '#22c55e' : '#f59e0b')}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MarketingTab({ lang }) {
  const [data, setData] = useState(null);
  const [recs, setRecs] = useState(null);
  useEffect(() => { api.fetchMarketingDashboard().then(setData).catch(() => {}); }, []);
  const doOptimize = async () => { const r = await api.optimizeCampaign(); setRecs(r.recommendations || []); };
  if (!data) return <div style={{ padding: 20, color: 'var(--text3)' }}>Loading...</div>;
  const o = data.overview || {};
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { l: lang === 'zh' ? '总投放' : 'Total Spend', v: `$${(o.total_spend || 0).toLocaleString()}`, c: '#ef4444' },
          { l: lang === 'zh' ? '总收入' : 'Revenue', v: `$${(o.total_revenue || 0).toLocaleString()}`, c: '#22c55e' },
          { l: 'ROAS', v: `${o.roas}x`, c: '#3b82f6' },
          { l: 'CTR', v: `${o.ctr}%`, c: '#a855f7' },
        ].map((k, i) => (
          <div key={i} style={css.kpi(k.c)}>
            <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{k.l}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{lang === 'zh' ? '渠道分布' : 'Channel Breakdown'}</div>
          {(data.channel_breakdown || []).map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.78rem' }}>
              <span>{c.channel}</span>
              <div style={{ display: 'flex', gap: 12 }}>
                <span>${c.spend.toLocaleString()}</span>
                <span style={{ color: '#22c55e', fontWeight: 600 }}>{c.roas}x</span>
                <span style={{ color: 'var(--text3)' }}>{c.conversions} conv</span>
              </div>
            </div>
          ))}
        </div>
        <div style={css.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 700 }}>{lang === 'zh' ? 'AI 优化建议' : 'AI Optimization'}</span>
            <button onClick={doOptimize} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg,#3b82f6,#a855f7)', color: '#fff', fontSize: '.72rem', cursor: 'pointer', fontWeight: 600 }}>
              🤖 {lang === 'zh' ? '生成建议' : 'Generate'}
            </button>
          </div>
          {(recs || []).map((r, i) => (
            <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.76rem' }}>
              <div style={{ fontWeight: 600 }}>{r.action}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                <span style={css.badge('#22c55e')}>{r.expected_roas_lift || r.expected_clicks_lift || r.expected_savings || r.expected_ctr_lift || r.expected_conv_lift}</span>
                <span style={{ color: 'var(--text3)' }}>{(r.confidence * 100).toFixed(0)}% confidence</span>
              </div>
            </div>
          ))}
          {!recs && <div style={{ color: 'var(--text3)', fontSize: '.78rem', textAlign: 'center', padding: 16 }}>{lang === 'zh' ? '点击按钮获取 AI 优化建议' : 'Click to get AI recommendations'}</div>}
        </div>
      </div>

      <div style={{ ...css.card, marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>{lang === 'zh' ? '热门关键词' : 'Top Keywords'}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
            <th style={{ textAlign: 'left', padding: 6 }}>Keyword</th>
            <th style={{ textAlign: 'right', padding: 6 }}>Impressions</th>
            <th style={{ textAlign: 'right', padding: 6 }}>Clicks</th>
            <th style={{ textAlign: 'right', padding: 6 }}>CPC</th>
            <th style={{ textAlign: 'right', padding: 6 }}>Conv</th>
          </tr></thead>
          <tbody>
            {(data.top_keywords || []).map((k, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 6, fontWeight: 600 }}>{k.keyword}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{k.impressions.toLocaleString()}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{k.clicks.toLocaleString()}</td>
                <td style={{ padding: 6, textAlign: 'right', color: '#f59e0b' }}>${k.cpc}</td>
                <td style={{ padding: 6, textAlign: 'right', color: '#22c55e', fontWeight: 600 }}>{k.conversions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BITab({ lang }) {
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState(null);
  useEffect(() => { api.fetchBIOverview().then(setData).catch(() => {}); api.fetchMarketTrends().then(setTrends).catch(() => {}); }, []);
  if (!data) return <div style={{ padding: 20, color: 'var(--text3)' }}>Loading...</div>;
  const kpis = data.kpis || {};
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { l: 'GMV (MTD)', v: `$${(kpis.gmv_mtd || 0).toLocaleString()}`, c: '#22c55e', sub: `↑${kpis.gmv_growth}%` },
          { l: lang === 'zh' ? '订单数' : 'Orders', v: kpis.orders_mtd, c: '#3b82f6' },
          { l: lang === 'zh' ? '转化率' : 'Conv Rate', v: `${kpis.conversion_rate}%`, c: '#a855f7' },
          { l: lang === 'zh' ? '复购率' : 'Repeat', v: `${kpis.repeat_order_rate}%`, c: '#f59e0b' },
        ].map((k, i) => (
          <div key={i} style={css.kpi(k.c)}>
            <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{k.l}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: k.c }}>{k.v}</div>
            {k.sub && <div style={{ fontSize: '.68rem', color: '#22c55e' }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{lang === 'zh' ? '热门品类' : 'Top Categories'}</div>
          {(data.top_categories || []).map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.78rem' }}>
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <span>${c.revenue.toLocaleString()}</span>
                <span style={{ color: c.growth >= 0 ? '#22c55e' : '#ef4444' }}>{c.growth > 0 ? '+' : ''}{c.growth}%</span>
              </div>
            </div>
          ))}
        </div>
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{lang === 'zh' ? '竞争格局' : 'Competitive Landscape'}</div>
          {(data.competitor_landscape || []).map((c, i) => (
            <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>{c.name}</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{c.estimated_share}%</span>
              </div>
              <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>
                ✅ {c.strength} · ⚠️ {c.weakness}
              </div>
            </div>
          ))}
        </div>
      </div>

      {trends && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div style={css.card}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>🔥 {lang === 'zh' ? '市场趋势' : 'Market Trends'}</div>
            {(trends.trends || []).map((t, i) => (
              <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>{t.topic}</span>
                  <div>
                    <span style={css.badge('#ef4444')}>Heat: {t.heat}</span>
                    <span style={{ marginLeft: 6, color: '#22c55e', fontSize: '.7rem' }}>+{t.growth_30d}%</span>
                  </div>
                </div>
                <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginTop: 2 }}>{t.related.join(' · ')}</div>
              </div>
            ))}
          </div>
          <div style={css.card}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>⚠️ {lang === 'zh' ? '供应风险预警' : 'Supply Risk Alerts'}</div>
            {(trends.supply_risk_alerts || []).map((a, i) => (
              <div key={i} style={{ padding: '8px 10px', border: `1px solid ${SEV_COLORS[a.severity]}30`, borderRadius: 8, marginBottom: 8, background: `${SEV_COLORS[a.severity]}05`, fontSize: '.76rem' }}>
                <div style={{ fontWeight: 600 }}>{a.alert}</div>
                <div style={{ color: '#22c55e', fontSize: '.7rem', marginTop: 3 }}>→ {a.recommendation}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WarehouseTab({ lang }) {
  const [data, setData] = useState(null);
  const [routing, setRouting] = useState(null);
  useEffect(() => { api.fetchWarehouseOverview().then(setData).catch(() => {}); api.fetchWarehouseRouting('US').then(setRouting).catch(() => {}); }, []);
  if (!data) return <div style={{ padding: 20, color: 'var(--text3)' }}>Loading...</div>;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {(data.warehouses || []).map((w, i) => (
          <div key={i} style={css.card}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{w.name}</div>
            <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 8 }}>{w.location} · {w.type}</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', marginBottom: 3 }}>
                <span>{lang === 'zh' ? '容量' : 'Capacity'}</span><span>{w.capacity_pct}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3 }}>
                <div style={{ width: `${w.capacity_pct}%`, height: '100%', background: w.capacity_pct > 80 ? '#ef4444' : w.capacity_pct > 60 ? '#f59e0b' : '#22c55e', borderRadius: 3 }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: '.72rem' }}>
              <div>📥 In: {w.inbound_today}</div>
              <div>📤 Out: {w.outbound_today}</div>
              <div>📦 Items: {w.items_count}</div>
              <div>🔍 QC: {w.pending_qc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{lang === 'zh' ? '库存健康' : 'Inventory Health'}</div>
          {data.inventory_health && Object.entries(data.inventory_health).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '.78rem' }}>
              <span style={{ textTransform: 'capitalize', color: 'var(--text3)' }}>{k.replace(/_/g, ' ')}</span>
              <span style={{ fontWeight: 600 }}>{typeof v === 'number' && v > 1000 ? `$${v.toLocaleString()}` : v}</span>
            </div>
          ))}
        </div>
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>🚢 {lang === 'zh' ? '路由推荐' : 'Routing Options'}</div>
          {routing && (routing.routes || []).map((r, i) => (
            <div key={i} style={{ padding: '8px 10px', border: r.recommended ? '1px solid rgba(34,197,94,.3)' : '1px solid var(--border)', borderRadius: 8, marginBottom: 8, background: r.recommended ? 'rgba(34,197,94,.04)' : 'transparent', fontSize: '.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>{r.route}</span>
                {r.recommended && <span style={css.badge('#22c55e')}>Recommended</span>}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '.72rem', color: 'var(--text3)' }}>
                <span>🕐 {r.transit_days}d</span>
                <span>💰 ${r.cost_per_kg}/kg</span>
                <span>📊 {r.reliability}% reliable</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CrossBorderTab({ lang }) {
  const [data, setData] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [currency, setCurrency] = useState(null);
  useEffect(() => {
    api.fetchComplianceOverview().then(setData).catch(() => {});
    api.fetchContracts().then(setContracts).catch(() => {});
    api.fetchMultiCurrency().then(setCurrency).catch(() => {});
  }, []);
  if (!data) return <div style={{ padding: 20, color: 'var(--text3)' }}>Loading...</div>;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { l: lang === 'zh' ? '合规分' : 'Compliance Score', v: data.compliance_score, c: '#22c55e' },
          { l: lang === 'zh' ? '活跃合同' : 'Active Contracts', v: data.active_contracts, c: '#3b82f6' },
          { l: lang === 'zh' ? '覆盖地区' : 'Regions', v: data.regions_covered, c: '#a855f7' },
        ].map((k, i) => (
          <div key={i} style={css.kpi(k.c)}>
            <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{k.l}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>📜 {lang === 'zh' ? '法规变更' : 'Regulatory Changes'}</div>
          {(data.recent_changes || []).map((c, i) => (
            <div key={i} style={{ padding: '8px 10px', border: `1px solid ${SEV_COLORS[c.impact]}30`, borderRadius: 8, marginBottom: 8, fontSize: '.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>{c.region}</span>
                <span style={css.badge(SEV_COLORS[c.impact])}>{c.impact}</span>
              </div>
              <div style={{ color: 'var(--text2)', marginTop: 3 }}>{c.change}</div>
            </div>
          ))}
        </div>
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>💱 {lang === 'zh' ? '汇率' : 'Exchange Rates'}</div>
          {(data.currency_rates || []).map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.82rem' }}>
              <span style={{ fontWeight: 600 }}>{c.pair}</span>
              <div>
                <span style={{ fontWeight: 700 }}>{c.rate}</span>
                <span style={{ marginLeft: 8, fontSize: '.72rem', color: c.change_24h >= 0 ? '#22c55e' : '#ef4444' }}>{c.change_24h >= 0 ? '+' : ''}{c.change_24h}</span>
              </div>
            </div>
          ))}
          {currency && (
            <>
              <div style={{ fontWeight: 700, marginTop: 12, marginBottom: 6 }}>💳 {lang === 'zh' ? '支付方式' : 'Payment Methods'}</div>
              {(currency.payment_methods || []).map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '.74rem', borderBottom: '1px solid var(--border)' }}>
                  <span>{m.method}</span>
                  <span style={{ color: 'var(--text3)' }}>{m.fee_pct}% · {m.processing_days}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FBATab({ lang }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.fetchFulfillmentOptimizer().then(setData).catch(() => {}); }, []);
  if (!data) return <div style={{ padding: 20, color: 'var(--text3)' }}>Loading...</div>;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { l: lang === 'zh' ? '均履约成本' : 'Avg Fulfillment', v: `$${data.cost_analysis?.avg_fulfillment_cost}`, c: '#3b82f6' },
          { l: lang === 'zh' ? '仓储月费' : 'Storage/mo', v: `$${data.cost_analysis?.storage_cost_monthly}`, c: '#f59e0b' },
          { l: lang === 'zh' ? '均运费' : 'Avg Shipping', v: `$${data.cost_analysis?.shipping_cost_avg}`, c: '#a855f7' },
          { l: lang === 'zh' ? '退货处理' : 'Returns', v: `$${data.cost_analysis?.return_processing}`, c: '#ef4444' },
        ].map((k, i) => (
          <div key={i} style={css.kpi(k.c)}>
            <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{k.l}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div style={css.card}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>🤖 {lang === 'zh' ? 'AI 优化建议' : 'AI Optimization Suggestions'}</div>
        {(data.optimization_suggestions || []).map((s, i) => (
          <div key={i} style={{ padding: '10px 12px', border: '1px solid rgba(34,197,94,.2)', borderRadius: 8, marginBottom: 8, background: 'rgba(34,197,94,.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '.84rem' }}>{s.area}</span>
              <span style={css.badge('#22c55e')}>{s.savings}</span>
            </div>
            <div style={{ fontSize: '.76rem', margin: '4px 0' }}>
              <span style={{ color: '#ef4444' }}>Current: </span>{s.current}
            </div>
            <div style={{ fontSize: '.76rem' }}>
              <span style={{ color: '#22c55e' }}>Suggested: </span>{s.suggested}
            </div>
            <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 3 }}>Impact: {s.impact}</div>
          </div>
        ))}
      </div>

      <div style={{ ...css.card, marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>📦 {lang === 'zh' ? '履约方案对比' : 'Fulfillment Options'}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
            <th style={{ textAlign: 'left', padding: 6 }}>{lang === 'zh' ? '方案' : 'Option'}</th>
            <th style={{ textAlign: 'right', padding: 6 }}>{lang === 'zh' ? '成本/单' : 'Cost/Order'}</th>
            <th style={{ textAlign: 'right', padding: 6 }}>{lang === 'zh' ? '时效' : 'Delivery'}</th>
            <th style={{ textAlign: 'left', padding: 6 }}>{lang === 'zh' ? '适用场景' : 'Best For'}</th>
          </tr></thead>
          <tbody>
            {(data.fulfillment_options || []).map((o, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 6, fontWeight: 600 }}>{o.name}</td>
                <td style={{ padding: 6, textAlign: 'right', color: '#22c55e', fontWeight: 700 }}>${o.cost_per_order}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{o.delivery_days}d</td>
                <td style={{ padding: 6, fontSize: '.72rem', color: 'var(--text3)' }}>{o.best_for}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TAB_COMPONENTS = {
  control: ControlTowerTab,
  marketing: MarketingTab,
  bi: BITab,
  warehouse: WarehouseTab,
  crossborder: CrossBorderTab,
  fba: FBATab,
};

export default function PlatformIntelPage() {
  const { lang } = useI18n();
  const [tab, setTab] = useState('control');
  const TabComponent = TAB_COMPONENTS[tab];

  return (
    <div>
      <h2 style={{ margin: '0 0 4px' }}>🧠 {lang === 'zh' ? '平台智能中心' : 'Platform Intelligence Center'}</h2>
      <p style={{ color: 'var(--text3)', fontSize: '.82rem', margin: '0 0 16px' }}>
        {lang === 'zh' ? '对标阿里巴巴 · 京东 · Amazon · Medline · Deel 核心能力' : 'Benchmarking Alibaba · JD · Amazon · Medline · Deel core capabilities'}
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 16px', borderRadius: 8, border: tab === t.id ? '2px solid var(--accent)' : '1px solid var(--border)',
            background: tab === t.id ? 'rgba(59,130,246,.08)' : 'var(--card)',
            color: tab === t.id ? 'var(--accent)' : 'var(--text2)',
            cursor: 'pointer', fontWeight: tab === t.id ? 700 : 400, fontSize: '.8rem', whiteSpace: 'nowrap',
          }}>
            {t.icon} {lang === 'zh' ? t.zh : t.en}
          </button>
        ))}
      </div>

      {TabComponent && <TabComponent lang={lang} />}
    </div>
  );
}
