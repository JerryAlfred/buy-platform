import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { useI18n } from '../i18n';

export default function NegotiationPage() {
  const { lang } = useI18n();
  const [sessions, setSessions] = useState([]);
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [llmStatus, setLlmStatus] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [form, setForm] = useState({ supplier_name: '', product: '', quantity: 100, target_price: 0, max_price: 0, currency: 'USD', language: 'en', strategy: 'balanced', max_rounds: 6 });

  const load = useCallback(() => { api.fetchNegSessions().then(d => setSessions(d.sessions || [])).catch(() => {}); }, []);
  useEffect(() => { load(); api.getLlmNegStatus().then(setLlmStatus).catch(() => {}); }, [load]);
  useEffect(() => { if (sel) api.getNegSession(sel).then(setDetail).catch(() => {}); }, [sel]);

  const doCreate = async () => {
    const s = await api.createNegSession({ ...form, quantity: Number(form.quantity), target_price: Number(form.target_price), max_price: Number(form.max_price), max_rounds: Number(form.max_rounds) });
    setShowNew(false); load(); setSel(s.session_id);
  };
  const doGenerate = async () => { await api.generateNegMsg(sel); api.getNegSession(sel).then(setDetail); };
  const doReply = async () => { if (!replyText.trim()) return; await api.sendNegReply(sel, replyText); setReplyText(''); api.getNegSession(sel).then(setDetail); };

  const stColor = { active: 'var(--accent)', completed: 'var(--green)', failed: 'var(--red)', pending: 'var(--text3)' };

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? 'AI 议价引擎' : 'AI Negotiation Engine'}</h2>
      <p className="page-sub">{lang === 'zh' ? '多轮 LLM 驱动议价 — 自动生成买方消息、处理供应商回复、跨供应商竞价' : 'Multi-round LLM-powered negotiation — auto-generate buyer messages, process supplier replies, cross-supplier bidding'}</p>

      {llmStatus && <div className="kpis" style={{ marginBottom: 16 }}><div className="kpi"><div className="kpi-label">LLM Provider</div><div className="kpi-value" style={{ fontSize: '1rem' }}>{llmStatus.provider || 'N/A'}</div></div><div className="kpi"><div className="kpi-label">Model</div><div className="kpi-value" style={{ fontSize: '1rem' }}>{llmStatus.model || 'N/A'}</div></div><div className="kpi"><div className="kpi-label">Active Sessions</div><div className="kpi-value">{llmStatus.active_sessions || 0}</div></div></div>}

      <div className="grid-sidebar">
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Sessions</span><button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>+ New</button></div>
          {showNew && (
            <div style={{ marginBottom: 12, padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
              <div className="form-grid">
                <input className="input" placeholder="Supplier Name *" value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} />
                <input className="input" placeholder="Product *" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} />
                <input className="input" type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                <input className="input" type="number" placeholder="Target Price" value={form.target_price} onChange={e => setForm({ ...form, target_price: e.target.value })} />
                <input className="input" type="number" placeholder="Max Price" value={form.max_price} onChange={e => setForm({ ...form, max_price: e.target.value })} />
                <select className="select" value={form.strategy} onChange={e => setForm({ ...form, strategy: e.target.value })} style={{ width: '100%' }}>
                  {['aggressive','balanced','conservative','relationship_first'].map(s => <option key={s}>{s}</option>)}
                </select>
                <select className="select" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} style={{ width: '100%' }}>
                  <option value="en">English</option><option value="zh">中文</option>
                </select>
                <input className="input" type="number" placeholder="Max Rounds" value={form.max_rounds} onChange={e => setForm({ ...form, max_rounds: e.target.value })} />
              </div>
              <button className="btn btn-primary" style={{ marginTop: 8 }} disabled={!form.supplier_name || !form.product} onClick={doCreate}>Start Negotiation</button>
            </div>
          )}
          {sessions.map(s => (
            <div key={s.session_id} className={`card ${sel === s.session_id ? 'active' : ''}`} style={{ cursor: 'pointer', marginBottom: 6 }} onClick={() => setSel(s.session_id)}>
              <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{s.supplier_name}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{s.product} × {s.quantity}</div>
              <div style={{ display: 'flex', gap: 8, fontSize: '.78rem', marginTop: 4 }}>
                <span style={{ color: stColor[s.status] || 'var(--text3)' }}>{s.status}</span>
                <span>R{s.current_round}/{s.max_rounds}</span>
                {s.strategy && <span className="badge badge-blue">{s.strategy}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          {detail ? (<>
            <div className="panel-header">
              <div>
                <span className="panel-title">{detail.supplier_name} — {detail.product}</span>
                <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
                  Target: ${detail.target_price} · Max: ${detail.max_price} · Round {detail.current_round}/{detail.max_rounds}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={doGenerate}>AI Generate</button>
              </div>
            </div>

            <div style={{ maxHeight: 450, overflowY: 'auto', marginBottom: 12 }}>
              {(detail.messages || detail.chat_history || []).map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'buyer' || m.direction === 'out' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px', borderRadius: 12,
                    background: m.role === 'buyer' || m.direction === 'out' ? 'rgba(59,130,246,.15)' : 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 4 }}>
                      {m.role || m.sender} · {m.timestamp || m.created_at || ''}
                    </div>
                    <div style={{ fontSize: '.88rem', whiteSpace: 'pre-wrap' }}>{m.content || m.message}</div>
                    {m.ai_analysis && <div style={{ fontSize: '.78rem', color: 'var(--purple)', marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 4 }}>{JSON.stringify(m.ai_analysis)}</div>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" placeholder="Paste supplier reply here..." value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && doReply()} style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={doReply} disabled={!replyText.trim()}>Send Reply</button>
            </div>
          </>) : <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Select or create a negotiation session</div>}
        </div>
      </div>
    </>
  );
}
