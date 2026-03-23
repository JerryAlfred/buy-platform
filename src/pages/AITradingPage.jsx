import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const TABS = [
  { id: 'predictions', icon: '🔮', en: 'AI Predictions', zh: 'AI预测' },
  { id: 'impact', icon: '⚡', en: 'Live Impact', zh: '实时影响流' },
  { id: 'arbitrage', icon: '🎯', en: 'Auto-Arbitrage', zh: '自动套利' },
  { id: 'portfolio', icon: '💼', en: 'Portfolio', zh: '持仓监控' },
  { id: 'backtest', icon: '📊', en: 'Backtester', zh: '回测' },
];

const s = {
  card: { padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 },
  kpi: (cl) => ({ padding: '10px 12px', background: `${cl}08`, border: `1px solid ${cl}20`, borderRadius: 10, textAlign: 'center' }),
  badge: (cl) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '.66rem', fontWeight: 600, background: `${cl}15`, color: cl }),
  bar: (pct, cl) => ({ width: `${Math.min(Math.abs(pct), 100)}%`, height: 7, background: cl, borderRadius: 4, transition: 'width .5s' }),
  pnl: (v) => v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : 'var(--text3)',
  dir: (d) => d === 'long' ? '#22c55e' : '#ef4444',
  btn: (bg) => ({ padding: '8px 16px', borderRadius: 8, border: 'none', background: bg, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '.78rem' }),
};

