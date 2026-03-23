import { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const TABS = [
  { id: 'events', icon: '🌍', en: 'Global Events', zh: '全球事件' },
  { id: 'resilience', icon: '🛡️', en: 'Supply Chain Resilience', zh: '供应链韧性' },
  { id: 'chains', icon: '🔗', en: 'Industry Chains', zh: '产业链影响' },
  { id: 'markets', icon: '📈', en: 'Financial Markets', zh: '金融市场' },
  { id: 'signals', icon: '🎯', en: 'Trading Signals', zh: '套利信号' },
  { id: 'playbook', icon: '📚', en: 'Historical Playbook', zh: '历史剧本' },
];

const c = {
  card: { padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 },
  kpi: (cl) => ({ padding: '10px 12px', background: `${cl}08`, border: `1px solid ${cl}20`, borderRadius: 10, textAlign: 'center' }),
  badge: (cl) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '.66rem', fontWeight: 600, background: `${cl}15`, color: cl }),
  bar: (pct, cl) => ({ width: `${Math.min(pct, 100)}%`, height: 7, background: cl, borderRadius: 4, transition: 'width .5s' }),
  sevColor: (s) => s >= 8 ? '#ef4444' : s >= 6 ? '#f59e0b' : s >= 4 ? '#3b82f6' : '#22c55e',
  changeColor: (v) => v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : 'var(--text3)',
};

