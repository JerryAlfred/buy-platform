import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const TABS = [
  { id: 'live', icon: '📡', en: 'Live Dashboard', zh: '实时数据' },
  { id: 'events', icon: '🌍', en: 'Global Events', zh: '全球事件' },
  { id: 'alerts', icon: '🚨', en: 'Alert Center', zh: '预警中心' },
  { id: 'resilience', icon: '🛡️', en: 'Supply Chain Resilience', zh: '供应链韧性' },
  { id: 'chains', icon: '🔗', en: 'Industry Chains', zh: '产业链影响' },
  { id: 'ext_chains', icon: '🏭', en: 'Extended Chains', zh: '扩展产业链' },
  { id: 'markets', icon: '📈', en: 'Live Markets', zh: '实时行情' },
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
  lvlColor: (l) => l === 'critical' ? '#ef4444' : l === 'high' ? '#f59e0b' : l === 'medium' ? '#3b82f6' : '#22c55e',
  liveBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '.62rem', fontWeight: 700, background: '#22c55e15', color: '#22c55e', animation: 'pulse 2s infinite' },
};

/* ═══════ 0. LIVE DASHBOARD ═══════ */
function LiveDashboardTab({ lang }) {
  const [dash, setDash] = useState(null);
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Promise.all([
      api.fetchLiveDashboard().catch(() => null),
      api.fetchLiveNews({}).catch(() => null),
    ]).then(([d, n]) => { setDash(d); setNews(n); setLoading(false); });
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

  if (loading) return <p style={{ color: 'var(--text3)' }}>Loading live data...</p>;

  const gdelt = dash?.live_sources?.gdelt || {};
  const prices = dash?.live_sources?.market_prices || {};
  const fx = dash?.live_sources?.fx_rates || {};
  const alertSum = dash?.alerts_summary || {};

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <span style={c.liveBadge}>LIVE</span>
        <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{lang === 'zh' ? '数据每60秒自动刷新' : 'Auto-refresh every 60s'} · {dash?.fetched_at?.slice(11, 19)} UTC</span>
        <button onClick={load} style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer', fontSize: '.72rem' }}>🔄 Refresh</button>
      </div>

      {alertSum.critical_unread > 0 && (
        <div style={{ ...c.card, marginBottom: 12, background: 'rgba(239,68,68,.06)', borderColor: 'rgba(239,68,68,.3)', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontWeight: 800, color: '#ef4444', marginBottom: 4 }}>🚨 {alertSum.critical_unread} Critical Alert{alertSum.critical_unread > 1 ? 's' : ''} Unread</div>
          {alertSum.latest?.filter(a => a.level === 'critical').map(a => (
            <div key={a.id} style={{ fontSize: '.78rem', padding: '3px 0' }}>• {a.title}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={c.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 700 }}>🌍 GDELT {lang === 'zh' ? '实时事件' : 'Live Events'}</span>
            <span style={{ ...c.badge('#22c55e'), fontSize: '.58rem' }}>{gdelt.source || 'GDELT'}</span>
          </div>
          {(gdelt.articles || []).map((a, i) => (
            <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.76rem' }}>
              <a href={a.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>{a.title?.slice(0, 90)}</a>
              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                <span style={{ color: 'var(--text3)', fontSize: '.64rem' }}>{a.source}</span>
                <span style={{ color: 'var(--text3)', fontSize: '.64rem' }}>{a.country}</span>
                {a.tone && <span style={{ fontSize: '.64rem', color: a.tone < -3 ? '#ef4444' : a.tone > 3 ? '#22c55e' : 'var(--text3)' }}>Tone: {typeof a.tone === 'number' ? a.tone.toFixed(1) : a.tone}</span>}
              </div>
            </div>
          ))}
        </div>

        <div style={c.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 700 }}>📰 {lang === 'zh' ? '实时新闻' : 'Live News'}</span>
            <span style={{ ...c.badge('#3b82f6'), fontSize: '.58rem' }}>{news?.source || 'News'}</span>
          </div>
          {(news?.articles || []).map((a, i) => (
            <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.76rem' }}>
              <a href={a.url} target="_blank" rel="noreferrer" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }}>{a.title?.slice(0, 90)}</a>
              <div style={{ fontSize: '.64rem', color: 'var(--text3)' }}>{a.source} · {a.published?.slice(0, 10)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div style={c.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 700 }}>📊 {lang === 'zh' ? '实时行情' : 'Live Market Prices'}</span>
            <span style={{ ...c.badge('#22c55e'), fontSize: '.58rem' }}>{prices.source || 'Yahoo Finance'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {(prices.quotes || []).map(q => (
              <div key={q.symbol} style={{ padding: '6px 8px', background: 'var(--bg)', borderRadius: 6, fontSize: '.72rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>{q.name?.slice(0, 12)}</span>
                  <span style={{ fontWeight: 700, color: c.changeColor(q.change_pct) }}>{q.change_pct > 0 ? '+' : ''}{q.change_pct}%</span>
                </div>
                <div style={{ color: 'var(--text3)', fontSize: '.66rem' }}>{q.symbol} · {typeof q.price === 'number' ? q.price.toLocaleString() : q.price}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={c.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 700 }}>💱 {lang === 'zh' ? '实时汇率' : 'Live FX Rates'}</span>
            <span style={{ ...c.badge('#a855f7'), fontSize: '.58rem' }}>{fx.source || 'ExchangeRate API'}</span>
          </div>
          <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginBottom: 6 }}>Base: {fx.base || 'USD'} · {fx.total_currencies || 0} currencies</div>
          {Object.entries(fx.rates || {}).map(([cur, rate]) => (
            <div key={cur} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: '.76rem' }}>
              <span style={{ fontWeight: 600 }}>{cur}</span>
              <span>{rate}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, fontSize: '.68rem', color: 'var(--text3)', display: 'flex', gap: 16 }}>
        <span>📡 GDELT: {dash?.data_freshness?.gdelt}</span>
        <span>📊 Prices: {dash?.data_freshness?.market_prices}</span>
        <span>💱 FX: {dash?.data_freshness?.fx_rates}</span>
        <span>📰 News: {dash?.data_freshness?.news}</span>
      </div>
    </div>
  );
}

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

/* ═══════ 2. ALERT CENTER ═══════ */
function AlertCenterTab({ lang }) {
  const [alerts, setAlerts] = useState([]);
  const [rules, setRules] = useState([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState({ level: '', status: '' });
  const [showRules, setShowRules] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookResult, setWebhookResult] = useState(null);

  useEffect(() => {
    api.fetchLiveAlerts(filter).then(d => { setAlerts(d.alerts || []); setUnread(d.unread || 0); }).catch(() => {});
    api.fetchAlertRules().then(d => setRules(d.rules || [])).catch(() => {});
  }, [filter]);

  const markRead = async (id) => {
    await api.markAlertRead(id).catch(() => {});
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'read' } : a));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const testWH = async () => {
    if (!webhookUrl) return;
    const res = await api.testWebhook({ url: webhookUrl, message: 'Test from GeoIntel Sky Eye Alert Center' }).catch(() => ({ success: false }));
    setWebhookResult(res);
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        <div style={c.kpi('#ef4444')}>
          <div style={{ fontSize: '.64rem', color: 'var(--text3)' }}>{lang === 'zh' ? '未读预警' : 'Unread Alerts'}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444' }}>{unread}</div>
        </div>
        <div style={c.kpi('#ef4444')}>
          <div style={{ fontSize: '.64rem', color: 'var(--text3)' }}>Critical</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>{alerts.filter(a => a.level === 'critical').length}</div>
        </div>
        <div style={c.kpi('#f59e0b')}>
          <div style={{ fontSize: '.64rem', color: 'var(--text3)' }}>High</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{alerts.filter(a => a.level === 'high').length}</div>
        </div>
        <div style={c.kpi('#3b82f6')}>
          <div style={{ fontSize: '.64rem', color: 'var(--text3)' }}>Medium</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6' }}>{alerts.filter(a => a.level === 'medium').length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={filter.level} onChange={e => setFilter(f => ({ ...f, level: e.target.value }))} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.76rem' }}>
          <option value="">{lang === 'zh' ? '全部级别' : 'All Levels'}</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.76rem' }}>
          <option value="">{lang === 'zh' ? '全部状态' : 'All Status'}</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        <button onClick={() => setShowRules(!showRules)} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: showRules ? 'rgba(59,130,246,.08)' : 'var(--card)', cursor: 'pointer', fontSize: '.76rem', fontWeight: showRules ? 700 : 400 }}>
          ⚙️ {lang === 'zh' ? '预警规则' : 'Alert Rules'} ({rules.length})
        </button>
      </div>

      {showRules && (
        <div style={{ ...c.card, marginBottom: 16, borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>⚙️ {lang === 'zh' ? '预警规则配置' : 'Alert Rules Configuration'}</div>
          {rules.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.76rem' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{r.id}</span>
                <span style={{ marginLeft: 8 }}>{r.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={c.badge(c.lvlColor(r.level))}>{r.level}</span>
                {r.channels.map(ch => <span key={ch} style={c.badge('#3b82f6')}>{ch}</span>)}
                <span style={c.badge(r.active ? '#22c55e' : '#6b7280')}>{r.active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, fontSize: '.78rem', marginBottom: 6 }}>🔗 {lang === 'zh' ? '测试 Webhook 推送' : 'Test Webhook Push'}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://hooks.slack.com/..." style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.76rem' }} />
              <button onClick={testWH} style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '.76rem', fontWeight: 600 }}>Test</button>
            </div>
            {webhookResult && <div style={{ marginTop: 4, fontSize: '.72rem', color: webhookResult.success ? '#22c55e' : '#ef4444' }}>{webhookResult.success ? '✅ Webhook test successful' : `❌ Failed: ${webhookResult.error || 'Unknown error'}`}</div>}
          </div>
        </div>
      )}

      <div>
        {alerts.map(a => (
          <div key={a.id} style={{ ...c.card, marginBottom: 8, borderLeft: `4px solid ${c.lvlColor(a.level)}`, opacity: a.status === 'read' ? 0.7 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={c.badge(c.lvlColor(a.level))}>{a.level.toUpperCase()}</span>
                <span style={c.badge('#6b7280')}>{a.rule_id}</span>
                {a.status === 'unread' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: '.64rem', color: 'var(--text3)' }}>{a.timestamp?.slice(0, 19)}</span>
                {a.status === 'unread' && (
                  <button onClick={() => markRead(a.id)} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: '.64rem' }}>Mark read</button>
                )}
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: '.86rem', marginBottom: 4 }}>{a.title}</div>
            <div style={{ fontSize: '.74rem', color: 'var(--text2)', marginBottom: 6 }}>{a.message}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {a.related_assets?.map(asset => <span key={asset} style={c.badge('#a855f7')}>{asset}</span>)}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {a.channels_sent?.map(ch => <span key={ch} style={{ ...c.badge('#6b7280'), fontSize: '.58rem' }}>{ch}</span>)}
              </div>
            </div>
            {a.recommended_action && (
              <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(59,130,246,.06)', borderRadius: 6, fontSize: '.72rem' }}>
                💡 <strong>{lang === 'zh' ? '建议操作' : 'Action'}</strong>: {a.recommended_action}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════ 2b. RESILIENCE ═══════ */
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

/* ═══════ 3. INDUSTRY CHAINS (original 5) ═══════ */
function ChainsTab({ lang }) {
  const [d, setD] = useState(null);
  const [sel, setSel] = useState(null);
  useEffect(() => { api.fetchIndustryChains().then(setD).catch(() => {}); }, []);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;
  const chains = d.chains || [];
  const active = sel ? chains.find(ch => ch.id === sel) : null;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
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
      {active ? <ChainDetail chain={active} lang={lang} onClose={() => setSel(null)} /> : (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>{lang === 'zh' ? '选择一条产业链查看详情' : 'Select an industry chain'}</div>
      )}
    </div>
  );
}

/* ═══════ 3b. EXTENDED INDUSTRY CHAINS ═══════ */
function ExtChainsTab({ lang }) {
  const [d, setD] = useState(null);
  const [sel, setSel] = useState(null);
  useEffect(() => { api.fetchExtendedChains().then(setD).catch(() => {}); }, []);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;
  const chains = d.chains || [];
  const active = sel ? chains.find(ch => ch.id === sel) : null;

  return (
    <div>
      <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(59,130,246,.06)', borderRadius: 8, fontSize: '.76rem', color: 'var(--accent)' }}>
        🆕 {lang === 'zh' ? '新增5大产业链：医疗器械、稀土/关键矿产、能源/LNG、食品饮料、服装纺织' : '5 new industry chains: Medical Devices, Rare Earth, Energy/LNG, Food & Beverage, Textiles'}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
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
      {active ? <ChainDetail chain={active} lang={lang} onClose={() => setSel(null)} /> : (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>{lang === 'zh' ? '选择一条产业链查看详情' : 'Select an industry chain'}</div>
      )}
    </div>
  );
}

function ChainDetail({ chain, lang }) {
  return (
    <div>
      <div style={{ ...c.card, marginBottom: 12, borderLeft: `4px solid ${c.sevColor(chain.overall_risk / 10)}` }}>
        <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 4 }}>{chain.icon} {chain.name}</div>
        <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginBottom: 8 }}>{lang === 'zh' ? '总体风险' : 'Overall Risk'}: <span style={{ fontWeight: 800, color: c.sevColor(chain.overall_risk / 10) }}>{chain.overall_risk}/100</span></div>
        <div style={{ fontWeight: 600, fontSize: '.82rem', marginBottom: 8 }}>{lang === 'zh' ? '关键节点' : 'Critical Nodes'}</div>
        {chain.critical_nodes?.map((node, i) => (
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
          {chain.recent_disruptions?.map((rd, i) => <div key={i} style={{ padding: '4px 0', fontSize: '.76rem', borderBottom: '1px solid var(--border)' }}>• {rd}</div>)}
        </div>
        <div style={c.card}>
          <div style={{ fontWeight: 600, fontSize: '.82rem', marginBottom: 6 }}>🛡️ {lang === 'zh' ? '对冲策略' : 'Hedging Strategies'}</div>
          {chain.hedging_strategies?.map((hs, i) => <div key={i} style={{ padding: '4px 0', fontSize: '.76rem', borderBottom: '1px solid var(--border)' }}>✓ {hs}</div>)}
        </div>
      </div>
    </div>
  );
}

/* ═══════ 4. LIVE MARKETS ═══════ */
function MarketsTab({ lang }) {
  const [liveData, setLiveData] = useState(null);
  const [simData, setSimData] = useState(null);
  const [fx, setFx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.fetchLiveMarketPrices().catch(() => null),
      api.fetchMarkets().catch(() => null),
      api.fetchLiveFxRates('USD').catch(() => null),
    ]).then(([live, sim, fxd]) => { setLiveData(live); setSimData(sim); setFx(fxd); setLoading(false); });
  }, []);

  if (loading) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;

  const isLive = liveData && !liveData.error && (liveData.quotes?.length || 0) > 0;
  const quotes = liveData?.quotes || [];

  const classify = (sym) => {
    if (['GC=F', 'SI=F', 'CL=F', 'BZ=F', 'NG=F', 'HG=F'].includes(sym)) return 'Commodities';
    if (['^GSPC', '^IXIC', '^DJI', '^N225', '000001.SS', '^HSI', '^STOXX', '^SOX'].includes(sym)) return 'Indices';
    if (['BTC-USD', 'ETH-USD'].includes(sym)) return 'Crypto';
    return 'Equities';
  };

  const grouped = {};
  quotes.forEach(q => { const cat = classify(q.symbol); if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(q); });

  const catIcons = { Commodities: '🪙', Indices: '📊', Crypto: '₿', Equities: '🏢' };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        {isLive ? <span style={c.liveBadge}>LIVE DATA</span> : <span style={c.badge('#f59e0b')}>SIMULATED</span>}
        <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{liveData?.source || 'Yahoo Finance'} · {liveData?.fetched_at?.slice(11, 19) || ''} UTC</span>
      </div>

      {simData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
          <div style={c.kpi(simData.fear_greed_index < 35 ? '#ef4444' : '#f59e0b')}>
            <div style={{ fontSize: '.64rem', color: 'var(--text3)' }}>Fear & Greed</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: simData.fear_greed_index < 35 ? '#ef4444' : '#f59e0b' }}>{simData.fear_greed_index}</div>
          </div>
          <div style={c.kpi(simData.vix > 25 ? '#ef4444' : '#f59e0b')}>
            <div style={{ fontSize: '.64rem', color: 'var(--text3)' }}>VIX</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{simData.vix}</div>
          </div>
          <div style={c.kpi(simData.global_supply_chain_pressure_index > 1 ? '#ef4444' : '#22c55e')}>
            <div style={{ fontSize: '.64rem', color: 'var(--text3)' }}>Supply Chain Pressure</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{simData.global_supply_chain_pressure_index}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isLive ? '2fr 1fr' : '1fr 1fr', gap: 16 }}>
        {isLive ? (
          <div>
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} style={{ ...c.card, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{catIcons[cat] || '📊'} {cat}</div>
                {items.map(q => (
                  <div key={q.symbol} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '.78rem' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{q.name}</span>
                      <span style={{ marginLeft: 6, fontSize: '.66rem', color: 'var(--text3)' }}>{q.symbol}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span>{typeof q.price === 'number' ? q.price.toLocaleString() : q.price} {q.currency || ''}</span>
                      <span style={{ fontWeight: 700, color: c.changeColor(q.change_pct), minWidth: 60, textAlign: 'right' }}>{q.change_pct > 0 ? '+' : ''}{q.change_pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div>
            {simData && ['equities', 'commodities'].map(key => (
              <div key={key} style={{ ...c.card, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{key === 'equities' ? '📊 Equities' : '🪙 Commodities'}</div>
                {(simData[key] || []).map(m => (
                  <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '.78rem' }}>
                    <span style={{ fontWeight: 600 }}>{m.name}</span>
                    <span style={{ fontWeight: 700, color: c.changeColor(m.change_pct) }}>{m.change_pct > 0 ? '+' : ''}{m.change_pct}%</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div>
          {fx && (
            <div style={{ ...c.card, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700 }}>💱 {lang === 'zh' ? '实时汇率' : 'Live FX'}</span>
                <span style={{ ...c.badge('#22c55e'), fontSize: '.58rem' }}>{fx.source}</span>
              </div>
              {Object.entries(fx.rates || {}).map(([cur, rate]) => (
                <div key={cur} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: '.76rem' }}>
                  <span style={{ fontWeight: 600 }}>USD/{cur}</span>
                  <span>{rate}</span>
                </div>
              ))}
            </div>
          )}
          {simData && (
            <>
              <div style={{ ...c.card, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>🏦 Bonds</div>
                {(simData.bonds || []).map(m => (
                  <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: '.76rem' }}>
                    <span style={{ fontWeight: 600 }}>{m.name}</span>
                    <span>{m.price}</span>
                  </div>
                ))}
              </div>
              <div style={c.card}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>₿ Crypto</div>
                {(simData.crypto || []).map(m => (
                  <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: '.76rem' }}>
                    <span style={{ fontWeight: 600 }}>{m.name}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span>{typeof m.price === 'number' ? m.price.toLocaleString() : m.price}</span>
                      <span style={{ fontWeight: 700, color: c.changeColor(m.change_pct) }}>{m.change_pct > 0 ? '+' : ''}{m.change_pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
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

const TAB_COMPS = {
  live: LiveDashboardTab, events: EventsTab, alerts: AlertCenterTab,
  resilience: ResilienceTab, chains: ChainsTab, ext_chains: ExtChainsTab,
  markets: MarketsTab, signals: SignalsTab, playbook: PlaybookTab,
};

export default function GeoIntelPage() {
  const { lang } = useI18n();
  const [tab, setTab] = useState('live');
  const Comp = TAB_COMPS[tab];
  return (
    <div>
      <h2 style={{ margin: '0 0 4px' }}>🌐 {lang === 'zh' ? '天眼 · 全球地缘情报' : 'Sky Eye · Global GeoIntelligence'}</h2>
      <p style={{ color: 'var(--text3)', fontSize: '.82rem', margin: '0 0 16px' }}>
        {lang === 'zh'
          ? '实时数据 · 预警中心 · 地缘政治 · 供应链韧性 · 10大产业链 · 实时行情 · 套利信号 · 历史追溯'
          : 'Live Data · Alert Center · Geopolitics · Resilience · 10 Industry Chains · Live Markets · Signals · Playbook'}
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
