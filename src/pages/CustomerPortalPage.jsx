import { useState, useEffect } from 'react';
import * as api from '../api';

const STAGES = ['RFQ', 'Quote', 'PO', 'Production', 'QC', 'Ship', 'Deliver', 'Accept'];
const stageIndex = (s) => {
  const map = { pending_approval: 2, approved: 3, in_production: 3, shipped: 5, delivered: 6, completed: 7, cancelled: -1 };
  return map[s] ?? 0;
};

const EVIDENCE = {
  Production: [
    { type: 'photo', name: 'Assembly line — batch #2024-Q4', date: '2024-11-20' },
    { type: 'photo', name: 'Component inspection', date: '2024-11-18' },
  ],
  QC: [
    { type: 'doc', name: 'QC Report — Pass', date: '2024-12-01' },
    { type: 'photo', name: 'Final assembly photo', date: '2024-12-01' },
  ],
  Ship: [
    { type: 'doc', name: 'Bill of Lading', date: '2024-12-05' },
    { type: 'doc', name: 'Commercial Invoice', date: '2024-12-05' },
  ],
};

const MESSAGES = [
  { from: 'system', text: 'Order confirmed. Production scheduled to begin 2024-11-15.', time: '2024-11-10 09:00' },
  { from: 'supplier', text: 'Production started. Expected completion: 2024-11-30.', time: '2024-11-15 14:30' },
  { from: 'customer', text: 'Can we add 5 more units to this batch?', time: '2024-11-18 10:15' },
  { from: 'supplier', text: 'Yes, updated qty to 55 units. Delivery estimate unchanged.', time: '2024-11-18 16:45' },
  { from: 'system', text: 'QC inspection passed — 55/55 units. Ready for shipment.', time: '2024-12-01 11:00' },
  { from: 'supplier', text: 'Shipped via DHL. Tracking: 1234567890.', time: '2024-12-05 09:20' },
];

