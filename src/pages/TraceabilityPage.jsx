import { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const STAGE_ICONS = {
  wo_created: '📋', wo_updated: '🔄', quality_inspection: '✅', inventory_adjusted: '📦',
  line_created: '🏭', factory_created: '🏗️', inspection_scheduled: '🔍',
};

export default function TraceabilityPage() {
  const { lang } = useI18n();
  const [poId, setPoId] = useState('');
  const [trace, setTrace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    api.fetchOrders({ limit: 10 }).then(r => setRecentOrders(r.orders || r || [])).catch(() => {});
  }, []);

  const doTrace = async () => {
    if (!poId) return;
    setLoading(true);
    try {
      const res = await api.fetchMesTrace(+poId);
      setTrace(res);
    } catch { setTrace({ error: true }); }
    setLoading(false);
  };

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? '🔍 订单溯源追踪' : '🔍 Order Traceability'}</h2>
      <p className="page-sub">{lang === 'zh' ? '从下单到生产到质检到出货 — 全链路实时可见' : 'From order to production to QC to shipment — full chain real-time visibility'}</p>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input value={poId} onChange={e => setPoId(e.target.value)} onKeyDown={e => e.key === 'Enter' && doTrace()}
          placeholder={lang === 'zh' ? '输入采购订单 ID (PO ID)' : 'Enter Purchase Order ID (PO ID)'}
          style={{ flex: 1, maxWidth: 400, padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: '.88rem' }} />
        <button onClick={doTrace} disabled={loading} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '.88rem' }}>
          {loading ? '...' : (lang === 'zh' ? '追踪' : 'Trace')}
        </button>
      </div>

      {/* Quick Select */}
      {!trace && recentOrders.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '.82rem', color: 'var(--text3)', marginBottom: 8 }}>{lang === 'zh' ? '最近订单：' : 'Recent orders:'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {recentOrders.slice(0, 8).map(o => (
              <button key={o.id} onClick={() => { setPoId(String(o.id)); }} style={{
                padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text2)', cursor: 'pointer', fontSize: '.78rem',
              }}>
                PO #{o.id} — {o.status}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trace Results */}
      {trace && !trace.error && (
        <div>
          <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,.06)', borderRadius: 12, marginBottom: 16, fontSize: '.85rem' }}>
            <strong>PO #{trace.po_id}</strong> — {trace.total_work_orders} {lang === 'zh' ? '个生产工单' : 'work orders linked'}
          </div>

          {trace.production_status?.map((ps, idx) => (
            <div key={idx} style={{ marginBottom: 20, padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12 }}>
              {/* Work Order Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{ps.work_order.wo_key}</span>
                  <span style={{ marginLeft: 8, fontSize: '.82rem', color: 'var(--text2)' }}>{ps.work_order.product}</span>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 12, fontSize: '.78rem', fontWeight: 600,
                  background: ps.work_order.status === 'completed' ? 'rgba(34,197,94,.1)' : ps.work_order.status === 'in_progress' ? 'rgba(245,158,11,.1)' : 'rgba(59,130,246,.1)',
                  color: ps.work_order.status === 'completed' ? '#22c55e' : ps.work_order.status === 'in_progress' ? '#f59e0b' : '#3b82f6',
                }}>{ps.work_order.status}</span>
              </div>

              {/* Progress */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: 4 }}>
                  <span>{lang === 'zh' ? '生产进度' : 'Production Progress'}</span>
                  <span style={{ fontWeight: 600 }}>{ps.work_order.qty_completed}/{ps.work_order.qty_ordered} ({ps.work_order.progress}%)</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${ps.work_order.progress}%`, background: 'linear-gradient(90deg, #3b82f6, #22c55e)', borderRadius: 4, transition: 'width .3s' }} />
                </div>
              </div>

              {/* Schedule */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, fontSize: '.78rem' }}>
                <div style={{ padding: '8px 10px', background: 'var(--card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>{lang === 'zh' ? '计划开始' : 'Planned Start'}</div>
                  <div style={{ fontWeight: 600 }}>{ps.work_order.planned_start?.slice(0, 10) || '—'}</div>
                </div>
                <div style={{ padding: '8px 10px', background: 'var(--card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>{lang === 'zh' ? '计划结束' : 'Planned End'}</div>
                  <div style={{ fontWeight: 600 }}>{ps.work_order.planned_end?.slice(0, 10) || '—'}</div>
                </div>
              </div>

              {/* Quality Inspections */}
              {ps.quality_inspections?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '.78rem', fontWeight: 600, marginBottom: 6 }}>{lang === 'zh' ? '质检结果' : 'Quality Inspections'}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ps.quality_inspections.map((qi, i) => (
                      <div key={i} style={{
                        padding: '6px 10px', borderRadius: 8, fontSize: '.75rem',
                        background: qi.result === 'pass' ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)',
                        border: `1px solid ${qi.result === 'pass' ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)'}`,
                      }}>
                        <span style={{ fontWeight: 600, color: qi.result === 'pass' ? '#22c55e' : '#ef4444' }}>{qi.result}</span>
                        <span style={{ color: 'var(--text3)', marginLeft: 6 }}>{qi.pass_rate}% ({qi.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {ps.timeline?.length > 0 && (
                <div>
                  <div style={{ fontSize: '.78rem', fontWeight: 600, marginBottom: 6 }}>{lang === 'zh' ? '时间线' : 'Timeline'}</div>
                  <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 16 }}>
                    {ps.timeline.slice(0, 10).map((t, i) => (
                      <div key={i} style={{ marginBottom: 8, position: 'relative', fontSize: '.78rem' }}>
                        <div style={{ position: 'absolute', left: -22, top: 2, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--card)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{STAGE_ICONS[t.type] || '📌'} {t.summary}</span>
                          <span style={{ color: 'var(--text3)', fontSize: '.7rem', whiteSpace: 'nowrap', marginLeft: 8 }}>{t.time?.slice(0, 16).replace('T', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {trace.total_work_orders === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 32, fontSize: '.88rem' }}>
              {lang === 'zh' ? '该订单暂无关联的生产工单。供应商接入MES后将自动关联。' : 'No production work orders linked to this PO yet. They will appear once the supplier connects via MES.'}
            </div>
          )}
        </div>
      )}

      {trace?.error && (
        <div style={{ textAlign: 'center', color: '#ef4444', padding: 32, fontSize: '.88rem' }}>
          {lang === 'zh' ? '查询失败，请检查订单 ID' : 'Query failed, please check the PO ID'}
        </div>
      )}
    </>
  );
}
