import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const TABS = [
  { id: 'live', icon: '📡', en: 'Live Dashboard', zh: '实时数据' },
  { id: 'finance', icon: '💹', en: 'Pro Finance', zh: '专业金融' },
  { id: 'events', icon: '🌍', en: 'Global Events', zh: '全球事件' },
  { id: 'rule_builder', icon: '⚙️', en: 'Rule Builder', zh: '规则编辑器' },
  { id: 'push_config', icon: '📲', en: 'Push Config', zh: '推送配置' },
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

/* ═══════ PRO FINANCE ═══════ */
function ProFinanceTab({ lang }) {
  const [watchlist, setWatchlist] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [sources, setSources] = useState(null);
  const [selSymbol, setSelSymbol] = useState('');
  const [technicals, setTechnicals] = useState(null);
  const [companyNews, setCompanyNews] = useState(null);

  useEffect(() => {
    Promise.all([
      api.fetchFinanceWatchlist().catch(() => null),
      api.fetchSectorHeatmap().catch(() => null),
      api.fetchEconomicCalendar().catch(() => null),
      api.fetchDataSourcesStatus().catch(() => null),
    ]).then(([w, h, cal, src]) => { setWatchlist(w); setHeatmap(h); setCalendar(cal); setSources(src); });
  }, []);

  const loadSymbol = async (sym) => {
    setSelSymbol(sym);
    const [t, n] = await Promise.all([api.fetchFinanceTechnicals(sym).catch(() => null), api.fetchCompanyNews(sym).catch(() => null)]);
    setTechnicals(t); setCompanyNews(n);
  };

  if (!watchlist) return <p style={{ color: 'var(--text3)' }}>Loading finance data...</p>;

  const wl = watchlist.watchlist || [];
  const cats = watchlist.categories || [];

  return (
    <div>
      {sources && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {(sources.sources || []).map(s => (
            <span key={s.name} style={{ ...c.badge(s.connected ? '#22c55e' : '#6b7280'), fontSize: '.62rem' }}>
              {s.connected ? '🟢' : '⚪'} {s.name} {s.configured ? `(${s.tier})` : '(not configured)'}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selSymbol ? '2fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
        <div>
          {cats.map(cat => (
            <div key={cat} style={{ ...c.card, marginBottom: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, textTransform: 'capitalize' }}>{cat === 'equities' ? '🏢' : cat === 'commodities' ? '🪙' : cat === 'indices' ? '📊' : '₿'} {cat}</div>
              {wl.filter(w => w.category === cat).map(q => (
                <div key={q.symbol} onClick={() => loadSymbol(q.symbol)} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '.78rem', cursor: 'pointer', background: selSymbol === q.symbol ? 'rgba(59,130,246,.06)' : 'transparent' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{q.name}</span>
                    <span style={{ marginLeft: 6, fontSize: '.64rem', color: 'var(--text3)' }}>{q.symbol}</span>
                    <span style={{ marginLeft: 4, fontSize: '.56rem', color: 'var(--text3)' }}>{q.source}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span>{typeof q.price === 'number' ? q.price.toLocaleString() : q.price}</span>
                    <span style={{ fontWeight: 700, color: c.changeColor(q.change_pct), minWidth: 55, textAlign: 'right' }}>{q.change_pct > 0 ? '+' : ''}{q.change_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        {selSymbol && (
          <div>
            {technicals && (
              <div style={{ ...c.card, marginBottom: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>📐 {selSymbol} Technical Analysis</div>
                <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginBottom: 6 }}>Source: {technicals.source}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div style={{ padding: '6px 8px', background: 'var(--bg)', borderRadius: 6 }}>
                    <div style={{ fontSize: '.64rem', color: 'var(--text3)' }}>RSI (14)</div>
                    <div style={{ fontWeight: 700, color: technicals.indicators?.rsi_14?.value > 70 ? '#ef4444' : technicals.indicators?.rsi_14?.value < 30 ? '#22c55e' : 'var(--text)' }}>{technicals.indicators?.rsi_14?.value}</div>
                    <div style={{ fontSize: '.6rem' }}>{technicals.indicators?.rsi_14?.signal}</div>
                  </div>
                  <div style={{ padding: '6px 8px', background: 'var(--bg)', borderRadius: 6 }}>
                    <div style={{ fontSize: '.64rem', color: 'var(--text3)' }}>MACD</div>
                    <div style={{ fontWeight: 700, color: technicals.indicators?.macd?.trend === 'bullish' ? '#22c55e' : '#ef4444' }}>{technicals.indicators?.macd?.histogram}</div>
                    <div style={{ fontSize: '.6rem' }}>{technicals.indicators?.macd?.trend}</div>
                  </div>
                  <div style={{ padding: '6px 8px', background: 'var(--bg)', borderRadius: 6 }}>
                    <div style={{ fontSize: '.64rem', color: 'var(--text3)' }}>SMA 20</div>
                    <div style={{ fontWeight: 700 }}>{technicals.indicators?.sma_20?.value}</div>
                  </div>
                  <div style={{ padding: '6px 8px', background: 'var(--bg)', borderRadius: 6 }}>
                    <div style={{ fontSize: '.64rem', color: 'var(--text3)' }}>Bollinger</div>
                    <div style={{ fontWeight: 700, fontSize: '.72rem' }}>{technicals.indicators?.bollinger?.lower} — {technicals.indicators?.bollinger?.upper}</div>
                  </div>
                </div>
                <div style={{ marginTop: 8, padding: '6px 10px', background: technicals.summary?.trend === 'bullish' ? 'rgba(34,197,94,.06)' : technicals.summary?.trend === 'bearish' ? 'rgba(239,68,68,.06)' : 'var(--bg)', borderRadius: 6, textAlign: 'center' }}>
                  <span style={{ fontWeight: 700, color: technicals.summary?.trend === 'bullish' ? '#22c55e' : technicals.summary?.trend === 'bearish' ? '#ef4444' : 'var(--text2)' }}>
                    {technicals.summary?.recommendation} — {technicals.summary?.trend} ({technicals.summary?.strength})
                  </span>
                </div>
              </div>
            )}
            {companyNews && (
              <div style={c.card}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>📰 {selSymbol} News</div>
                {(companyNews.news || []).slice(0, 5).map((n, i) => (
                  <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: '.72rem' }}>
                    <a href={n.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>{n.headline?.slice(0, 80)}</a>
                    <div style={{ fontSize: '.62rem', color: 'var(--text3)' }}>
                      {n.source} · <span style={{ color: n.sentiment === 'positive' ? '#22c55e' : n.sentiment === 'negative' ? '#ef4444' : 'var(--text3)' }}>{n.sentiment}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {heatmap && (
          <div style={c.card}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>🔥 Sector Heatmap</div>
            {(heatmap.sectors || []).map(s => (
              <div key={s.sector} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: '.74rem' }}>
                <span style={{ fontWeight: 600 }}>{s.sector}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 60, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(Math.abs(s.change_pct) * 10, 100)}%`, height: 6, background: s.change_pct > 0 ? '#22c55e' : '#ef4444', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontWeight: 700, color: c.changeColor(s.change_pct), minWidth: 50, textAlign: 'right' }}>{s.change_pct > 0 ? '+' : ''}{s.change_pct}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {calendar && (
          <div style={c.card}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>📅 Economic Calendar</div>
            {(calendar.events || []).map((ev, i) => (
              <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.72rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontWeight: 600 }}>{ev.event}</span>
                  <span style={c.badge(ev.importance === 'critical' ? '#ef4444' : ev.importance === 'high' ? '#f59e0b' : '#3b82f6')}>{ev.importance}</span>
                </div>
                <div style={{ color: 'var(--text3)', fontSize: '.64rem' }}>{ev.date} {ev.time} · Forecast: {ev.forecast} · Prev: {ev.previous}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════ PUSH CONFIG ═══════ */
function PushConfigTab({ lang }) {
  const [config, setConfig] = useState(null);
  const [pushLog, setPushLog] = useState([]);
  const [keysStatus, setKeysStatus] = useState(null);
  const [testChannel, setTestChannel] = useState('');
  const [testTo, setTestTo] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');
  const [urls, setUrls] = useState({ feishu: '', wechat: '', slack: '', discord: '', generic: '' });
  const [keys, setKeys] = useState({ finnhub: '', alpha_vantage: '', twelve_data: '', twilio_sid: '', twilio_token: '', twilio_from: '', sendgrid_key: '', sendgrid_from: '' });

  const loadAll = () => {
    api.fetchPushConfig().then(setConfig).catch(() => {});
    api.fetchPushLog(20).then(d => setPushLog(d.log || [])).catch(() => {});
    api.fetchApiKeysStatus().then(setKeysStatus).catch(() => {});
  };
  useEffect(loadAll, []);

  const runTest = async () => {
    if (!testChannel) return;
    const res = await api.testPushChannel({ channel: testChannel, to: testTo || undefined }).catch(() => ({ success: false, error: 'Failed' }));
    setTestResult(res);
    api.fetchPushLog(20).then(d => setPushLog(d.log || [])).catch(() => {});
  };

  const saveAll = async () => {
    const d = { channel: 'all' };
    if (urls.feishu) d.feishu_url = urls.feishu;
    if (urls.wechat) d.wechat_url = urls.wechat;
    if (urls.slack) d.slack_url = urls.slack;
    if (urls.discord) d.discord_url = urls.discord;
    if (urls.generic) d.generic_url = urls.generic;
    if (keys.finnhub) d.finnhub_key = keys.finnhub;
    if (keys.alpha_vantage) d.alpha_vantage_key = keys.alpha_vantage;
    if (keys.twelve_data) d.twelve_data_key = keys.twelve_data;
    if (keys.twilio_sid) d.twilio_sid = keys.twilio_sid;
    if (keys.twilio_token) d.twilio_token = keys.twilio_token;
    if (keys.twilio_from) d.twilio_from = keys.twilio_from;
    if (keys.sendgrid_key) d.sendgrid_key = keys.sendgrid_key;
    if (keys.sendgrid_from) d.sendgrid_from = keys.sendgrid_from;

    const res = await api.updatePushConfig(d).catch(() => null);
    if (res?.success) {
      setSaveMsg(`✅ ${(res.updated || []).length} settings saved: ${(res.updated || []).join(', ')}`);
      setConfig(res.config || config);
      api.fetchApiKeysStatus().then(setKeysStatus).catch(() => {});
      setKeys({ finnhub: '', alpha_vantage: '', twelve_data: '', twilio_sid: '', twilio_token: '', twilio_from: '', sendgrid_key: '', sendgrid_from: '' });
      setUrls({ feishu: '', wechat: '', slack: '', discord: '', generic: '' });
    } else {
      setSaveMsg('❌ Save failed');
    }
    setTimeout(() => setSaveMsg(''), 5000);
  };

  if (!config) return <p style={{ color: 'var(--text3)' }}>Loading push config...</p>;
  const channels = config.channels || {};
  const ks = keysStatus?.keys || {};

  return (
    <div>
      {keysStatus && (
        <div style={{ ...c.card, marginBottom: 16, borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 700 }}>🔑 {lang === 'zh' ? '数据源 API Key 状态' : 'Data Source API Keys'}</span>
            <span style={c.badge(keysStatus.configured_count > 0 ? '#22c55e' : '#f59e0b')}>{keysStatus.configured_count}/{keysStatus.total_count} configured</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 12 }}>
            {Object.entries(ks).map(([envKey, info]) => (
              <div key={envKey} style={{ padding: '8px 10px', border: `1px solid ${info.set ? '#22c55e30' : 'var(--border)'}`, borderRadius: 8, background: info.set ? 'rgba(34,197,94,.04)' : 'var(--bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: '.78rem' }}>{info.name}</span>
                  <span style={{ fontSize: '.7rem' }}>{info.set ? '🟢' : '⚪'}</span>
                </div>
                <div style={{ fontSize: '.6rem', color: 'var(--text3)', marginBottom: 2 }}>{info.tier}</div>
                <div style={{ fontSize: '.58rem', color: 'var(--text3)' }}>{info.features?.slice(0, 40)}</div>
                {!info.set && <a href={info.register_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 4, background: 'var(--accent)', color: '#fff', fontSize: '.6rem', textDecoration: 'none', fontWeight: 600 }}>Register Free</a>}
              </div>
            ))}
          </div>

          <div style={{ fontWeight: 600, fontSize: '.78rem', marginBottom: 6 }}>📝 {lang === 'zh' ? '输入 API Key（保存后立即生效）' : 'Enter API Keys (effective immediately after save)'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            {[
              ['finnhub', 'Finnhub API Key', 'finnhub.io/register'],
              ['alpha_vantage', 'Alpha Vantage Key', 'alphavantage.co/support'],
              ['twelve_data', 'Twelve Data Key', 'twelvedata.com/register'],
            ].map(([k, label, hint]) => (
              <div key={k}>
                <label style={{ fontSize: '.68rem', color: 'var(--text3)' }}>{label}</label>
                <input value={keys[k]} onChange={e => setKeys(kk => ({ ...kk, [k]: e.target.value }))} placeholder={`Get free key at ${hint}`} type="password" style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.72rem' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>📱 Twilio SMS</div>
              <input value={keys.twilio_sid} onChange={e => setKeys(kk => ({ ...kk, twilio_sid: e.target.value }))} placeholder="Account SID" type="password" style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.72rem', marginBottom: 4 }} />
              <input value={keys.twilio_token} onChange={e => setKeys(kk => ({ ...kk, twilio_token: e.target.value }))} placeholder="Auth Token" type="password" style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.72rem', marginBottom: 4 }} />
              <input value={keys.twilio_from} onChange={e => setKeys(kk => ({ ...kk, twilio_from: e.target.value }))} placeholder="From Number (+1234567890)" style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.72rem' }} />
            </div>
            <div>
              <div style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>📧 SendGrid Email</div>
              <input value={keys.sendgrid_key} onChange={e => setKeys(kk => ({ ...kk, sendgrid_key: e.target.value }))} placeholder="SendGrid API Key" type="password" style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.72rem', marginBottom: 4 }} />
              <input value={keys.sendgrid_from} onChange={e => setKeys(kk => ({ ...kk, sendgrid_from: e.target.value }))} placeholder="From Email (alerts@yourcompany.com)" style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.72rem' }} />
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={c.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>📲 {lang === 'zh' ? '推送渠道状态' : 'Push Channels Status'}</div>
          {Object.entries(channels).map(([id, ch]) => (
            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '.82rem' }}>{ch.description?.split(' — ')[0]}</span>
                <div style={{ fontSize: '.66rem', color: 'var(--text3)' }}>{ch.description?.split(' — ')[1]}</div>
              </div>
              <span style={c.badge(ch.enabled ? '#22c55e' : '#6b7280')}>{ch.enabled ? 'Connected' : 'Not configured'}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ ...c.card, marginBottom: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>🔗 {lang === 'zh' ? '配置 Webhook URL' : 'Configure Webhooks'}</div>
            {[['feishu', 'Feishu Webhook URL'], ['wechat', 'WeChat Work Webhook URL'], ['slack', 'Slack Webhook URL'], ['discord', 'Discord Webhook URL'], ['generic', 'Custom Webhook URL']].map(([k, label]) => (
              <div key={k} style={{ marginBottom: 6 }}>
                <label style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{label}</label>
                <input value={urls[k]} onChange={e => setUrls(u => ({ ...u, [k]: e.target.value }))} placeholder={`https://...`} style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.74rem' }} />
              </div>
            ))}
          </div>

          <div style={c.card}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>🧪 {lang === 'zh' ? '测试推送' : 'Test Push'}</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <select value={testChannel} onChange={e => setTestChannel(e.target.value)} style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.74rem' }}>
                <option value="">Select channel</option>
                {Object.keys(channels).map(id => <option key={id} value={id}>{id.replace(/_/g, ' ')}</option>)}
              </select>
              <input value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="phone/email (optional)" style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.74rem' }} />
              <button onClick={runTest} style={{ padding: '5px 14px', borderRadius: 6, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '.74rem', fontWeight: 600 }}>Test</button>
            </div>
            {testResult && <div style={{ fontSize: '.72rem', color: testResult.success ? '#22c55e' : '#ef4444' }}>{testResult.success ? '✅ Push test successful' : `❌ ${testResult.error || 'Failed'}`}</div>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={saveAll} style={{ padding: '8px 24px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '.82rem', fontWeight: 700 }}>💾 {lang === 'zh' ? '保存所有配置' : 'Save All Settings'}</button>
        {saveMsg && <span style={{ fontSize: '.78rem', color: saveMsg.startsWith('✅') ? '#22c55e' : '#ef4444', alignSelf: 'center' }}>{saveMsg}</span>}
      </div>

      <div style={c.card}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>📋 {lang === 'zh' ? '推送历史' : 'Push Log'}</div>
        {pushLog.length === 0 ? <div style={{ fontSize: '.76rem', color: 'var(--text3)' }}>No push history yet</div> : null}
        {pushLog.map(l => (
          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: '.72rem' }}>
            <div>
              <span style={c.badge(l.success ? '#22c55e' : '#ef4444')}>{l.success ? 'OK' : 'FAIL'}</span>
              <span style={{ marginLeft: 6, fontWeight: 600 }}>{l.channel}</span>
              <span style={{ marginLeft: 6, color: 'var(--text3)' }}>{l.title}</span>
            </div>
            <span style={{ color: 'var(--text3)', fontSize: '.64rem' }}>{l.timestamp?.slice(11, 19)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════ VISUAL RULE BUILDER ═══════ */
function RuleBuilderTab({ lang }) {
  const [builderCfg, setBuilderCfg] = useState(null);
  const [rules, setRules] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [dryResult, setDryResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [newRule, setNewRule] = useState({ name: '', description: '', conditions: [{ metric: 'asset_change_pct', operator: 'gte', value: 5, asset: '' }], logic: 'AND', channels: ['in_app'], level: 'medium', cooldown_minutes: 60 });

  useEffect(() => {
    api.fetchRuleBuilderConfig().then(setBuilderCfg).catch(() => {});
    api.fetchAlertRulesAll().then(d => setRules(d.rules || [])).catch(() => {});
    api.fetchRuleHistory(20).then(d => setHistory(d.history || [])).catch(() => {});
  }, []);

  const addCondition = () => setNewRule(r => ({ ...r, conditions: [...r.conditions, { metric: 'asset_price', operator: 'gt', value: 0, asset: '' }] }));
  const removeCondition = (i) => setNewRule(r => ({ ...r, conditions: r.conditions.filter((_, idx) => idx !== i) }));
  const updateCondition = (i, field, val) => setNewRule(r => ({ ...r, conditions: r.conditions.map((c2, idx) => idx === i ? { ...c2, [field]: val } : c2) }));

  const saveRule = async () => {
    if (!newRule.name) return;
    const res = await api.createAlertRuleV2(newRule).catch(() => null);
    if (res?.success) {
      setRules(prev => [...prev, res.rule]);
      setShowCreate(false);
      setNewRule({ name: '', description: '', conditions: [{ metric: 'asset_change_pct', operator: 'gte', value: 5, asset: '' }], logic: 'AND', channels: ['in_app'], level: 'medium', cooldown_minutes: 60 });
    }
  };

  const toggleRule = async (id, active) => {
    await api.updateAlertRule(id, { active: !active }).catch(() => {});
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !active } : r));
  };

  const deleteRule = async (id) => {
    const res = await api.deleteAlertRule(id).catch(() => ({ success: false }));
    if (res.success) setRules(prev => prev.filter(r => r.id !== id));
  };

  const runDryRun = async () => {
    const res = await api.dryRunRule({ conditions: newRule.conditions, logic: newRule.logic }).catch(() => null);
    setDryResult(res);
  };

  const createFromTemplate = async (tplId) => {
    const res = await api.createRuleFromTemplate(tplId).catch(() => null);
    if (res?.success) setRules(prev => [...prev, res.rule]);
  };

  if (!builderCfg) return <p style={{ color: 'var(--text3)' }}>Loading rule builder...</p>;
  const metrics = builderCfg.metrics || [];
  const operators = builderCfg.operators || [];
  const channelOpts = builderCfg.channels || [];
  const levels = builderCfg.levels || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <span style={{ fontWeight: 700 }}>{rules.length} rules</span>
          <span style={{ marginLeft: 8, color: 'var(--text3)', fontSize: '.76rem' }}>{rules.filter(r => r.active).length} active</span>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{ padding: '6px 16px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600 }}>
          {showCreate ? '✕ Cancel' : '+ Create Rule'}
        </button>
      </div>

      {showCreate && (
        <div style={{ ...c.card, marginBottom: 16, borderLeft: '4px solid var(--accent)' }}>
          <div style={{ fontWeight: 700, fontSize: '.92rem', marginBottom: 10 }}>🆕 {lang === 'zh' ? '创建预警规则' : 'Create Alert Rule'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: '.7rem', color: 'var(--text3)' }}>Rule Name</label>
              <input value={newRule.name} onChange={e => setNewRule(r => ({ ...r, name: e.target.value }))} style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.76rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '.7rem', color: 'var(--text3)' }}>Description</label>
              <input value={newRule.description} onChange={e => setNewRule(r => ({ ...r, description: e.target.value }))} style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.76rem' }} />
            </div>
          </div>

          <div style={{ fontWeight: 600, fontSize: '.78rem', marginBottom: 6 }}>Conditions ({newRule.logic})</div>
          {newRule.conditions.map((cond, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
              {i > 0 && <select value={newRule.logic} onChange={e => setNewRule(r => ({ ...r, logic: e.target.value }))} style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--accent)', fontSize: '.7rem', fontWeight: 700 }}><option value="AND">AND</option><option value="OR">OR</option></select>}
              {i === 0 && <span style={{ width: 42, fontSize: '.7rem', color: 'var(--text3)' }}>IF</span>}
              <select value={cond.metric} onChange={e => updateCondition(i, 'metric', e.target.value)} style={{ flex: 2, padding: '5px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.72rem' }}>
                {metrics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input value={cond.asset} onChange={e => updateCondition(i, 'asset', e.target.value)} placeholder="Asset (e.g. NVDA)" style={{ flex: 1, padding: '5px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.72rem' }} />
              <select value={cond.operator} onChange={e => updateCondition(i, 'operator', e.target.value)} style={{ padding: '5px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.72rem' }}>
                {operators.map(o => <option key={o.id} value={o.id}>{o.label} ({o.name})</option>)}
              </select>
              <input type="number" value={cond.value} onChange={e => updateCondition(i, 'value', Number(e.target.value))} style={{ width: 60, padding: '5px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.72rem' }} />
              {newRule.conditions.length > 1 && <button onClick={() => removeCondition(i)} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: '.7rem' }}>✕</button>}
            </div>
          ))}
          <button onClick={addCondition} style={{ padding: '3px 10px', borderRadius: 4, border: '1px dashed var(--border)', background: 'transparent', cursor: 'pointer', fontSize: '.7rem', color: 'var(--accent)', marginBottom: 10 }}>+ Add Condition</button>

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: '.7rem', color: 'var(--text3)' }}>Level</label>
              <select value={newRule.level} onChange={e => setNewRule(r => ({ ...r, level: e.target.value }))} style={{ display: 'block', padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.74rem' }}>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '.7rem', color: 'var(--text3)' }}>Cooldown (min)</label>
              <input type="number" value={newRule.cooldown_minutes} onChange={e => setNewRule(r => ({ ...r, cooldown_minutes: Number(e.target.value) }))} style={{ display: 'block', width: 80, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.74rem' }} />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: '.7rem', color: 'var(--text3)' }}>Push Channels</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {channelOpts.map(ch => (
                <button key={ch.id} onClick={() => setNewRule(r => ({ ...r, channels: r.channels.includes(ch.id) ? r.channels.filter(x => x !== ch.id) : [...r.channels, ch.id] }))} style={{ padding: '4px 10px', borderRadius: 6, border: newRule.channels.includes(ch.id) ? '2px solid var(--accent)' : '1px solid var(--border)', background: newRule.channels.includes(ch.id) ? 'rgba(59,130,246,.08)' : 'var(--bg)', cursor: 'pointer', fontSize: '.72rem' }}>
                  {ch.icon} {ch.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveRule} style={{ padding: '6px 20px', borderRadius: 6, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600 }}>💾 Save Rule</button>
            <button onClick={runDryRun} style={{ padding: '6px 20px', borderRadius: 6, background: 'var(--card)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '.78rem' }}>🧪 Dry Run</button>
          </div>

          {dryResult && (
            <div style={{ marginTop: 8, padding: '8px 10px', background: dryResult.overall_triggered ? 'rgba(239,68,68,.06)' : 'rgba(34,197,94,.06)', borderRadius: 6 }}>
              <div style={{ fontWeight: 700, color: dryResult.overall_triggered ? '#ef4444' : '#22c55e', marginBottom: 4 }}>
                {dryResult.overall_triggered ? '🔔 WOULD TRIGGER' : '✅ Would NOT trigger'}
              </div>
              {(dryResult.conditions || []).map((cnd, i) => (
                <div key={i} style={{ fontSize: '.72rem', padding: '2px 0' }}>
                  {cnd.triggered ? '🔴' : '🟢'} {cnd.metric} ({cnd.asset || '*'}) = <strong>{JSON.stringify(cnd.current_value)}</strong> {cnd.operator} {JSON.stringify(cnd.threshold)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(builderCfg.templates || []).length > 0 && !showCreate && (
        <div style={{ ...c.card, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>📋 {lang === 'zh' ? '规则模板（一键创建）' : 'Rule Templates (one-click create)'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {(builderCfg.templates || []).map(tpl => (
              <div key={tpl.id} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.74rem' }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{tpl.name}</div>
                <div style={{ fontSize: '.66rem', color: 'var(--text3)', marginBottom: 4 }}>{tpl.description}</div>
                <button onClick={() => createFromTemplate(tpl.id)} style={{ padding: '3px 10px', borderRadius: 4, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '.66rem' }}>+ Create</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        {rules.map(r => (
          <div key={r.id} style={{ ...c.card, marginBottom: 8, borderLeft: `4px solid ${c.lvlColor(r.level)}`, opacity: r.active ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: '.84rem' }}>{r.name}</span>
                  <span style={c.badge(c.lvlColor(r.level))}>{r.level}</span>
                  {r.system && <span style={c.badge('#6b7280')}>system</span>}
                  <span style={c.badge(r.active ? '#22c55e' : '#6b7280')}>{r.active ? 'active' : 'disabled'}</span>
                </div>
                <div style={{ fontSize: '.7rem', color: 'var(--text3)', marginBottom: 4 }}>{r.description}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                  {(r.conditions || []).map((cnd, i) => (
                    <span key={i} style={{ padding: '2px 6px', background: 'var(--bg)', borderRadius: 4, fontSize: '.66rem' }}>
                      {i > 0 && <strong style={{ color: 'var(--accent)' }}> {r.logic} </strong>}
                      {cnd.metric} {cnd.asset !== '*' ? `(${cnd.asset})` : ''} {cnd.operator} {JSON.stringify(cnd.value)}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(r.channels || []).map(ch => <span key={ch} style={{ ...c.badge('#3b82f6'), fontSize: '.58rem' }}>{ch}</span>)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: '.64rem', color: 'var(--text3)' }}>Triggers: {r.trigger_count}</span>
                <button onClick={() => toggleRule(r.id, r.active)} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: '.64rem' }}>{r.active ? 'Disable' : 'Enable'}</button>
                {!r.system && <button onClick={() => deleteRule(r.id)} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #ef4444', background: 'rgba(239,68,68,.06)', cursor: 'pointer', fontSize: '.64rem', color: '#ef4444' }}>Delete</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TAB_COMPS = {
  live: LiveDashboardTab, finance: ProFinanceTab, events: EventsTab,
  rule_builder: RuleBuilderTab, push_config: PushConfigTab,
  alerts: AlertCenterTab, resilience: ResilienceTab, chains: ChainsTab,
  ext_chains: ExtChainsTab, markets: MarketsTab, signals: SignalsTab,
  playbook: PlaybookTab,
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
          ? '实时数据 · 专业金融 · 可视化规则 · 多渠道推送 · 预警中心 · 产业链 · 套利信号 · 历史追溯'
          : 'Live Data · Pro Finance · Rule Builder · Multi-Channel Push · Alerts · Chains · Signals · Playbook'}
      </p>
      <div style={{ display: 'flex', gap: 5, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '7px 12px', borderRadius: 8, border: tab === t.id ? '2px solid var(--accent)' : '1px solid var(--border)',
            background: tab === t.id ? 'rgba(59,130,246,.08)' : 'var(--card)',
            color: tab === t.id ? 'var(--accent)' : 'var(--text2)',
            cursor: 'pointer', fontWeight: tab === t.id ? 700 : 400, fontSize: '.74rem', whiteSpace: 'nowrap',
          }}>
            {t.icon} {lang === 'zh' ? t.zh : t.en}
          </button>
        ))}
      </div>
      {Comp && <Comp lang={lang} />}
    </div>
  );
}
