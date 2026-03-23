import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { useI18n } from '../i18n';

export default function BrowserAgentPage() {
  const { lang } = useI18n();
  const [tasks, setTasks] = useState([]);
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [chat, setChat] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [form, setForm] = useState({ task_type: 'search_1688', platform: '1688', query: '', supplier_url: '' });

  const load = useCallback(() => { api.fetchBrowserTasks().then(d => setTasks(d.tasks || [])).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (sel) {
      api.getBrowserTask(sel).then(setDetail).catch(() => {});
      api.getBrowserChat(sel).then(d => setChat(d.chat_history || [])).catch(() => setChat([]));
    }
  }, [sel]);

  const doCreate = async () => {
    const t = await api.createBrowserTask(form);
    setShowNew(false); load(); setSel(t.task_id);
  };
  const doMsg = async () => {
    if (!msgInput.trim()) return;
    await api.sendBrowserMsg(sel, msgInput);
    setMsgInput('');
    api.getBrowserChat(sel).then(d => setChat(d.chat_history || []));
  };

  const typeOpts = [
    { v: 'search_1688', l: 'Search 1688' },
    { v: 'search_taobao', l: 'Search Taobao' },
    { v: 'search_alibaba', l: 'Search Alibaba' },
    { v: 'contact_supplier', l: 'Contact Supplier' },
    { v: 'chat_with_supplier', l: 'Chat with Supplier' },
    { v: 'scrape_product', l: 'Scrape Product Page' },
  ];

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? '浏览器代理' : 'Browser Agent'}</h2>
      <p className="page-sub">{lang === 'zh' ? 'Playwright 驱动 — 搜索 1688 / 淘宝 / 阿里巴巴，抓取供应商，自动客服聊天' : 'Playwright-powered — search 1688 / Taobao / Alibaba, scrape suppliers, auto-chat with customer service'}</p>

      <div className="grid-sidebar">
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Tasks</span><button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>+ New</button></div>
          {showNew && (
            <div style={{ marginBottom: 12, padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
              <select className="select" value={form.task_type} onChange={e => setForm({ ...form, task_type: e.target.value })} style={{ width: '100%', marginBottom: 6 }}>
                {typeOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
              <select className="select" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} style={{ width: '100%', marginBottom: 6 }}>
                {['1688', 'taobao', 'alibaba'].map(p => <option key={p}>{p}</option>)}
              </select>
              <input className="input" placeholder="Search query / keywords" value={form.query} onChange={e => setForm({ ...form, query: e.target.value })} style={{ marginBottom: 6 }} />
              <input className="input" placeholder="Supplier URL (optional)" value={form.supplier_url} onChange={e => setForm({ ...form, supplier_url: e.target.value })} style={{ marginBottom: 6 }} />
              <button className="btn btn-primary" disabled={!form.query} onClick={doCreate}>Launch</button>
            </div>
          )}
          {tasks.map(t => (
            <div key={t.task_id} className={`card ${sel === t.task_id ? 'active' : ''}`} style={{ cursor: 'pointer', marginBottom: 6 }} onClick={() => setSel(t.task_id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '.85rem' }}>{t.task_type}</strong>
                <span className={`badge badge-${t.status === 'completed' ? 'green' : t.status === 'running' ? 'yellow' : t.status === 'failed' ? 'red' : 'blue'}`}>{t.status}</span>
              </div>
              <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{t.platform} · {t.query?.slice(0, 30)}</div>
            </div>
          ))}
        </div>

        <div className="panel">
          {detail ? (<>
            <div className="panel-header">
              <div>
                <span className="panel-title">{detail.task_type}</span>
                <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{detail.platform} · {detail.query}</div>
              </div>
              {detail.status === 'running' && <button className="btn btn-secondary" onClick={async () => { await api.cancelBrowserTask(sel); load(); }}>Cancel</button>}
            </div>

            {detail.results?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.85rem' }}>Results ({detail.results.length})</div>
                {detail.results.slice(0, 10).map((r, i) => (
                  <div key={i} className="card" style={{ marginBottom: 6 }}>
                    <strong>{r.title || r.name || `Result ${i + 1}`}</strong>
                    {r.price && <span style={{ color: 'var(--green)', marginLeft: 8 }}>{r.price}</span>}
                    {r.url && <div style={{ fontSize: '.78rem', color: 'var(--accent)' }}>{r.url.slice(0, 60)}...</div>}
                    {r.supplier && <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{r.supplier}</div>}
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.85rem' }}>Chat / Messages</div>
            <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 12 }}>
              {chat.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' || m.direction === 'out' ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                  <div style={{ maxWidth: '80%', padding: '8px 12px', borderRadius: 10, background: m.role === 'user' ? 'rgba(59,130,246,.12)' : 'var(--bg)', border: '1px solid var(--border)', fontSize: '.85rem' }}>
                    {m.content || m.message || JSON.stringify(m)}
                  </div>
                </div>
              ))}
              {!chat.length && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: '.82rem' }}>No messages yet</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" placeholder="Send message to browser agent..." value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && doMsg()} style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={doMsg}>Send</button>
            </div>
          </>) : <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Select or create a browser task</div>}
        </div>
      </div>
    </>
  );
}
