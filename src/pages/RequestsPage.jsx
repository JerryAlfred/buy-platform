import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'general', quantity: 1, budget_usd: 0, priority: 'normal' });

  const load = useCallback(() => {
    api.fetchRequests().then(d => setRequests(d.requests || [])).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    await api.createRequest(form);
    setShowAdd(false);
    setForm({ title: '', description: '', category: 'general', quantity: 1, budget_usd: 0, priority: 'normal' });
    load();
  };

  const handleAiSource = async (id) => { await api.aiSource(id); load(); };
  const handleUpdate = async (id, status) => { await api.updateRequest(id, { status }); load(); };

  const prioColor = { urgent: 'var(--red)', high: 'var(--orange)', normal: 'var(--accent)', low: 'var(--text3)' };
  const statusColor = { new: 'blue', sourcing: 'yellow', quoted: 'green', cancelled: 'red' };

  return (
    <>
      <h2 className="page-title">Supply Requests</h2>
      <p className="page-sub">Create procurement requests and let AI auto-source the best suppliers</p>

      <div className="kpis">
        {[
          { l: 'Total Requests', v: requests.length, c: 'var(--accent)' },
          { l: 'Active', v: requests.filter(r => !['cancelled', 'completed'].includes(r.status)).length, c: 'var(--green)' },
          { l: 'Sourcing', v: requests.filter(r => r.status === 'sourcing').length, c: 'var(--yellow)' },
          { l: 'Urgent', v: requests.filter(r => r.priority === 'urgent').length, c: 'var(--red)' },
        ].map(k => <div key={k.l} className="kpi"><div className="kpi-label">{k.l}</div><div className="kpi-value" style={{ color: k.c }}>{k.v}</div></div>)}
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">All Requests ({requests.length})</span>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ New Request</button>
        </div>
        {requests.length ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Title', 'Category', 'Qty', 'Budget', 'Priority', 'Status', 'AI Confidence', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td className="td" style={{ fontWeight: 600 }}>{r.title}</td>
                  <td className="td">{r.category}</td>
                  <td className="td">{r.quantity}</td>
                  <td className="td">{r.budget_usd ? `$${Number(r.budget_usd).toFixed(0)}` : '—'}</td>
                  <td className="td"><span style={{ color: prioColor[r.priority], fontWeight: 600 }}>{r.priority}</span></td>
                  <td className="td"><span className={`badge badge-${statusColor[r.status] || 'blue'}`}>{r.status}</span></td>
                  <td className="td">
                    {r.ai_confidence != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="progress" style={{ width: 60 }}><div className="progress-fill" style={{ width: `${r.ai_confidence * 100}%`, background: r.ai_confidence >= .7 ? 'var(--green)' : 'var(--yellow)' }} /></div>
                        <span style={{ fontSize: '.78rem' }}>{(r.ai_confidence * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </td>
                  <td className="td">
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-primary" style={{ padding: '3px 10px', fontSize: '.78rem' }} onClick={() => handleAiSource(r.id)}>AI Source</button>
                      {r.status === 'new' && <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '.78rem' }} onClick={() => handleUpdate(r.id, 'cancelled')}>Cancel</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
            <div>No supply requests yet — create one and let AI find the best suppliers</div>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>New Supply Request</h3>
            <div className="form-grid">
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Title *</label>
                <input className="input" placeholder="e.g. Robotic Gripper for SO-101" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Description</label>
                <textarea className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', minHeight: 60 }} />
              </div>
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Category</label>
                <select className="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%' }}>
                  {['general', 'mechanical', 'electronic', 'raw_material', 'service'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Quantity</label>
                <input className="input" type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Budget (USD)</label>
                <input className="input" type="number" min={0} value={form.budget_usd} onChange={e => setForm({ ...form, budget_usd: Number(e.target.value) })} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Priority</label>
                <select className="select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ width: '100%' }}>
                  {['low', 'normal', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!form.title}>Create</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