/* ═══════ 1. EVENTS ═══════ */
function EventsTab({ lang }) {
  const [events, setEvents] = useState([]);
  const [sel, setSel] = useState(null);
  const [filter, setFilter] = useState({ severity_min: 0, category: '' });
  useEffect(() => { api.fetchGeoEvents(filter).then(d => setEvents(d.events || [])).catch(() => {}); }, [filter]);
  const cats = ['', 'trade_war', 'conflict', 'sanctions', 'natural_disaster', 'supply_disruption', 'economic_policy', 'cyber_attack', 'trade_agreement'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={filter.category} onChange={e => setFilter({ ...filter, category: e.target.value })} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.78rem' }}>
          {cats.map(ca => <option key={ca} value={ca}>{ca || (lang === 'zh' ? '全部类型' : 'All types')}</option>)}
        </select>
        <select value={filter.severity_min} onChange={e => setFilter({ ...filter, severity_min: Number(e.target.value) })} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.78rem' }}>
          {[0, 5, 6, 7, 8, 9].map(s => <option key={s} value={s}>{s === 0 ? (lang === 'zh' ? '全部严重度' : 'All severity') : `≥ ${s}`}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: sel ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div>
          {events.map(ev => (
            <div key={ev.id} onClick={() => setSel(ev)} style={{ ...c.card, marginBottom: 8, cursor: 'pointer', borderLeft: `4px solid ${c.sevColor(ev.severity)}`, background: sel?.id === ev.id ? 'rgba(59,130,246,.06)' : 'var(--card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ ...c.badge(c.sevColor(ev.severity)), fontSize: '.72rem' }}>{ev.severity}/10</span>
                  <span style={c.badge('#3b82f6')}>{ev.category.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: '.68rem', color: 'var(--text3)' }}>{ev.region}</span>
                </div>
                <span style={{ fontSize: '.64rem', color: 'var(--text3)' }}>{ev.ts?.slice(0, 16)}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '.86rem', marginBottom: 3 }}>{ev.title}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text2)' }}>{ev.summary?.slice(0, 120)}...</div>
            </div>
          ))}
        </div>
        {sel && (
          <div style={c.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ ...c.badge(c.sevColor(sel.severity)), fontSize: '.8rem' }}>Severity {sel.severity}/10</span>
              <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>✕</button>
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '.94rem' }}>{sel.title}</h3>
            <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginBottom: 10 }}>{sel.summary}</div>
            <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 10 }}>{lang === 'zh' ? '来源' : 'Sources'}: {sel.sources?.join(' · ')}</div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: '.76rem', marginBottom: 4 }}>{lang === 'zh' ? '受影响产业' : 'Affected Industries'}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{sel.affected_industries?.map(ind => <span key={ind} style={c.badge('#f59e0b')}>{ind}</span>)}</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: '.76rem', marginBottom: 4 }}>{lang === 'zh' ? '受影响大宗商品' : 'Affected Commodities'}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{sel.affected_commodities?.map(cm => <span key={cm} style={c.badge('#a855f7')}>{cm}</span>)}</div>
            </div>
            {sel.market_reaction && (
              <div>
                <div style={{ fontWeight: 600, fontSize: '.76rem', marginBottom: 4 }}>{lang === 'zh' ? '市场反应' : 'Market Reaction'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
                  {Object.entries(sel.market_reaction).map(([k, v]) => (
                    <div key={k} style={{ padding: '4px 6px', background: 'var(--bg)', borderRadius: 4, fontSize: '.7rem', textAlign: 'center' }}>
                      <div style={{ color: 'var(--text3)' }}>{k.replace(/_/g, ' ')}</div>
                      <div style={{ fontWeight: 700, color: c.changeColor(v) }}>{v > 0 ? '+' : ''}{v}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════ 2. RESILIENCE ═══════ */
function ResilienceTab({ lang }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.fetchResilience().then(setD).catch(() => {}); }, []);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        <div style={c.kpi(d.global_resilience_index > 60 ? '#22c55e' : '#f59e0b')}>
          <div style={{ fontSize: '.66rem', color: 'var(--text3)' }}>{lang === 'zh' ? '全球韧性指数' : 'Global Resilience'}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: d.global_resilience_index > 60 ? '#22c55e' : '#f59e0b' }}>{d.global_resilience_index}</div>
          <div style={{ fontSize: '.64rem', color: '#ef4444' }}>↓ {d.trend}</div>
        </div>
        <div style={c.kpi('#ef4444')}>
          <div style={{ fontSize: '.66rem', color: 'var(--text3)' }}>{lang === 'zh' ? '活跃中断' : 'Active Disruptions'}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>{d.active_disruptions}</div>
        </div>
        <div style={c.kpi('#3b82f6')}>
          <div style={{ fontSize: '.66rem', color: 'var(--text3)' }}>{lang === 'zh' ? '监控区域' : 'Regions Monitored'}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>{d.regions?.length}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {(d.regions || []).map(r => (
          <div key={r.region} style={{ ...c.card, borderTop: `3px solid ${c.sevColor(r.risk_score / 10)}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 800, fontSize: '.9rem' }}>{r.region}</span>
              <span style={{ fontWeight: 800, color: c.sevColor(r.risk_score / 10) }}>{r.risk_score}</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3, marginBottom: 6 }}>
              <div style={{ ...c.bar(r.risk_score, c.sevColor(r.risk_score / 10)), height: 6 }} />
            </div>
            <div style={{ fontSize: '.68rem', marginBottom: 4 }}>
              <span style={c.badge(r.trend === 'worsening' || r.trend === 'critical' ? '#ef4444' : r.trend === 'improving' ? '#22c55e' : '#f59e0b')}>{r.trend}</span>
              <span style={{ marginLeft: 6, color: 'var(--text3)' }}>+{r.freight_delay_days}d delay</span>
            </div>
            {r.key_risks?.map((risk, i) => <div key={i} style={{ fontSize: '.68rem', color: 'var(--text2)', padding: '1px 0' }}>• {risk}</div>)}
            <div style={{ marginTop: 4, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {r.industries_at_risk?.map(ind => <span key={ind} style={c.badge('#f59e0b')}>{ind}</span>)}
            </div>
          </div>
        ))}
      </div>
      <div style={c.card}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>🚢 {lang === 'zh' ? '航运路线状态' : 'Shipping Routes'}</div>
        {(d.shipping_routes || []).map((rt, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.78rem' }}>
            <span style={{ fontWeight: 600 }}>{rt.route}</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: 'var(--text3)' }}>{rt.normal_days}d → <span style={{ color: '#ef4444', fontWeight: 700 }}>{rt.current_days}d</span></span>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>+{rt.cost_increase_pct}% cost</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════ 3. INDUSTRY CHAINS ═══════ */
function ChainsTab({ lang }) {
  const [d, setD] = useState(null);
  const [sel, setSel] = useState(null);
  useEffect(() => { api.fetchIndustryChains().then(setD).catch(() => {}); }, []);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;
  const chains = d.chains || [];
  const active = sel ? chains.find(ch => ch.id === sel) : null;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {chains.map(ch => (
          <button key={ch.id} onClick={() => setSel(ch.id)} style={{
            padding: '10px 16px', borderRadius: 10, border: sel === ch.id ? '2px solid var(--accent)' : '1px solid var(--border)',
            background: sel === ch.id ? 'rgba(59,130,246,.08)' : 'var(--card)', cursor: 'pointer',
            fontWeight: sel === ch.id ? 700 : 400, fontSize: '.8rem', color: sel === ch.id ? 'var(--accent)' : 'var(--text2)',
          }}>
            {ch.icon} {ch.name} <span style={{ marginLeft: 4, fontWeight: 800, color: c.sevColor(ch.overall_risk / 10) }}>{ch.overall_risk}</span>
          </button>
        ))}
      </div>
      {active ? (
        <div>
          <div style={{ ...c.card, marginBottom: 12, borderLeft: `4px solid ${c.sevColor(active.overall_risk / 10)}` }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 4 }}>{active.icon} {active.name}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginBottom: 8 }}>{lang === 'zh' ? '总体风险' : 'Overall Risk'}: <span style={{ fontWeight: 800, color: c.sevColor(active.overall_risk / 10) }}>{active.overall_risk}/100</span></div>
            <div style={{ fontWeight: 600, fontSize: '.82rem', marginBottom: 8 }}>{lang === 'zh' ? '关键节点' : 'Critical Nodes'}</div>
            {active.critical_nodes?.map((node, i) => (
              <div key={i} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '.84rem' }}>{node.node}</span>
                    <span style={{ marginLeft: 8, fontSize: '.68rem', color: 'var(--text3)' }}>{node.location}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={c.badge('#3b82f6')}>{node.market_share_pct}% share</span>
                    <span style={c.badge(c.sevColor(node.risk / 10))}>Risk {node.risk}</span>
                    <span style={c.badge(node.substitutability === 'none' || node.substitutability === 'very_low' ? '#ef4444' : '#f59e0b')}>Sub: {node.substitutability}</span>
                  </div>
                </div>
                <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{lang === 'zh' ? '下游' : 'Downstream'}: {node.downstream?.join(', ')}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={c.card}>
              <div style={{ fontWeight: 600, fontSize: '.82rem', marginBottom: 6 }}>⚠️ {lang === 'zh' ? '近期中断' : 'Recent Disruptions'}</div>
              {active.recent_disruptions?.map((rd, i) => <div key={i} style={{ padding: '4px 0', fontSize: '.76rem', borderBottom: '1px solid var(--border)' }}>• {rd}</div>)}
            </div>
            <div style={c.card}>
              <div style={{ fontWeight: 600, fontSize: '.82rem', marginBottom: 6 }}>🛡️ {lang === 'zh' ? '对冲策略' : 'Hedging Strategies'}</div>
              {active.hedging_strategies?.map((hs, i) => <div key={i} style={{ padding: '4px 0', fontSize: '.76rem', borderBottom: '1px solid var(--border)' }}>✓ {hs}</div>)}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>{lang === 'zh' ? '选择一条产业链查看详情' : 'Select an industry chain to view details'}</div>
      )}
    </div>
  );
}

/* ═══════ 4. MARKETS ═══════ */
function MarketsTab({ lang }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.fetchMarkets().then(setD).catch(() => {}); }, []);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;

  const MarketGroup = ({ title, items }) => (
    <div style={c.card}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {items?.map(m => (
        <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '.78rem' }}>
          <span style={{ fontWeight: 600 }}>{m.name}</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <span>{typeof m.price === 'number' ? (m.price > 1000 ? m.price.toLocaleString() : m.price) : m.price}</span>
            <span style={{ fontWeight: 700, color: c.changeColor(m.change_pct), minWidth: 55, textAlign: 'right' }}>{m.change_pct > 0 ? '+' : ''}{m.change_pct}%</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        <div style={c.kpi(d.fear_greed_index < 35 ? '#ef4444' : d.fear_greed_index < 55 ? '#f59e0b' : '#22c55e')}>
          <div style={{ fontSize: '.64rem', color: 'var(--text3)' }}>Fear & Greed</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: d.fear_greed_index < 35 ? '#ef4444' : '#f59e0b' }}>{d.fear_greed_index}</div>
          <div style={{ fontSize: '.6rem' }}>{d.fear_greed_index < 25 ? 'Extreme Fear' : d.fear_greed_index < 45 ? 'Fear' : 'Neutral'}</div>
        </div>
        <div style={c.kpi(d.vix > 25 ? '#ef4444' : '#f59e0b')}>
          <div style={{ fontSize: '.64rem', color: 'var(--text3)' }}>VIX</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: d.vix > 25 ? '#ef4444' : '#f59e0b' }}>{d.vix}</div>
        </div>
        <div style={c.kpi(d.global_supply_chain_pressure_index > 1 ? '#ef4444' : '#22c55e')}>
          <div style={{ fontSize: '.64rem', color: 'var(--text3)' }}>Supply Chain Pressure</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: d.global_supply_chain_pressure_index > 1 ? '#ef4444' : '#22c55e' }}>{d.global_supply_chain_pressure_index}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <MarketGroup title="📊 Equities" items={d.equities} />
        <MarketGroup title="🪙 Commodities" items={d.commodities} />
        <MarketGroup title="💱 Forex" items={d.forex} />
        <div>
          <MarketGroup title="🏦 Bonds" items={d.bonds} />
          <div style={{ marginTop: 12 }}><MarketGroup title="₿ Crypto" items={d.crypto} /></div>
        </div>
      </div>
    </div>
  );
}

/* ═══════ 5. SIGNALS ═══════ */
function SignalsTab({ lang }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.fetchTradingSignals().then(setD).catch(() => {}); }, []);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;
  const dirColor = { long: '#22c55e', short: '#ef4444' };

  return (
    <div>
      {(d.signals || []).map(sig => (
        <div key={sig.id} style={{ ...c.card, marginBottom: 12, borderLeft: `4px solid ${sig.confidence > 75 ? '#22c55e' : '#f59e0b'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '.86rem' }}>{sig.id}</span>
              <span style={c.badge('#3b82f6')}>{sig.type.replace(/_/g, ' ')}</span>
              <span style={c.badge('#a855f7')}>{sig.timeframe}</span>
            </div>
            <span style={{ fontWeight: 800, color: sig.confidence > 75 ? '#22c55e' : '#f59e0b' }}>{sig.confidence}%</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 4 }}>{sig.thesis}</div>
          <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 8 }}>Trigger: {sig.trigger_event}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 8 }}>
            {sig.trades?.map((tr, i) => (
              <div key={i} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, background: `${dirColor[tr.direction]}05` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: '.78rem' }}>{tr.instrument}</span>
                  <span style={c.badge(dirColor[tr.direction])}>{tr.direction.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: '.7rem', color: 'var(--text3)', marginBottom: 3 }}>{tr.rationale}</div>
                <div style={{ fontWeight: 800, color: dirColor[tr.direction], fontSize: '.84rem' }}>{tr.target_pct > 0 ? '+' : ''}{tr.target_pct}%</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '.72rem', color: '#ef4444' }}>⚠️ {sig.risk}</div>
        </div>
      ))}
      <div style={c.card}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>🛡️ {lang === 'zh' ? '组合对冲建议' : 'Portfolio Hedge Recommendations'}</div>
        {(d.portfolio_hedge_recommendations || []).map((h, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.78rem' }}>
            <div><span style={{ fontWeight: 600 }}>{h.scenario}</span><span style={{ marginLeft: 8, color: 'var(--text3)' }}>{h.hedge}</span></div>
            <span style={c.badge('#f59e0b')}>{h.cost_pct}% cost</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════ 6. PLAYBOOK ═══════ */
function PlaybookTab({ lang }) {
  const [d, setD] = useState(null);
  const [sel, setSel] = useState(null);
  useEffect(() => { api.fetchPlaybook().then(setD).catch(() => {}); }, []);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;

  return (
    <div>
      {d.pattern_matching && (
        <div style={{ ...c.card, marginBottom: 16, background: 'linear-gradient(135deg, rgba(239,68,68,.05), rgba(245,158,11,.05))', borderColor: 'rgba(239,68,68,.2)' }}>
          <div style={{ fontWeight: 800, fontSize: '.92rem', marginBottom: 4 }}>🔮 {lang === 'zh' ? '当前形势最相似于' : 'Current Situation Most Similar To'}:</div>
          <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>{d.pattern_matching.current_most_similar_to}</div>
          <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{lang === 'zh' ? '相似度' : 'Similarity'}: <span style={{ fontWeight: 700 }}>{d.pattern_matching.similarity_score}%</span></div>
          <div style={{ fontSize: '.76rem', color: 'var(--text2)', marginTop: 6, padding: '8px 10px', background: 'var(--card)', borderRadius: 6 }}>
            📋 {d.pattern_matching.recommended_playbook}
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: sel ? '1fr 2fr' : 'repeat(3,1fr)', gap: 12 }}>
        {!sel && (d.crises || []).map(cr => (
          <div key={cr.id} onClick={() => setSel(cr)} style={{ ...c.card, cursor: 'pointer', borderTop: `3px solid ${c.sevColor(cr.severity)}` }}>
            <div style={{ fontWeight: 800, fontSize: '.92rem', marginBottom: 4 }}>{cr.id}</div>
            <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 4 }}>{cr.period} · {cr.category}</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <span style={c.badge(c.sevColor(cr.severity))}>Severity {cr.severity}/10</span>
              <span style={c.badge('#3b82f6')}>{cr.duration_months}mo</span>
            </div>
            <div style={{ fontSize: '.7rem', color: 'var(--text2)' }}>{cr.supply_chain_impact?.description?.slice(0, 100)}...</div>
          </div>
        ))}
        {sel && (
          <>
            <div>
              {(d.crises || []).map(cr => (
                <div key={cr.id} onClick={() => setSel(cr)} style={{ ...c.card, cursor: 'pointer', marginBottom: 8, borderLeft: sel.id === cr.id ? '4px solid var(--accent)' : '1px solid var(--border)', background: sel.id === cr.id ? 'rgba(59,130,246,.05)' : 'var(--card)' }}>
                  <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{cr.id}</div>
                  <div style={{ fontSize: '.68rem', color: 'var(--text3)' }}>{cr.period}</div>
                </div>
              ))}
            </div>
            <div style={c.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>{sel.id}</h3>
                <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>✕</button>
              </div>
              <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginBottom: 8 }}>{sel.period} · {sel.category} · Severity {sel.severity}/10</div>
              <div style={{ fontWeight: 700, fontSize: '.84rem', marginBottom: 6 }}>{lang === 'zh' ? '供应链影响' : 'Supply Chain Impact'}</div>
              <div style={{ fontSize: '.76rem', color: 'var(--text2)', marginBottom: 8 }}>{sel.supply_chain_impact?.description}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {sel.supply_chain_impact && Object.entries(sel.supply_chain_impact).filter(([k]) => k !== 'description' && k !== 'industries_most_affected').map(([k, v]) => (
                  <div key={k} style={{ padding: '4px 6px', background: 'var(--bg)', borderRadius: 4, fontSize: '.72rem' }}>
                    <div style={{ color: 'var(--text3)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</div>
                    <div style={{ fontWeight: 700 }}>{typeof v === 'number' ? (k.includes('pct') ? `${v}%` : v) : v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontWeight: 700, fontSize: '.84rem', marginBottom: 6 }}>{lang === 'zh' ? '市场影响' : 'Market Impact'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                {sel.market_impact && Object.entries(sel.market_impact).filter(([k]) => !k.includes('trades')).map(([k, v]) => (
                  <div key={k} style={{ padding: '4px 6px', background: 'var(--bg)', borderRadius: 4, fontSize: '.72rem' }}>
                    <div style={{ color: 'var(--text3)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</div>
                    <div style={{ fontWeight: 700, color: c.changeColor(v) }}>{typeof v === 'number' ? (v > 0 ? '+' : '') + v + '%' : v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div style={{ padding: '8px 10px', background: 'rgba(34,197,94,.05)', borderRadius: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: '.76rem', color: '#22c55e', marginBottom: 4 }}>✅ {lang === 'zh' ? '最佳交易' : 'Best Trades'}</div>
                  {sel.market_impact?.best_trades?.map((t, i) => <div key={i} style={{ fontSize: '.72rem', padding: '2px 0' }}>{t}</div>)}
                </div>
                <div style={{ padding: '8px 10px', background: 'rgba(239,68,68,.05)', borderRadius: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: '.76rem', color: '#ef4444', marginBottom: 4 }}>❌ {lang === 'zh' ? '最差交易' : 'Worst Trades'}</div>
                  {sel.market_impact?.worst_trades?.map((t, i) => <div key={i} style={{ fontSize: '.72rem', padding: '2px 0' }}>{t}</div>)}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '.84rem', marginBottom: 6 }}>💡 {lang === 'zh' ? '经验教训' : 'Lessons Learned'}</div>
              {sel.lessons?.map((l, i) => <div key={i} style={{ fontSize: '.76rem', padding: '3px 0' }}>• {l}</div>)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const TAB_COMPS = { events: EventsTab, resilience: ResilienceTab, chains: ChainsTab, markets: MarketsTab, signals: SignalsTab, playbook: PlaybookTab };

export default function GeoIntelPage() {
  const { lang } = useI18n();
  const [tab, setTab] = useState('events');
  const Comp = TAB_COMPS[tab];
  return (
    <div>
      <h2 style={{ margin: '0 0 4px' }}>🌐 {lang === 'zh' ? '天眼 · 全球地缘情报' : 'Sky Eye · Global GeoIntelligence'}</h2>
      <p style={{ color: 'var(--text3)', fontSize: '.82rem', margin: '0 0 16px' }}>
        {lang === 'zh'
          ? '地缘政治 · 供应链韧性 · 产业链影响 · 金融市场 · 套利信号 · 历史追溯'
          : 'Geopolitics · Supply Chain Resilience · Industry Impact · Markets · Trading Signals · Historical Playbook'}
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
