import { useState, useEffect } from 'react';
import * as api from '../api';
import { useI18n } from '../i18n';

const MILESTONES = [
  { key: 'deposit', label: 'Deposit', pct: 30, icon: '💰' },
  { key: 'sample_complete', label: 'Sample Complete', pct: 0, icon: '🧪' },
  { key: 'evt', label: 'EVT (Engineering Validation)', pct: 0, icon: '⚙️' },
  { key: 'dvt', label: 'DVT (Design Validation)', pct: 20, icon: '🔬' },
  { key: 'pvt', label: 'PVT (Production Validation)', pct: 20, icon: '🏭' },
  { key: 'pre_shipment', label: 'Pre-Shipment Balance', pct: 25, icon: '📦' },
  { key: 'delivery_accepted', label: 'Delivery Accepted', pct: 5, icon: '✅' },
];

export default function MilestonePage() {
  const { lang } = useI18n();
  const [orders, setOrders] = useState([]);
  const [sel, setSel] = useState(null);
  useEffect(() => { api.fetchOrders().then(d => setOrders(d.orders || [])).catch(() => {}); }, []);

  const selOrder = orders.find(o => o.id === sel);

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? '里程碑付款' : 'Milestone Payments'}</h2>
      <p className="page-sub">{lang === 'zh' ? '阶段门控付款 — 定金、样品、EVT/DVT/PVT、发货、验收' : 'Stage-gated payment control — deposit, sample, EVT/DVT/PVT, shipment, acceptance'}</p>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-title">Payment Stage Template</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          {MILESTONES.map((m, i) => (
            <div key={m.key} style={{ flex: m.pct || 1, position: 'relative' }}>
              <div style={{ height: 36, background: i < 2 ? 'var(--green)' : i < 4 ? 'var(--accent)' : 'var(--border)', borderRadius: i === 0 ? '6px 0 0 6px' : i === MILESTONES.length - 1 ? '0 6px 6px 0' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 600, color: i < 4 ? '#fff' : 'var(--text3)' }}>
                {m.icon} {m.pct > 0 ? `${m.pct}%` : ''}
              </div>
              <div style={{ textAlign: 'center', fontSize: '.68rem', color: 'var(--text2)', marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-sidebar">
        <div className="panel">
          <div className="panel-title">Orders ({orders.length})</div>
          {orders.map(o => (
            <div key={o.id} className={`card ${sel === o.id ? 'active' : ''}`} style={{ cursor: 'pointer', marginBottom: 6 }} onClick={() => setSel(o.id)}>
              <strong>{o.po_key}</strong>
              <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>${o.total_usd?.toFixed(2)} · Supplier #{o.supplier_id}</div>
              <span className={`badge badge-${o.status === 'approved' ? 'green' : o.status === 'pending_approval' ? 'yellow' : 'blue'}`}>{o.status}</span>
            </div>
          ))}
          {!orders.length && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)' }}>No orders yet</div>}
        </div>

        <div className="panel">
          {selOrder ? (<>
            <h3>{selOrder.po_key}</h3>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: '.85rem' }}>
              <span>Total: <strong>${selOrder.total_usd?.toFixed(2)}</strong></span>
              <span>Payment: <span className={`badge badge-${selOrder.payment_status === 'paid' ? 'green' : 'yellow'}`}>{selOrder.payment_status || 'pending'}</span></span>
              <span>Shipping: <span className="badge badge-blue">{selOrder.shipping_status || 'pending'}</span></span>
            </div>
            <div className="panel-title" style={{ marginBottom: 12 }}>Milestone Timeline</div>
            {MILESTONES.map((m, i) => {
              const done = i < 2;
              return (
                <div key={m.key} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'rgba(34,197,94,.15)' : 'var(--bg)', border: `2px solid ${done ? 'var(--green)' : 'var(--border)'}`, fontSize: '1rem' }}>{done ? '✓' : m.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '.88rem', color: done ? 'var(--green)' : 'var(--text)' }}>{m.label}</div>
                    {m.pct > 0 && <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>Release {m.pct}% (${(selOrder.total_usd * m.pct / 100).toFixed(2)})</div>}
                    <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>
                      {done ? 'Completed' : 'Awaiting evidence / inspector verification'}
                    </div>
                  </div>
                  <div>
                    {done ? <span className="badge badge-green">Released</span> : <button className="btn-sm">Verify & Release</button>}
                  </div>
                </div>
              );
            })}
          </>) : <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Select an order to manage milestones</div>}
        </div>
      </div>
    </>
  );
}
