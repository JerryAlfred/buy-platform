import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

export default function AIAnalyticsPage() {
  const { lang } = useI18n();
  const [analytics, setAnalytics] = useState(null);
  const [scheduling, setScheduling] = useState(null);
  const [quoteProduct, setQuoteProduct] = useState('servo_motor');
  const [quoteQty, setQuoteQty] = useState(200);
  const [quotePrediction, setQuotePrediction] = useState(null);
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(0);
  const [loading, setLoading] = useState({});

  useEffect(() => {
    api.fetchMesFactories().then(setFactories).catch(() => {});
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoading(p => ({ ...p, analytics: true }));
    try {
      const res = await api.fetchMesAiAnalytics(selectedFactory ? { factory_id: selectedFactory } : {});
      setAnalytics(res);
    } catch {}
    setLoading(p => ({ ...p, analytics: false }));
  }, [selectedFactory]);

  const loadScheduling = useCallback(async () => {
    if (!selectedFactory) return;
    setLoading(p => ({ ...p, scheduling: true }));
    try {
      const res = await api.fetchMesAiScheduling(selectedFactory);
      setScheduling(res);
    } catch {}
    setLoading(p => ({ ...p, scheduling: false }));
  }, [selectedFactory]);

  const loadQuote = async () => {
    setLoading(p => ({ ...p, quote: true }));
    try {
      const res = await api.fetchMesAiQuote({ product: quoteProduct, quantity: quoteQty });
      setQuotePrediction(res);
    } catch {}
    setLoading(p => ({ ...p, quote: false }));
  };

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? '🤖 AI 分析中心' : '🤖 AI Analytics Center'}</h2>
      <p className="page-sub">{lang === 'zh' ? '报价预测 · 产能分析 · 智能排产 · 交期预测' : 'Quote prediction · Capacity analysis · Smart scheduling · Delivery forecasting'}</p>

      {/* Factory Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <select value={selectedFactory} onChange={e => setSelectedFactory(+e.target.value)} style={{ padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '.85rem' }}>
          <option value={0}>{lang === 'zh' ? '全部工厂' : 'All Factories'}</option>
          {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {/* Quote Prediction */}
      <div style={{ padding: '16px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '.92rem' }}>{lang === 'zh' ? '💰 AI 报价预测' : '💰 AI Quote Prediction'}</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <select value={quoteProduct} onChange={e => setQuoteProduct(e.target.value)} style={{ padding: '8px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '.82rem' }}>
            {['servo_motor', 'brushless_dc', 'gripper', 'sensor', 'controller', 'reducer', 'encoder'].map(p => (
              <option key={p} value={p}>{p.replace('_', ' ')}</option>
            ))}
          </select>
          <input type="number" value={quoteQty} onChange={e => setQuoteQty(+e.target.value)} style={{ width: 100, padding: '8px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '.82rem' }} />
          <button onClick={loadQuote} disabled={loading.quote} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #a855f7)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '.82rem' }}>
            {loading.quote ? '...' : (lang === 'zh' ? '预测报价' : 'Predict Quote')}
          </button>
        </div>
        {quotePrediction && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {[
              { l: lang === 'zh' ? '基础单价' : 'Base Price', v: `$${quotePrediction.base_unit_price}` },
              { l: lang === 'zh' ? '批量折扣' : 'Vol. Discount', v: quotePrediction.volume_discount },
              { l: lang === 'zh' ? '预测单价' : 'Predicted Price', v: `$${quotePrediction.predicted_unit_price}`, accent: true },
              { l: lang === 'zh' ? '预测总价' : 'Predicted Total', v: `$${quotePrediction.predicted_total.toLocaleString()}`, accent: true },
              { l: lang === 'zh' ? '价格区间' : 'Price Range', v: `$${quotePrediction.price_range.low} - $${quotePrediction.price_range.high}` },
              { l: lang === 'zh' ? '置信度' : 'Confidence', v: `${(quotePrediction.confidence * 100).toFixed(0)}%` },
            ].map(k => (
              <div key={k.l} style={{ padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ fontSize: '.7rem', color: 'var(--text3)', marginBottom: 2 }}>{k.l}</div>
                <div style={{ fontSize: k.accent ? '1.1rem' : '.88rem', fontWeight: k.accent ? 700 : 500, color: k.accent ? 'var(--accent)' : 'var(--text)' }}>{k.v}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Production Analytics */}
      <div style={{ padding: '16px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '.92rem' }}>{lang === 'zh' ? '📊 生产分析' : '📊 Production Analytics'}</h3>
          <button onClick={loadAnalytics} disabled={loading.analytics} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text3)', cursor: 'pointer', fontSize: '.78rem' }}>
            {loading.analytics ? '...' : '↻'}
          </button>
        </div>
        {analytics && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 12 }}>
              {[
                { l: lang === 'zh' ? '总工单' : 'Total WO', v: analytics.production?.total_work_orders || 0, c: 'var(--accent)' },
                { l: lang === 'zh' ? '已完成' : 'Completed', v: analytics.production?.completed || 0, c: 'var(--green)' },
                { l: lang === 'zh' ? '进行中' : 'In Progress', v: analytics.production?.in_progress || 0, c: 'var(--yellow)' },
                { l: lang === 'zh' ? '准时交付率' : 'On-Time Rate', v: `${analytics.production?.on_time_delivery_rate || 0}%`, c: analytics.production?.on_time_delivery_rate >= 80 ? 'var(--green)' : '#ef4444' },
                { l: lang === 'zh' ? '平均周期' : 'Avg Cycle', v: `${analytics.production?.avg_cycle_days || 0}d`, c: 'var(--text2)' },
                { l: lang === 'zh' ? '综合良率' : 'Overall Yield', v: `${analytics.quality?.overall_yield || 0}%`, c: analytics.quality?.overall_yield >= 95 ? 'var(--green)' : 'var(--yellow)' },
              ].map(k => (
                <div key={k.l} style={{ padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ fontSize: '.7rem', color: 'var(--text3)', marginBottom: 2 }}>{k.l}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: k.c }}>{k.v}</div>
                </div>
              ))}
            </div>
            {analytics.ai_insights?.length > 0 && (
              <div style={{ padding: '10px 14px', background: 'rgba(168,85,247,.06)', borderRadius: 8, border: '1px solid rgba(168,85,247,.15)' }}>
                <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--purple)', marginBottom: 4 }}>🧠 AI Insights</div>
                {analytics.ai_insights.map((ins, i) => (
                  <div key={i} style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: 2 }}>• {ins}</div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* AI Scheduling Suggestion */}
      <div style={{ padding: '16px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '.92rem' }}>{lang === 'zh' ? '🗓️ AI 排产建议' : '🗓️ AI Scheduling Suggestions'}</h3>
          <button onClick={loadScheduling} disabled={loading.scheduling || !selectedFactory} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: selectedFactory ? 'linear-gradient(135deg, #3b82f6, #a855f7)' : 'var(--border)', color: '#fff', cursor: selectedFactory ? 'pointer' : 'default', fontSize: '.78rem', fontWeight: 600 }}>
            {loading.scheduling ? '...' : (lang === 'zh' ? '生成建议' : 'Generate')}
          </button>
        </div>
        {!selectedFactory && (
          <div style={{ color: 'var(--text3)', fontSize: '.82rem', padding: 16, textAlign: 'center' }}>
            {lang === 'zh' ? '请先选择一个工厂' : 'Please select a factory first'}
          </div>
        )}
        {scheduling && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, fontSize: '.82rem' }}>
              <div style={{ padding: '8px 12px', background: 'var(--card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text3)' }}>{lang === 'zh' ? '待排工单' : 'Pending Orders'}: </span>
                <span style={{ fontWeight: 600 }}>{scheduling.total_pending_orders}</span>
              </div>
              <div style={{ padding: '8px 12px', background: 'var(--card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text3)' }}>{lang === 'zh' ? '可用产线' : 'Available Lines'}: </span>
                <span style={{ fontWeight: 600 }}>{scheduling.available_lines}</span>
              </div>
            </div>

            {scheduling.scheduling_suggestions?.map((s, i) => (
              <div key={i} style={{ padding: '10px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '.85rem' }}>{s.work_order}</span>
                    <span style={{ color: 'var(--text3)', marginLeft: 8, fontSize: '.78rem' }}>{s.product}</span>
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '.72rem', fontWeight: 600, background: s.priority === 'urgent' ? 'rgba(239,68,68,.1)' : 'rgba(59,130,246,.1)', color: s.priority === 'urgent' ? '#ef4444' : 'var(--accent)' }}>{s.priority}</span>
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: 4 }}>
                  → {lang === 'zh' ? '推荐产线' : 'Recommended line'}: <strong>{s.recommended_line}</strong> ({lang === 'zh' ? '利用率' : 'util'}: {s.line_utilization}%) | {lang === 'zh' ? '预计' : 'Est.'} {s.estimated_days} {lang === 'zh' ? '天' : 'days'}
                </div>
              </div>
            ))}

            {scheduling.material_alerts?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>⚠️ {lang === 'zh' ? '物料预警' : 'Material Alerts'}</div>
                {scheduling.material_alerts.map((a, i) => (
                  <div key={i} style={{ padding: '6px 10px', background: 'rgba(239,68,68,.05)', borderRadius: 6, marginBottom: 4, fontSize: '.78rem', border: '1px solid rgba(239,68,68,.15)' }}>
                    <strong>{a.sku}</strong> ({a.name}): {a.current}/{a.min_required} — {a.action}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
