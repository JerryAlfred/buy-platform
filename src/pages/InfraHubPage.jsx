import { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const TABS = [
  { id: 'strategy', icon: '🎯', en: 'Strategy Map', zh: '战略全景' },
  { id: 'raas', icon: '🤖', en: 'RaaS Engine', zh: '机器人即服务' },
  { id: 'assets', icon: '⚙️', en: 'Asset Lifecycle', zh: '设备生命周期' },
  { id: 'finance', icon: '💰', en: 'Financial Infra', zh: '金融基础设施' },
];

const css = {
  card: { padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 },
  kpi: (c) => ({ padding: '12px 14px', background: `${c}08`, border: `1px solid ${c}20`, borderRadius: 10, textAlign: 'center' }),
  badge: (c) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '.68rem', fontWeight: 600, background: `${c}15`, color: c }),
  bar: (pct, c) => ({ width: `${pct}%`, height: 8, background: c, borderRadius: 4, transition: 'width .5s' }),
};

function StrategyTab({ lang }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.fetchStrategyOverview().then(setD).catch(() => {}); }, []);
  if (!d) return <div style={{ padding: 20, color: 'var(--text3)' }}>Loading...</div>;

  return (
    <div>
      {/* Vision */}
      <div style={{ ...css.card, marginBottom: 16, background: 'linear-gradient(135deg, rgba(59,130,246,.06), rgba(168,85,247,.06))', borderColor: 'rgba(59,130,246,.2)' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 6 }}>
          {d.positioning?.one_liner}
        </div>
        <div style={{ fontSize: '.82rem', color: 'var(--text2)', fontStyle: 'italic' }}>
          "{d.positioning?.tagline}"
        </div>
      </div>

      {/* Value Chain Control */}
      <div style={{ ...css.card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>🔗 {lang === 'zh' ? '价值链控制力' : 'Value Chain Control'}</div>
        {(d.value_chain_control || []).map((v, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '.88rem' }}>{v.layer}</span>
                <span style={{ marginLeft: 8, fontSize: '.72rem', color: 'var(--text3)' }}>{v.description}</span>
              </div>
              <span style={{ fontWeight: 800, color: v.control_pct > 70 ? '#22c55e' : v.control_pct > 50 ? '#f59e0b' : '#ef4444' }}>{v.control_pct}%</span>
            </div>
            <div style={{ width: '100%', height: 8, background: 'var(--border)', borderRadius: 4, marginBottom: 4 }}>
              <div style={css.bar(v.control_pct, v.control_pct > 70 ? '#22c55e' : v.control_pct > 50 ? '#f59e0b' : '#3b82f6')} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', color: 'var(--text3)' }}>
              <span>{lang === 'zh' ? '竞争：' : 'Comp: '}{v.competitors?.join(', ')}</span>
              <span style={{ color: '#22c55e' }}>✦ {v.our_edge}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* TAM */}
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>📊 {lang === 'zh' ? '可触达市场 (TAM)' : 'Total Addressable Market'}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.76rem' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
              <th style={{ textAlign: 'left', padding: 5 }}>Segment</th>
              <th style={{ textAlign: 'right', padding: 5 }}>TAM ($B)</th>
              <th style={{ textAlign: 'right', padding: 5 }}>Take %</th>
              <th style={{ textAlign: 'right', padding: 5 }}>Ours ($B)</th>
            </tr></thead>
            <tbody>
              {(d.tam_breakdown || []).map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: 5, fontWeight: 600 }}>{t.segment}</td>
                  <td style={{ padding: 5, textAlign: 'right' }}>${t.tam_b}</td>
                  <td style={{ padding: 5, textAlign: 'right', color: '#f59e0b' }}>{t.our_take_rate}%</td>
                  <td style={{ padding: 5, textAlign: 'right', color: '#22c55e', fontWeight: 700 }}>${t.addressable_b}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 800 }}>
                <td style={{ padding: 5 }}>Total</td>
                <td style={{ padding: 5, textAlign: 'right' }}>${(d.tam_breakdown || []).reduce((s, t) => s + t.tam_b, 0).toFixed(1)}</td>
                <td />
                <td style={{ padding: 5, textAlign: 'right', color: '#22c55e' }}>${(d.tam_breakdown || []).reduce((s, t) => s + t.addressable_b, 0).toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Moat */}
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>🏰 {lang === 'zh' ? '竞争护城河' : 'Competitive Moat'}</div>
          {(d.competitive_moat || []).map((m, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontWeight: 600, fontSize: '.8rem' }}>{m.moat}</span>
                <span style={{ fontWeight: 800, color: m.strength >= 8 ? '#22c55e' : '#f59e0b' }}>{m.strength}/10</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3, marginBottom: 2 }}>
                <div style={css.bar(m.strength * 10, m.strength >= 8 ? '#22c55e' : '#f59e0b')} />
              </div>
              <div style={{ fontSize: '.68rem', color: 'var(--text3)' }}>{m.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Evolution */}
      <div style={{ ...css.card, marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>🚀 {lang === 'zh' ? '收入进化路径' : 'Revenue Evolution'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {(d.revenue_evolution || []).map((p, i) => (
            <div key={i} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: i === 0 ? 'rgba(59,130,246,.05)' : 'transparent' }}>
              <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: 4, color: 'var(--accent)' }}>{p.phase}</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#22c55e', marginBottom: 6 }}>{p.target}</div>
              {p.revenue_streams.map((s, j) => (
                <div key={j} style={{ fontSize: '.7rem', color: 'var(--text2)', padding: '1px 0' }}>{s}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RaaSTab({ lang }) {
  const [d, setD] = useState(null);
  const [usage, setUsage] = useState([]);
  useEffect(() => { api.fetchRaaSDashboard().then(setD).catch(() => {}); api.fetchRaaSUsage().then(u => setUsage(u.metering || [])).catch(() => {}); }, []);
  if (!d) return <div style={{ padding: 20, color: 'var(--text3)' }}>Loading...</div>;
  const m = d.metrics || {};
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { l: 'MRR', v: `$${(m.mrr || 0).toLocaleString()}`, c: '#22c55e' },
          { l: 'ARR', v: `$${(m.arr || 0).toLocaleString()}`, c: '#3b82f6' },
          { l: lang === 'zh' ? '部署机器人' : 'Robots', v: m.total_robots_deployed, c: '#a855f7' },
          { l: lang === 'zh' ? '利用率' : 'Utilization', v: `${m.utilization_rate}%`, c: '#f59e0b' },
          { l: 'NRR', v: `${m.nrr}%`, c: '#22c55e' },
        ].map((k, i) => (
          <div key={i} style={css.kpi(k.c)}>
            <div style={{ fontSize: '.66rem', color: 'var(--text3)' }}>{k.l}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>💰 {lang === 'zh' ? '收入构成' : 'Revenue Breakdown'}</div>
          {(d.revenue_breakdown || []).map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '.78rem' }}>
              <span>{r.source}</span>
              <div><span style={{ fontWeight: 700 }}>${r.amount.toLocaleString()}</span><span style={{ color: 'var(--text3)', marginLeft: 6 }}>{r.share}%</span></div>
            </div>
          ))}
        </div>
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>📊 {lang === 'zh' ? 'SLA 表现' : 'SLA Performance'}</div>
          {d.sla_performance && Object.entries(d.sla_performance).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '.78rem' }}>
              <span style={{ color: 'var(--text3)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
              <span style={{ fontWeight: 600 }}>{typeof v === 'number' && v < 10 ? v.toFixed(1) : v}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Fleet */}
      <div style={{ ...css.card, marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>🤖 {lang === 'zh' ? '机器人实时状态' : 'Robot Fleet Status'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {usage.slice(0, 8).map((r, i) => (
            <div key={i} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: '.76rem' }}>{r.robot_id}</span>
                <span style={css.badge(r.status === 'running' ? '#22c55e' : r.status === 'maintenance' ? '#f59e0b' : '#6b7280')}>{r.status}</span>
              </div>
              <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{r.type} · {r.location}</div>
              <div style={{ fontSize: '.7rem', marginTop: 3 }}>
                <span style={{ color: 'var(--text3)' }}>{r.hours_mtd}h</span>
                <span style={{ marginLeft: 8, color: r.utilization > 70 ? '#22c55e' : '#f59e0b' }}>{r.utilization}%</span>
                <span style={{ marginLeft: 8 }}>❤️ {r.health_score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AssetsTab({ lang }) {
  const [lc, setLc] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  useEffect(() => { api.fetchAssetLifecycle().then(setLc).catch(() => {}); api.fetchDeploymentPipeline().then(d => setPipeline(d.pipeline || [])).catch(() => {}); }, []);
  if (!lc) return <div style={{ padding: 20, color: 'var(--text3)' }}>Loading...</div>;
  return (
    <div>
      {/* Lifecycle stages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginBottom: 16 }}>
        {Object.entries(lc.stages || {}).map(([k, v]) => (
          <div key={k} style={{ padding: '10px 12px', background: `${v.color}08`, border: `1px solid ${v.color}20`, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: v.color }}>{v.count}</div>
            <div style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'capitalize' }}>{k}</div>
            <div style={{ fontSize: '.6rem', color: 'var(--text3)' }}>{v.description}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>🔧 {lang === 'zh' ? '备件库存' : 'Spare Parts Inventory'}</div>
          {(lc.spare_parts_inventory || []).map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '.76rem' }}>
              <span style={{ fontWeight: 600 }}>{p.part}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: p.stock <= p.reorder_point ? '#ef4444' : 'var(--text)' }}>{p.stock}/{p.reorder_point}</span>
                <span style={{ color: 'var(--text3)' }}>{p.lead_days}d</span>
                <span style={{ color: '#22c55e' }}>${p.cost}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>📡 {lang === 'zh' ? '遥测摘要' : 'Telemetry Summary'}</div>
          {lc.telemetry_summary && Object.entries(lc.telemetry_summary).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '.8rem' }}>
              <span style={{ color: 'var(--text3)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
              <span style={{ fontWeight: 700 }}>{typeof v === 'number' && v > 1000 ? v.toLocaleString() : v}</span>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            {Object.entries(lc.fleet_health || {}).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '.76rem' }}>
                <span style={{ color: 'var(--text3)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                <span style={{ fontWeight: 600 }}>{typeof v === 'number' && v > 1000 ? v.toLocaleString() : v}{k.includes('pct') || k.includes('rate') ? '%' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Deployment pipeline */}
      <div style={{ ...css.card, marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>🚀 {lang === 'zh' ? '部署流水线' : 'Deployment Pipeline'}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.76rem' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
            <th style={{ textAlign: 'left', padding: 5 }}>ID</th>
            <th style={{ textAlign: 'left', padding: 5 }}>{lang === 'zh' ? '机型' : 'Robot'}</th>
            <th style={{ textAlign: 'left', padding: 5 }}>{lang === 'zh' ? '客户' : 'Customer'}</th>
            <th style={{ textAlign: 'left', padding: 5 }}>{lang === 'zh' ? '阶段' : 'Stage'}</th>
            <th style={{ textAlign: 'center', padding: 5 }}>%</th>
            <th style={{ textAlign: 'left', padding: 5 }}>ETA</th>
          </tr></thead>
          <tbody>
            {pipeline.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 5, fontWeight: 600, color: 'var(--accent)' }}>{p.id}</td>
                <td style={{ padding: 5 }}>{p.robot_type}</td>
                <td style={{ padding: 5 }}>{p.customer}</td>
                <td style={{ padding: 5 }}><span style={css.badge('#3b82f6')}>{p.stage}</span></td>
                <td style={{ padding: 5, textAlign: 'center' }}>
                  <div style={{ width: 60, height: 6, background: 'var(--border)', borderRadius: 3, display: 'inline-block' }}>
                    <div style={{ ...css.bar(p.progress_pct, '#22c55e'), height: 6 }} />
                  </div>
                  <span style={{ marginLeft: 4, fontSize: '.66rem' }}>{p.progress_pct}%</span>
                </td>
                <td style={{ padding: 5, fontSize: '.7rem', color: 'var(--text3)' }}>{p.eta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinanceTab({ lang }) {
  const [fin, setFin] = useState(null);
  const [ms, setMs] = useState(null);
  const [ins, setIns] = useState(null);
  const [risk, setRisk] = useState(null);
  const [credit, setCredit] = useState(null);
  useEffect(() => {
    api.fetchFinanceOverview().then(setFin).catch(() => {});
    api.fetchMilestonePayments().then(setMs).catch(() => {});
    api.fetchInsuranceProducts().then(setIns).catch(() => {});
    api.fetchRiskScoring().then(setRisk).catch(() => {});
    api.fetchTradeCredit().then(setCredit).catch(() => {});
  }, []);
  if (!fin) return <div style={{ padding: 20, color: 'var(--text3)' }}>Loading...</div>;
  const tv = fin.transaction_volume || {};
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { l: 'GMV (MTD)', v: `$${(tv.gmv_mtd || 0).toLocaleString()}`, c: '#22c55e', sub: `+${tv.gmv_growth_pct}%` },
          { l: lang === 'zh' ? '平台收入' : 'Platform Rev', v: `$${(tv.platform_revenue_mtd || 0).toLocaleString()}`, c: '#3b82f6' },
          { l: lang === 'zh' ? '托管中' : 'In Escrow', v: `$${(fin.payment_flows?.escrow_held || 0).toLocaleString()}`, c: '#a855f7' },
          { l: lang === 'zh' ? '授信总额' : 'Credit Extended', v: `$${(fin.financing?.total_credit_extended || 0).toLocaleString()}`, c: '#f59e0b' },
        ].map((k, i) => (
          <div key={i} style={css.kpi(k.c)}>
            <div style={{ fontSize: '.66rem', color: 'var(--text3)' }}>{k.l}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: k.c }}>{k.v}</div>
            {k.sub && <div style={{ fontSize: '.64rem', color: '#22c55e' }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Milestone templates */}
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>📋 {lang === 'zh' ? 'Milestone 付款模板' : 'Milestone Payment Templates'}</div>
          {(ms?.milestone_templates || []).map((t, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: '.82rem', marginBottom: 4 }}>{t.name}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {t.milestones.map((m, j) => (
                  <div key={j} style={{ flex: m.pct, padding: '4px 6px', background: `hsl(${210 + j * 30}, 70%, ${50 + j * 5}%)15`, borderRadius: 4, fontSize: '.64rem', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700 }}>{m.pct}%</div>
                    <div style={{ color: 'var(--text3)' }}>{m.stage}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Insurance */}
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>🛡️ {lang === 'zh' ? '保险产品' : 'Insurance Products'}</div>
          {(ins?.products || []).map((p, i) => (
            <div key={i} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 6, fontSize: '.76rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>{p.name}</span>
                <span style={css.badge('#3b82f6')}>{p.premium_pct}% premium</span>
              </div>
              <div style={{ color: 'var(--text3)', marginTop: 2 }}>{p.coverage}</div>
              <div style={{ marginTop: 3, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {p.covers.map((c, j) => <span key={j} style={{ ...css.badge('#22c55e'), fontSize: '.6rem' }}>✓ {c}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        {/* Risk scoring */}
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>📊 {lang === 'zh' ? '风控评分' : 'Risk Scoring'}</div>
          {(risk?.sample_scores || []).map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.78rem' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{s.entity}</span>
                <span style={css.badge(s.type === 'buyer' ? '#3b82f6' : '#a855f7')}>{s.type}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, color: s.score >= 80 ? '#22c55e' : s.score >= 60 ? '#f59e0b' : '#ef4444' }}>{s.score}</span>
                <span style={css.badge(s.score >= 80 ? '#22c55e' : '#f59e0b')}>{s.grade}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Trade credit */}
        <div style={css.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>💳 {lang === 'zh' ? '贸易融资产品' : 'Trade Finance Products'}</div>
          {(credit?.programs || []).map((p, i) => (
            <div key={i} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 6, fontSize: '.76rem' }}>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 3, color: 'var(--text3)' }}>
                <span>{lang === 'zh' ? '额度' : 'Max'}: ${p.max_amount.toLocaleString()}</span>
                <span>{lang === 'zh' ? '利率' : 'Rate'}: {p.interest_rate}%</span>
                <span>{lang === 'zh' ? '手续费' : 'Fee'}: {p.fee_pct}%</span>
              </div>
              <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginTop: 2 }}>{p.eligibility}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TAB_COMPONENTS = { strategy: StrategyTab, raas: RaaSTab, assets: AssetsTab, finance: FinanceTab };

export default function InfraHubPage() {
  const { lang } = useI18n();
  const [tab, setTab] = useState('strategy');
  const Comp = TAB_COMPONENTS[tab];
  return (
    <div>
      <h2 style={{ margin: '0 0 4px' }}>⚡ {lang === 'zh' ? '基础设施层' : 'Infrastructure Layer'}</h2>
      <p style={{ color: 'var(--text3)', fontSize: '.82rem', margin: '0 0 16px' }}>
        {lang === 'zh'
          ? '自动化资产的交易 · 部署 · 运营 · 融资 · 保险基础设施'
          : 'Transaction · Deployment · Operation · Financing · Insurance infrastructure for automation assets'}
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
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
      {Comp && <Comp lang={lang} />}
    </div>
  );
}
