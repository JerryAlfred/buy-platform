import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const STATUS_COLORS = { active: '#3b82f6', completed: '#22c55e', accepted: '#a855f7', cancelled: '#6b7280' };

export default function AutoNegPage() {
  const { lang } = useI18n();
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [running, setRunning] = useState(false);
  const [form, setForm] = useState({ product: '', quantity: 10, target_price: 0, max_price: 0, max_rounds: 5, strategy: 'competitive' });

  const loadList = useCallback(async () => {
    const res = await api.fetchAutoNegList();
    setSessions(res.sessions || []);
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const loadDetail = useCallback(async (id) => {
    const res = await api.fetchAutoNeg(id);
    setDetail(res);
  }, []);

  useEffect(() => { if (selectedId) loadDetail(selectedId); }, [selectedId, loadDetail]);

  const handleCreate = async () => {
    setRunning(true);
    const res = await api.startAutoNeg({ ...form, quantity: parseInt(form.quantity), target_price: parseFloat(form.target_price), max_price: parseFloat(form.max_price) });
    setRunning(false);
    if (res.session_id) {
      setSelectedId(res.session_id);
      setShowCreate(false);
    }
    loadList();
  };

  const handleNextRound = async () => {
    if (!selectedId) return;
    setRunning(true);
    await api.autoNegNextRound(selectedId);
    await loadDetail(selectedId);
    setRunning(false);
    loadList();
  };

  const handleAccept = async (idx = 0) => {
    if (!selectedId) return;
    await api.autoNegAccept(selectedId, idx);
    await loadDetail(selectedId);
    loadList();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>🤝 {lang === 'zh' ? 'AI 自动议价中心' : 'AI Auto-Negotiation Center'}</h2>
        <button onClick={() => setShowCreate(!showCreate)} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: 'linear-gradient(135deg,#3b82f6,#a855f7)', color: '#fff',
          fontWeight: 600, cursor: 'pointer',
        }}>+ {lang === 'zh' ? '新建议价' : 'New Negotiation'}</button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ padding: 16, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { key: 'product', label: lang === 'zh' ? '产品名称' : 'Product' },
              { key: 'quantity', label: lang === 'zh' ? '数量' : 'Quantity', type: 'number' },
              { key: 'target_price', label: lang === 'zh' ? '目标价($)' : 'Target Price($)', type: 'number' },
              { key: 'max_price', label: lang === 'zh' ? '最高可接受价($)' : 'Max Price($)', type: 'number' },
              { key: 'max_rounds', label: lang === 'zh' ? '最多轮次' : 'Max Rounds', type: 'number' },
              { key: 'strategy', label: lang === 'zh' ? '策略' : 'Strategy', options: ['competitive', 'partnership', 'aggressive', 'balanced'] },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{f.label}</label>
                {f.options ? (
                  <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{
                    width: '100%', padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 6, color: 'var(--text)', fontSize: '.82rem', marginTop: 3,
                  }}>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    type={f.type || 'text'} style={{
                      width: '100%', padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 6, color: 'var(--text)', fontSize: '.82rem', marginTop: 3,
                    }} />
                )}
              </div>
            ))}
          </div>
          <button onClick={handleCreate} disabled={running || !form.product} style={{
            marginTop: 10, padding: '8px 20px', borderRadius: 8, border: 'none',
            background: running ? 'var(--border)' : '#22c55e', color: '#fff',
            fontWeight: 600, cursor: running ? 'default' : 'pointer',
          }}>{running ? (lang === 'zh' ? 'AI 议价启动中...' : 'Starting AI...') : (lang === 'zh' ? '🚀 启动自动议价' : '🚀 Start Auto-Negotiation')}</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 1.5fr' : '1fr', gap: 16 }}>
        {/* Session list */}
        <div>
          {sessions.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', background: 'var(--card)', borderRadius: 10, border: '1px solid var(--border)' }}>
              {lang === 'zh' ? '暂无议价会话' : 'No negotiation sessions'}
            </div>
          )}
          {sessions.map(s => (
            <div key={s.id} onClick={() => setSelectedId(s.id)} style={{
              padding: '12px 16px', background: 'var(--card)',
              border: `1px solid ${s.id === selectedId ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 10, marginBottom: 8, cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '.86rem' }}>{s.product}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: '.68rem', fontWeight: 600,
                  background: `${STATUS_COLORS[s.status] || '#6b7280'}15`,
                  color: STATUS_COLORS[s.status] || '#6b7280',
                }}>{s.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: '.72rem', color: 'var(--text3)', marginTop: 4 }}>
                <span>x{s.quantity}</span>
                <span>{lang === 'zh' ? '目标' : 'Target'}: ${s.target_price}</span>
                <span>{lang === 'zh' ? '轮次' : 'Round'}: {s.current_round}/{s.max_rounds}</span>
                <span>{s.suppliers_count} {lang === 'zh' ? '家供应商' : 'suppliers'}</span>
              </div>
              {s.best_offer?.price > 0 && (
                <div style={{ marginTop: 4, fontSize: '.74rem', color: '#22c55e', fontWeight: 600 }}>
                  {lang === 'zh' ? '当前最优' : 'Best'}: ${s.best_offer.price} ({s.best_offer.supplier?.name || ''})
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {detail && (
          <div style={{ padding: 16, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>🤖 {detail.product} — {lang === 'zh' ? '议价详情' : 'Negotiation Detail'}</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {detail.status === 'active' && (
                  <>
                    <button onClick={handleNextRound} disabled={running} style={{
                      padding: '6px 14px', borderRadius: 7, border: 'none',
                      background: running ? 'var(--border)' : 'linear-gradient(135deg,#3b82f6,#a855f7)',
                      color: '#fff', fontWeight: 600, cursor: running ? 'default' : 'pointer', fontSize: '.78rem',
                    }}>{running ? '⏳' : '▶'} {lang === 'zh' ? '下一轮' : 'Next Round'}</button>
                    <button onClick={() => handleAccept(0)} style={{
                      padding: '6px 14px', borderRadius: 7, border: 'none',
                      background: '#22c55e', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '.78rem',
                    }}>✅ {lang === 'zh' ? '接受最优' : 'Accept Best'}</button>
                  </>
                )}
              </div>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
              {[
                { label: lang === 'zh' ? '目标价' : 'Target', val: `$${detail.target_price}`, color: '#3b82f6' },
                { label: lang === 'zh' ? '当前最优' : 'Best', val: detail.best_offer?.price ? `$${detail.best_offer.price}` : '—', color: '#22c55e' },
                { label: lang === 'zh' ? '轮次' : 'Round', val: `${detail.current_round}/${detail.max_rounds}`, color: '#f59e0b' },
                { label: lang === 'zh' ? '供应商数' : 'Suppliers', val: detail.suppliers?.length || 0, color: '#a855f7' },
              ].map((c, i) => (
                <div key={i} style={{ padding: '10px 12px', background: `${c.color}08`, border: `1px solid ${c.color}20`, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '.68rem', color: 'var(--text3)' }}>{c.label}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: c.color }}>{c.val}</div>
                </div>
              ))}
            </div>

            {/* Round-by-round details */}
            {(detail.rounds || []).map((round, ri) => (
              <div key={ri} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: '.8rem', marginBottom: 6, padding: '4px 10px', background: 'rgba(59,130,246,.05)', borderRadius: 6 }}>
                  {lang === 'zh' ? `第 ${round.round} 轮` : `Round ${round.round}`}
                  <span style={{ color: 'var(--text3)', fontSize: '.68rem', marginLeft: 8 }}>{round.timestamp?.slice(0, 19).replace('T', ' ')}</span>
                </div>
                {(round.messages || []).map((m, mi) => (
                  <div key={mi} style={{ marginLeft: 12, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 6, fontSize: '.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{m.supplier_name}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ padding: '1px 6px', borderRadius: 3, fontSize: '.64rem', background: '#f59e0b15', color: '#f59e0b' }}>
                          ${m.simulated_reply_price}
                        </span>
                        <span style={{ padding: '1px 6px', borderRadius: 3, fontSize: '.64rem', background: 'rgba(59,130,246,.1)', color: 'var(--accent)' }}>
                          {m.recommended_action}
                        </span>
                      </div>
                    </div>
                    <div style={{ color: 'var(--text2)', lineHeight: 1.4 }}>{m.message}</div>
                    {m.strategy_note && (
                      <div style={{ marginTop: 4, fontSize: '.68rem', color: 'var(--text3)', fontStyle: 'italic' }}>
                        💡 {m.strategy_note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* Result */}
            {detail.result?.supplier && (
              <div style={{ padding: 14, background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 10 }}>
                <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 6 }}>🎉 {lang === 'zh' ? '议价结果' : 'Negotiation Result'}</div>
                <div style={{ fontSize: '.82rem' }}>
                  {lang === 'zh' ? '供应商：' : 'Supplier: '}<b>{detail.result.supplier.name}</b>
                  <span style={{ marginLeft: 12 }}>{lang === 'zh' ? '最终价：' : 'Final: '}<b style={{ color: '#22c55e' }}>${detail.result.final_price}</b></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
