import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const STAGE_COLORS = { planned: '#3b82f6', in_progress: '#f59e0b', completed: '#22c55e' };
const RISK_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' };

export default function BuyerSchedulePage() {
  const { lang } = useI18n();
  const zh = lang === 'zh';
  const [views, setViews] = useState([]);
  const [activeView, setActiveView] = useState(null);
  const [poSearch, setPoSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.fetchBuyerViews().then(setViews).catch(() => {}); }, []);

  const loadView = useCallback(async (poId) => {
    setLoading(true);
    try {
      const v = await api.fetchBuyerView(poId);
      setActiveView(v);
    } catch { setActiveView(null); }
    setLoading(false);
  }, []);

  const searchPo = useCallback(async () => {
    if (!poSearch) return;
    const id = parseInt(poSearch, 10);
    if (!isNaN(id)) loadView(id);
  }, [poSearch, loadView]);

  return (
    <div>
      <h2 className="page-title">{zh ? '买家排产看板' : 'Buyer Schedule Dashboard'}</h2>
      <p className="page-sub">{zh ? '实时追踪供应商排产进度 · 里程碑 · 风险预警 · 预计发货日期' : 'Real-time supplier scheduling progress · Milestones · Risk alerts · Estimated ship date'}</p>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input value={poSearch} onChange={e => setPoSearch(e.target.value)} placeholder={zh ? '输入采购订单 ID...' : 'Enter PO ID...'} onKeyDown={e => e.key === 'Enter' && searchPo()} style={{ flex: 1, maxWidth: 300, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }} />
        <button onClick={searchPo} style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>{zh ? '查询' : 'Search'}</button>
      </div>

      {/* List of all buyer views */}
      {!activeView && (
        <div style={{ display: 'grid', gap: 10 }}>
          {views.map(v => (
            <div key={v.po_id} onClick={() => loadView(v.po_id)} style={{ background: 'var(--card)', borderRadius: 10, padding: 16, border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>PO #{v.po_id}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  <span style={{ background: STAGE_COLORS[v.current_stage] || '#6b7280', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{v.current_stage}</span>
                  {v.buyer_org && ` · ${v.buyer_org}`}
                  {` · ${zh ? '信心' : 'Confidence'}: ${v.confidence}%`}
                  {v.risk_count > 0 && <span style={{ color: '#ef4444', marginLeft: 8 }}>⚠ {v.risk_count} {zh ? '个风险' : 'risks'}</span>}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {v.estimated_ship_date && `${zh ? '预计发货' : 'Ship'}: ${v.estimated_ship_date.slice(0, 10)}`}
              </div>
            </div>
          ))}
          {!views.length && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>{zh ? '暂无排产视图，请让供应商同步数据' : 'No schedule views yet. Ask supplier to sync.'}</div>}
        </div>
      )}

      {/* Active detail view */}
      {loading && <div style={{ textAlign: 'center', padding: 40 }}>⏳ {zh ? '加载中...' : 'Loading...'}</div>}
      {activeView && !loading && (
        <div>
          <button onClick={() => setActiveView(null)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer', marginBottom: 16 }}>
            ← {zh ? '返回列表' : 'Back'}
          </button>

          {/* Header KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
            <div style={{ background: 'var(--card)', borderRadius: 8, padding: 16, border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>PO</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>#{activeView.po_id}</div>
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 8, padding: 16, border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{zh ? '当前阶段' : 'Stage'}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: STAGE_COLORS[activeView.current_stage] }}>{activeView.current_stage}</div>
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 8, padding: 16, border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{zh ? '交付信心' : 'Confidence'}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: activeView.confidence >= 70 ? '#22c55e' : '#f59e0b' }}>{activeView.confidence}%</div>
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 8, padding: 16, border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{zh ? '预计发货' : 'Est. Ship'}</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{activeView.estimated_ship_date?.slice(0, 10) || '—'}</div>
            </div>
          </div>

          {/* Risk flags */}
          {activeView.risk_flags?.length > 0 && (
            <div style={{ background: '#fef2f2', borderRadius: 10, padding: 14, border: '1px solid #fca5a5', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>⚠ {zh ? '风险预警' : 'Risk Alerts'}</div>
              {activeView.risk_flags.map((r, i) => (
                <div key={i} style={{ fontSize: 13, padding: '4px 0' }}>
                  <span style={{ background: RISK_COLORS[r.severity], color: '#fff', padding: '2px 6px', borderRadius: 3, fontSize: 11, marginRight: 6 }}>{r.severity}</span>
                  <strong>{r.wo_key}</strong> — {r.flag === 'deadline_near' ? (zh ? '即将到期' : 'Deadline approaching') : r.flag === 'high_defect_rate' ? (zh ? '良率偏低' : 'High defect rate') : r.flag}
                </div>
              ))}
            </div>
          )}

          {/* Schedule details */}
          <div style={{ background: 'var(--card)', borderRadius: 10, padding: 16, border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>{zh ? '工单排产明细' : 'Work Order Schedule Details'}</div>
            {activeView.schedule?.map((s, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < activeView.schedule.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{s.wo_key}</span>
                    <span style={{ color: 'var(--muted)', marginLeft: 8 }}>{s.product}</span>
                    <span style={{ background: STAGE_COLORS[s.status] || '#6b7280', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 11, marginLeft: 8 }}>{s.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{s.qty_completed}/{s.qty_ordered}</div>
                </div>
                {/* Progress bar */}
                <div style={{ marginTop: 6, background: '#e5e7eb', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${s.progress_pct}%`, height: '100%', background: s.progress_pct >= 100 ? '#22c55e' : '#3b82f6', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  <span>{zh ? '进度' : 'Progress'}: {s.progress_pct}%</span>
                  <span>{s.planned_start?.slice(0, 10)} → {s.planned_end?.slice(0, 10)}</span>
                </div>
              </div>
            ))}
            {!activeView.schedule?.length && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 20 }}>{zh ? '暂无排产信息' : 'No schedule data'}</div>}
          </div>

          {/* Milestones timeline */}
          {activeView.milestones?.length > 0 && (
            <div style={{ background: 'var(--card)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>{zh ? '里程碑' : 'Milestones'}</div>
              {activeView.milestones.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: m.status === 'completed' ? '#22c55e' : m.status === 'in_progress' ? '#f59e0b' : '#6b7280', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{m.label}</div>
                    {m.target && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m.target.slice(0, 10)}</div>}
                  </div>
                  {m.progress !== undefined && <div style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>{m.progress}%</div>}
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right', marginTop: 8 }}>
            {zh ? '最后同步' : 'Last synced'}: {activeView.last_synced_at?.slice(0, 19).replace('T', ' ')}
          </div>
        </div>
      )}
    </div>
  );
}