/* ═══════ PREDICTIONS ═══════ */
function PredictionsTab({ lang }) {
  const [d, setD] = useState(null);
  const [hz, setHz] = useState('1w');
  useEffect(() => { api.fetchPredictions({ horizon: hz }).then(setD).catch(() => {}); }, [hz]);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;
  const preds = d.predictions || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{d.model} · {d.generated_at?.slice(0, 19)}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['1d', '1w', '1m', '3m'].map(h => (
            <button key={h} onClick={() => setHz(h)} style={{ ...s.btn(hz === h ? 'var(--accent)' : 'var(--border)'), color: hz === h ? '#fff' : 'var(--text2)', padding: '5px 12px' }}>{h}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 12 }}>
        {[{ l: lang === 'zh' ? '看涨' : 'Bullish', v: d.summary?.bullish_count, c: '#22c55e' },
          { l: lang === 'zh' ? '看跌' : 'Bearish', v: d.summary?.bearish_count, c: '#ef4444' },
          { l: lang === 'zh' ? '最高信心' : 'Top Confidence', v: d.summary?.highest_confidence, c: '#3b82f6' },
        ].map((k, i) => (
          <div key={i} style={s.kpi(k.c)}>
            <div style={{ fontSize: '.62rem', color: 'var(--text3)' }}>{k.l}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
        {preds.map(p => (
          <div key={p.asset} style={{ ...s.card, borderLeft: `4px solid ${s.pnl(p.change_pct)}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: '.84rem' }}>{p.asset}</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={s.badge(s.pnl(p.change_pct))}>{p.direction}</span>
                <span style={{ fontWeight: 800, color: s.pnl(p.change_pct) }}>{p.change_pct > 0 ? '+' : ''}{p.change_pct}%</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.74rem', marginBottom: 4 }}>
              <span>{lang === 'zh' ? '当前' : 'Now'}: ${typeof p.current_price === 'number' && p.current_price > 100 ? p.current_price.toLocaleString() : p.current_price}</span>
              <span style={{ color: s.pnl(p.change_pct), fontWeight: 700 }}>{lang === 'zh' ? '预测' : 'Pred'}: ${typeof p.predicted_price === 'number' && p.predicted_price > 100 ? p.predicted_price.toLocaleString() : p.predicted_price}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', color: 'var(--text3)' }}>
              <span>{lang === 'zh' ? '区间' : 'Range'}: {p.range_low} – {p.range_high}</span>
              <span>{lang === 'zh' ? '信心' : 'Conf'}: <span style={{ fontWeight: 700, color: p.confidence_pct > 75 ? '#22c55e' : '#f59e0b' }}>{p.confidence_pct}%</span></span>
            </div>
            <div style={{ marginTop: 4 }}>
              {p.key_drivers?.slice(0, 2).map((d, i) => <div key={i} style={{ fontSize: '.66rem', color: 'var(--text2)', padding: '1px 0' }}>• {d}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════ LIVE IMPACT ═══════ */
function ImpactTab({ lang }) {
  const [d, setD] = useState(null);
  const load = useCallback(() => { api.fetchImpactStream().then(setD).catch(() => {}); }, []);
  useEffect(() => { load(); const iv = setInterval(load, 10000); return () => clearInterval(iv); }, [load]);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>
          {lang === 'zh' ? '24h事件' : '24h Events'}: {d.total_events_24h} · {lang === 'zh' ? '30天准确率' : '30d Accuracy'}: {d.avg_prediction_accuracy_30d}%
        </div>
        <span style={s.badge('#22c55e')}>LIVE · {d.refresh_interval_ms / 1000}s</span>
      </div>
      {(d.stream || []).map(ev => (
        <div key={ev.event_id} style={{ ...s.card, marginBottom: 8, borderLeft: `3px solid ${ev.severity >= 7 ? '#ef4444' : ev.severity >= 5 ? '#f59e0b' : '#3b82f6'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={s.badge(ev.severity >= 7 ? '#ef4444' : '#f59e0b')}>{ev.severity}/10</span>
              <span style={{ fontWeight: 700, fontSize: '.82rem' }}>{ev.title}</span>
            </div>
            <span style={{ fontSize: '.66rem', color: 'var(--text3)' }}>{ev.seconds_ago}s ago</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            {ev.asset_impacts?.map((ai, i) => (
              <div key={i} style={{ padding: '3px 8px', borderRadius: 6, background: `${s.pnl(ai.immediate_impact_pct)}08`, border: `1px solid ${s.pnl(ai.immediate_impact_pct)}20`, fontSize: '.7rem' }}>
                <span style={{ fontWeight: 600 }}>{ai.asset}</span>{' '}
                <span style={{ color: s.pnl(ai.immediate_impact_pct), fontWeight: 700 }}>{ai.immediate_impact_pct > 0 ? '+' : ''}{ai.immediate_impact_pct}%</span>
                <span style={{ color: 'var(--text3)', marginLeft: 4 }}>→ 1h: {ai.predicted_1h_impact_pct > 0 ? '+' : ''}{ai.predicted_1h_impact_pct}%</span>
                <span style={{ color: 'var(--text3)', marginLeft: 4 }}>24h: {ai.predicted_24h_impact_pct > 0 ? '+' : ''}{ai.predicted_24h_impact_pct}%</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '.7rem', color: 'var(--text2)', fontStyle: 'italic' }}>{ev.ai_analysis}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════ ARBITRAGE ═══════ */
function ArbitrageTab({ lang }) {
  const [d, setD] = useState(null);
  const [executing, setExecuting] = useState('');
  useEffect(() => { api.fetchArbitrage().then(setD).catch(() => {}); }, []);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;

  const handleExecuteArb = async (opp) => {
    setExecuting(opp.id);
    const trades = opp.legs.map(leg => ({
      instrument: leg.instrument, direction: leg.direction,
      quantity: leg.size_pct, entry_price: leg.entry,
      stop_loss: leg.stop, take_profit: leg.target,
    }));
    await api.executeArb({ arb_id: opp.id, trades });
    setExecuting('done-' + opp.id);
  };

  const stats = d.scan_stats || {};
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { l: lang === 'zh' ? '扫描市场' : 'Markets Scanned', v: stats.markets_scanned, c: '#3b82f6' },
          { l: lang === 'zh' ? '24h机会' : '24h Opportunities', v: stats.opportunities_found_24h, c: '#f59e0b' },
          { l: lang === 'zh' ? '30天胜率' : '30d Win Rate', v: `${stats.win_rate_30d_pct}%`, c: '#22c55e' },
          { l: lang === 'zh' ? '平均收益' : 'Avg Return/Trade', v: `${stats.avg_return_per_trade_pct}%`, c: '#a855f7' },
        ].map((k, i) => (
          <div key={i} style={s.kpi(k.c)}>
            <div style={{ fontSize: '.62rem', color: 'var(--text3)' }}>{k.l}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>
      {(d.active_opportunities || []).map(opp => (
        <div key={opp.id} style={{ ...s.card, marginBottom: 10, borderLeft: `4px solid ${opp.urgency === 'high' ? '#ef4444' : opp.urgency === 'medium' ? '#f59e0b' : '#3b82f6'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontWeight: 800 }}>{opp.id}</span>
              <span style={s.badge(opp.urgency === 'high' ? '#ef4444' : '#f59e0b')}>{opp.urgency}</span>
              <span style={s.badge('#3b82f6')}>{opp.type.replace(/_/g, ' ')}</span>
              <span style={{ fontSize: '.66rem', color: 'var(--text3)' }}>{lang === 'zh' ? '过期' : 'Expires'}: {opp.expires_in_minutes}min</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: '#22c55e' }}>+{opp.expected_return_pct}%</span>
              <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>risk {opp.max_risk_pct}%</span>
              <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Sharpe {opp.sharpe_estimate}</span>
            </div>
          </div>
          <div style={{ fontWeight: 600, fontSize: '.82rem', marginBottom: 8 }}>{opp.thesis}</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${opp.legs.length},1fr)`, gap: 8, marginBottom: 8 }}>
            {opp.legs.map((leg, i) => (
              <div key={i} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, background: `${s.dir(leg.direction)}05` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: '.76rem' }}>{leg.instrument}</span>
                  <span style={s.badge(s.dir(leg.direction))}>{leg.direction.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>
                  {lang === 'zh' ? '入场' : 'Entry'}: {leg.entry} · {lang === 'zh' ? '目标' : 'TP'}: <span style={{ color: '#22c55e' }}>{leg.target}</span> · {lang === 'zh' ? '止损' : 'SL'}: <span style={{ color: '#ef4444' }}>{leg.stop}</span>
                </div>
                <div style={{ fontSize: '.66rem', color: 'var(--text3)' }}>{lang === 'zh' ? '仓位' : 'Size'}: {leg.size_pct}%</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>AI {lang === 'zh' ? '信心' : 'Confidence'}: <span style={{ fontWeight: 700, color: opp.ai_confidence > 75 ? '#22c55e' : '#f59e0b' }}>{opp.ai_confidence}%</span></span>
            {opp.status === 'actionable' && (
              <button onClick={() => handleExecuteArb(opp)}
                disabled={executing === opp.id || executing === 'done-' + opp.id}
                style={{ ...s.btn(executing === 'done-' + opp.id ? '#22c55e' : '#3b82f6'), opacity: executing === opp.id ? 0.5 : 1 }}>
                {executing === 'done-' + opp.id ? (lang === 'zh' ? '✅ 已执行' : '✅ Executed') : executing === opp.id ? '...' : (lang === 'zh' ? '⚡ 一键下单' : '⚡ Execute All')}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════ PORTFOLIO ═══════ */
function PortfolioTab({ lang }) {
  const [d, setD] = useState(null);
  const load = useCallback(() => { api.fetchPortfolio().then(setD).catch(() => {}); }, []);
  useEffect(() => { load(); const iv = setInterval(load, 8000); return () => clearInterval(iv); }, [load]);
  if (!d) return <p style={{ color: 'var(--text3)' }}>Loading...</p>;
  const sm = d.summary || {};

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { l: lang === 'zh' ? '总P&L' : 'Total P&L', v: `$${sm.total_unrealized_pnl?.toLocaleString()}`, c: s.pnl(sm.total_unrealized_pnl) },
          { l: lang === 'zh' ? '今日已实现' : 'Realized Today', v: `$${sm.realized_pnl_today?.toLocaleString()}`, c: '#22c55e' },
          { l: 'Sharpe', v: sm.sharpe_ratio, c: '#3b82f6' },
          { l: lang === 'zh' ? '最大回撤' : 'Max Drawdown', v: `${sm.max_drawdown_pct}%`, c: '#ef4444' },
        ].map((k, i) => (
          <div key={i} style={s.kpi(k.c)}>
            <div style={{ fontSize: '.62rem', color: 'var(--text3)' }}>{k.l}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>
      <div style={s.card}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>📊 {lang === 'zh' ? '持仓' : 'Positions'} ({d.positions?.length})</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.76rem' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
            {[lang === 'zh' ? '标的' : 'Instrument', lang === 'zh' ? '方向' : 'Dir', lang === 'zh' ? '数量' : 'Qty', lang === 'zh' ? '入场' : 'Entry', lang === 'zh' ? '现价' : 'Current', 'P&L', 'P&L%', 'SL', 'TP'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: 5 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {(d.positions || []).map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 5, fontWeight: 700 }}>{p.instrument}</td>
                <td style={{ padding: 5 }}><span style={s.badge(s.dir(p.direction))}>{p.direction}</span></td>
                <td style={{ padding: 5 }}>{p.quantity}</td>
                <td style={{ padding: 5 }}>{p.avg_entry}</td>
                <td style={{ padding: 5 }}>{p.current_price}</td>
                <td style={{ padding: 5, fontWeight: 700, color: s.pnl(p.unrealized_pnl) }}>${p.unrealized_pnl}</td>
                <td style={{ padding: 5, color: s.pnl(p.unrealized_pnl_pct) }}>{p.unrealized_pnl_pct > 0 ? '+' : ''}{p.unrealized_pnl_pct}%</td>
                <td style={{ padding: 5, color: '#ef4444', fontSize: '.7rem' }}>{p.stop_loss || '—'}</td>
                <td style={{ padding: 5, color: '#22c55e', fontSize: '.7rem' }}>{p.take_profit || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div style={s.card}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>🏦 {lang === 'zh' ? '资产类别敞口' : 'Asset Class Exposure'}</div>
          {(d.risk_exposure?.by_asset_class || []).map((a, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.76rem', marginBottom: 2 }}>
                <span>{a.class}</span>
                <span style={{ fontWeight: 700 }}>{a.exposure_pct}% · <span style={{ color: s.pnl(a.pnl) }}>${a.pnl}</span></span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3 }}>
                <div style={{ ...s.bar(a.exposure_pct, '#3b82f6'), height: 6 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={s.card}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>🌍 {lang === 'zh' ? '地理敞口' : 'Geographic Exposure'}</div>
          {(d.risk_exposure?.by_geography || []).map((g, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.76rem', marginBottom: 2 }}>
                <span>{g.region}</span>
                <span style={{ fontWeight: 700 }}>{g.exposure_pct}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3 }}>
                <div style={{ ...s.bar(g.exposure_pct, '#a855f7'), height: 6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════ BACKTESTER ═══════ */
function BacktestTab({ lang }) {
  const [form, setForm] = useState({ strategy_name: 'geopolitical_momentum', initial_capital: 100000, start_date: '2024-01-01', end_date: '2026-03-23' });
  const [r, setR] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => { setLoading(true); const res = await api.runBacktest(form); setR(res); setLoading(false); };
  const strategies = ['geopolitical_momentum', 'supply_chain_disruption', 'commodity_mean_reversion', 'fx_carry_unwind', 'cross_asset_correlation'];

  return (
    <div>
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>🧪 {lang === 'zh' ? '策略回测器' : 'Strategy Backtester'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginBottom: 2 }}>{lang === 'zh' ? '策略' : 'Strategy'}</div>
            <select value={form.strategy_name} onChange={e => setForm({ ...form, strategy_name: e.target.value })} style={{ width: '100%', padding: 7, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box' }}>
              {strategies.map(st => <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginBottom: 2 }}>{lang === 'zh' ? '初始资金' : 'Capital'}</div>
            <input type="number" value={form.initial_capital} onChange={e => setForm({ ...form, initial_capital: Number(e.target.value) })} style={{ width: '100%', padding: 7, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginBottom: 2 }}>{lang === 'zh' ? '开始' : 'Start'}</div>
            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={{ width: '100%', padding: 7, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={run} disabled={loading} style={{ ...s.btn('#3b82f6'), width: '100%' }}>
              {loading ? '...' : (lang === 'zh' ? '🚀 运行回测' : '🚀 Run Backtest')}
            </button>
          </div>
        </div>
      </div>
      {r && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { l: lang === 'zh' ? '总收益' : 'Total Return', v: `${r.total_return_pct}%`, c: s.pnl(r.total_return_pct) },
              { l: lang === 'zh' ? '年化' : 'Annualized', v: `${r.annualized_return_pct}%`, c: '#3b82f6' },
              { l: 'Sharpe', v: r.sharpe_ratio, c: '#a855f7' },
              { l: lang === 'zh' ? '最大回撤' : 'Max DD', v: `${r.max_drawdown_pct}%`, c: '#ef4444' },
              { l: lang === 'zh' ? '胜率' : 'Win Rate', v: `${r.win_rate_pct}%`, c: '#22c55e' },
            ].map((k, i) => (
              <div key={i} style={s.kpi(k.c)}>
                <div style={{ fontSize: '.62rem', color: 'var(--text3)' }}>{k.l}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: k.c }}>{k.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 12 }}>
            <div style={s.card}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>📈 {lang === 'zh' ? '净值曲线' : 'Equity Curve'}</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: 160, gap: 2 }}>
                {(r.equity_curve || []).map((pt, i) => {
                  const maxEq = Math.max(...r.equity_curve.map(p => p.equity));
                  const minEq = Math.min(...r.equity_curve.map(p => p.equity));
                  const h = ((pt.equity - minEq) / (maxEq - minEq || 1)) * 140 + 20;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%', height: h, background: pt.monthly_return_pct >= 0 ? '#22c55e' : '#ef4444', borderRadius: '2px 2px 0 0', opacity: 0.7 }} title={`${pt.date}: $${pt.equity.toLocaleString()} (${pt.monthly_return_pct > 0 ? '+' : ''}${pt.monthly_return_pct}%)`} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.62rem', color: 'var(--text3)', marginTop: 4 }}>
                <span>{r.equity_curve?.[0]?.date}</span>
                <span>{r.equity_curve?.[r.equity_curve.length - 1]?.date}</span>
              </div>
            </div>
            <div style={s.card}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{lang === 'zh' ? '统计' : 'Stats'}</div>
              {[
                { l: lang === 'zh' ? '最终净值' : 'Final Equity', v: `$${r.final_equity?.toLocaleString()}` },
                { l: lang === 'zh' ? '总交易' : 'Total Trades', v: r.total_trades },
                { l: 'Profit Factor', v: r.profit_factor },
                { l: 'Sortino', v: r.sortino_ratio },
                { l: lang === 'zh' ? '最佳月' : 'Best Month', v: `+${r.best_month_pct}%` },
                { l: lang === 'zh' ? '最差月' : 'Worst Month', v: `${r.worst_month_pct}%` },
              ].map((st, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: '.76rem' }}>
                  <span style={{ color: 'var(--text3)' }}>{st.l}</span>
                  <span style={{ fontWeight: 600 }}>{st.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TAB_COMPS = { predictions: PredictionsTab, impact: ImpactTab, arbitrage: ArbitrageTab, portfolio: PortfolioTab, backtest: BacktestTab };

export default function AITradingPage() {
  const { lang } = useI18n();
  const [tab, setTab] = useState('predictions');
  const Comp = TAB_COMPS[tab];
  return (
    <div>
      <h2 style={{ margin: '0 0 4px' }}>🧠 {lang === 'zh' ? 'AI 交易中心' : 'AI Trading Center'}</h2>
      <p style={{ color: 'var(--text3)', fontSize: '.82rem', margin: '0 0 16px' }}>
        {lang === 'zh'
          ? 'AI预测 · 实时影响量化 · 自动套利发现 · 一键下单 · 持仓监控 · 策略回测'
          : 'AI Predictions · Real-time Impact · Auto-Arbitrage · One-Click Execution · Portfolio · Backtesting'}
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