export default function CustomerPortalPage() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('timeline');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.fetchOrders().then(d => setOrders(d.orders || [])).catch(() => {});
  }, []);

  const activeStage = (order) => stageIndex(order.status);
  const detail = selected ? orders.find(o => o.id === selected) : null;

  const INVOICES = [
    { milestone: 'Deposit (30%)', amount: detail ? (detail.total_usd * 0.3).toFixed(2) : '0', status: 'paid', date: '2024-11-08' },
    { milestone: 'Production (40%)', amount: detail ? (detail.total_usd * 0.4).toFixed(2) : '0', status: 'paid', date: '2024-12-02' },
    { milestone: 'Delivery (30%)', amount: detail ? (detail.total_usd * 0.3).toFixed(2) : '0', status: detail?.status === 'completed' ? 'paid' : 'pending', date: detail?.status === 'completed' ? '2024-12-20' : '—' },
  ];

  return (
    <>
      <h2 className="page-title">Customer Order Portal</h2>
      <p className="page-sub">Track your orders, milestones, documents, and communications in one place</p>

      <div className="kpis">
        <div className="kpi"><div className="kpi-label">My Orders</div><div className="kpi-value">{orders.length}</div></div>
        <div className="kpi"><div className="kpi-label">In Transit</div><div className="kpi-value" style={{ color: 'var(--accent)' }}>{orders.filter(o => o.status === 'shipped').length}</div></div>
        <div className="kpi"><div className="kpi-label">Completed</div><div className="kpi-value" style={{ color: 'var(--green)' }}>{orders.filter(o => o.status === 'completed' || o.status === 'delivered').length}</div></div>
        <div className="kpi"><div className="kpi-label">Total Value</div><div className="kpi-value">${orders.reduce((s, o) => s + (o.total_usd || 0), 0).toLocaleString()}</div></div>
      </div>

      <div className={selected ? 'grid-sidebar' : ''} style={selected ? { gridTemplateColumns: '300px 1fr' } : {}}>
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Orders</span></div>
          {orders.map(o => (
            <div key={o.id} className={`card ${selected === o.id ? 'active' : ''}`} style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => { setSelected(o.id); setTab('timeline'); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{o.po_key}</strong>
                <span className={`badge ${o.status === 'completed' ? 'badge-green' : o.status === 'shipped' ? 'badge-blue' : 'badge-yellow'}`}>{o.status}</span>
              </div>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginTop: 4 }}>
                Verified Supplier · ${o.total_usd?.toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
                {STAGES.map((s, i) => (
                  <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= activeStage(o) ? 'var(--green)' : 'var(--border)' }} />
                ))}
              </div>
            </div>
          ))}
          {!orders.length && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No orders found</div>}
        </div>

        {detail && (
          <div>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{detail.po_key}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['timeline', 'evidence', 'messages', 'invoices'].map(t => (
                    <button key={t} className="btn-sm" style={tab === t ? { background: 'var(--accent)', color: '#fff' } : {}} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 0, marginBottom: 20, position: 'relative' }}>
                {STAGES.map((s, i) => {
                  const active = i <= activeStage(detail);
                  const current = i === activeStage(detail);
                  return (
                    <div key={s} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: active ? 'var(--green)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '.72rem', fontWeight: 700, color: active ? '#fff' : 'var(--text3)', border: current ? '2px solid var(--green)' : 'none', boxShadow: current ? '0 0 8px rgba(34,197,94,.4)' : 'none' }}>{i + 1}</div>
                      <div style={{ fontSize: '.68rem', marginTop: 4, color: active ? 'var(--text)' : 'var(--text3)', fontWeight: current ? 700 : 400 }}>{s}</div>
                      {i < STAGES.length - 1 && <div style={{ position: 'absolute', top: 13, left: '50%', right: '-50%', height: 2, background: i < activeStage(detail) ? 'var(--green)' : 'var(--border)', zIndex: -1 }} />}
                    </div>
                  );
                })}
              </div>

              {tab === 'timeline' && (
                <div style={{ paddingLeft: 20, borderLeft: '2px solid var(--border)' }}>
                  {STAGES.map((s, i) => {
                    const done = i <= activeStage(detail);
                    return (
                      <div key={s} style={{ position: 'relative', paddingBottom: 18, paddingLeft: 16 }}>
                        <div style={{ position: 'absolute', left: -27, top: 4, width: 12, height: 12, borderRadius: '50%', background: done ? 'var(--green)' : 'var(--border)' }} />
                        <div style={{ fontWeight: 600 }}>{s}</div>
                        <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
                          {done ? 'Completed' : i === activeStage(detail) + 1 ? 'Next step' : 'Pending'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === 'evidence' && (
                <div>
                  {Object.entries(EVIDENCE).map(([stage, items]) => (
                    <div key={stage} style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>{stage}</div>
                      <div className="grid-3">
                        {items.map((e, i) => (
                          <div key={i} className="card">
                            <div style={{ fontSize: '2rem', textAlign: 'center', padding: '12px 0' }}>{e.type === 'photo' ? '📷' : '📄'}</div>
                            <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{e.name}</div>
                            <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{e.date}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'messages' && (
                <div>
                  <div style={{ maxHeight: 340, overflowY: 'auto', marginBottom: 12 }}>
                    {MESSAGES.map((m, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.from === 'customer' ? 'var(--accent)' : m.from === 'supplier' ? 'var(--green)' : 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', color: '#fff', fontWeight: 700, flexShrink: 0 }}>{m.from[0].toUpperCase()}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600, fontSize: '.82rem' }}>{m.from === 'supplier' ? 'Verified Supplier' : m.from === 'customer' ? 'You' : 'System'}</span>
                            <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{m.time}</span>
                          </div>
                          <div style={{ fontSize: '.85rem', color: 'var(--text2)', marginTop: 2 }}>{m.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="ai-bar">
                    <input className="ai-input" placeholder="Type a message…" value={msg} onChange={e => setMsg(e.target.value)} />
                    <button className="ai-send" onClick={() => setMsg('')}>Send</button>
                  </div>
                </div>
              )}

              {tab === 'invoices' && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Milestone', 'Amount', 'Status', 'Date'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                  <tbody>{INVOICES.map(inv => (
                    <tr key={inv.milestone}>
                      <td className="td" style={{ fontWeight: 600 }}>{inv.milestone}</td>
                      <td className="td">${parseFloat(inv.amount).toLocaleString()}</td>
                      <td className="td"><span className={`badge ${inv.status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>{inv.status}</span></td>
                      <td className="td">{inv.date}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}

              <div className="panel" style={{ marginTop: 16, borderLeft: '4px solid var(--accent)' }}>
                <div className="panel-title" style={{ marginBottom: 8 }}>Next Actions</div>
                {[
                  activeStage(detail) < 6 && 'Awaiting delivery confirmation',
                  activeStage(detail) >= 6 && detail.status !== 'completed' && 'Review and accept delivery',
                  detail.payment_status !== 'paid' && 'Complete remaining payment',
                ].filter(Boolean).map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: '.85rem' }}>
                    <span style={{ color: 'var(--accent)' }}>→</span> {a}
                  </div>
                ))}
                {detail.status === 'completed' && <div style={{ color: 'var(--green)', fontWeight: 600, fontSize: '.88rem' }}>All milestones completed</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
