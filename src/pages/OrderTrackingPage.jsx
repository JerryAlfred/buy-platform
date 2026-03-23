import { useState, useEffect } from 'react';
import * as api from '../api';

export default function OrderTrackingPage() {
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  useEffect(() => {
    api.fetchOrders().then(d => setOrders(d.orders || [])).catch(() => {});
    api.fetchEvents({ entity_type: 'order', limit: 30 }).then(d => setEvents(d.events || [])).catch(() => {});
  }, []);

  const statusIcon = { pending_approval: '⏳', approved: '✅', in_production: '🏭', shipped: '🚢', delivered: '📦', completed: '🎉', cancelled: '❌' };
  const overdue = orders.filter(o => o.expected_delivery && new Date(o.expected_delivery) < new Date() && o.status !== 'completed' && o.status !== 'delivered');

  return (
    <>
      <h2 className="page-title">Order Tracking</h2>
      <p className="page-sub">Shipment tracking, delay alerts, auto follow-up reminders</p>

      <div className="kpis">
        <div className="kpi"><div className="kpi-label">Total Orders</div><div className="kpi-value">{orders.length}</div></div>
        <div className="kpi"><div className="kpi-label">Pending Approval</div><div className="kpi-value" style={{ color: 'var(--yellow)' }}>{orders.filter(o => o.status === 'pending_approval').length}</div></div>
        <div className="kpi"><div className="kpi-label">In Production</div><div className="kpi-value" style={{ color: 'var(--accent)' }}>{orders.filter(o => o.status === 'in_production' || o.status === 'approved').length}</div></div>
        <div className="kpi"><div className="kpi-label">Shipped</div><div className="kpi-value" style={{ color: 'var(--purple)' }}>{orders.filter(o => o.status === 'shipped').length}</div></div>
        <div className="kpi"><div className="kpi-label">Overdue</div><div className="kpi-value" style={{ color: 'var(--red)' }}>{overdue.length}</div></div>
      </div>

      {overdue.length > 0 && (
        <div className="panel" style={{ borderLeft: '4px solid var(--red)' }}>
          <div className="panel-title" style={{ color: 'var(--red)' }}>Overdue Orders — Auto Follow-up Triggered</div>
          {overdue.map(o => (
            <div key={o.id} className="card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>{o.po_key}</strong> · Supplier #{o.supplier_id} · Expected: {o.expected_delivery?.slice(0, 10)}</div>
              <button className="btn-sm" style={{ background: 'var(--red)', color: '#fff' }}>Send Reminder</button>
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <div className="panel-title">All Orders</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead><tr>{['PO #','Supplier','Total','Status','Payment','Shipping','Tracking','Expected',''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>{orders.map(o => (
            <tr key={o.id}>
              <td className="td" style={{ fontWeight: 600 }}>{o.po_key}</td>
              <td className="td">#{o.supplier_id}</td>
              <td className="td">${o.total_usd?.toFixed(2)}</td>
              <td className="td"><span style={{ fontSize: '1rem' }}>{statusIcon[o.status] || '❓'}</span> <span className="badge badge-blue">{o.status}</span></td>
              <td className="td"><span className={`badge badge-${o.payment_status === 'paid' ? 'green' : 'yellow'}`}>{o.payment_status || 'pending'}</span></td>
              <td className="td"><span className={`badge badge-${o.shipping_status === 'shipped' ? 'green' : 'blue'}`}>{o.shipping_status || 'pending'}</span></td>
              <td className="td" style={{ fontSize: '.82rem' }}>{o.tracking_number || '—'}</td>
              <td className="td" style={{ fontSize: '.82rem' }}>{o.expected_delivery?.slice(0, 10) || '—'}</td>
              <td className="td">
                {o.status === 'pending_approval' && <button className="btn-sm" onClick={async () => { await api.approveOrder(o.id); api.fetchOrders().then(d => setOrders(d.orders || [])); }}>Approve</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
        {!orders.length && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No orders yet</div>}
      </div>

      <div className="panel">
        <div className="panel-title">Auto Follow-up Rules</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Trigger','Action','Channel'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {[
              { trigger: '3 days no reply after inquiry', action: 'Send gentle reminder', channel: 'Email / WeChat' },
              { trigger: 'Delivery date passed', action: 'Ask for shipping update + new ETA', channel: 'Email + Platform' },
              { trigger: '7 days overdue', action: 'Escalate — flag risk alert', channel: 'All channels' },
              { trigger: 'Tracking number received', action: 'Auto-update shipping status', channel: 'System' },
              { trigger: 'Delivery confirmed', action: 'Request inspection / quality check', channel: 'Platform' },
            ].map(r => (
              <tr key={r.trigger}>
                <td className="td" style={{ fontWeight: 600 }}>{r.trigger}</td>
                <td className="td">{r.action}</td>
                <td className="td"><span className="badge badge-blue">{r.channel}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {events.length > 0 && (
        <div className="panel">
          <div className="panel-title">Recent Order Events</div>
          {events.slice(0, 15).map(e => (
            <div key={e.id} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.85rem' }}>
              <span style={{ color: 'var(--text3)', minWidth: 80 }}>{e.created_at?.slice(0, 10)}</span>
              <span className="badge badge-blue">{e.type}</span>
              <span>{e.summary}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
