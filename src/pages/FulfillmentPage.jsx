import { useState, useEffect, useCallback, Fragment } from 'react';
import * as api from '../api';
import { useI18n } from '../i18n';

const fmt = (n) => n == null ? '—' : typeof n === 'number' ? n.toLocaleString() : n;
const pct = (n) => n == null ? '—' : `${(n * 100).toFixed(1)}%`;

const STATUS_BADGE = {
  pending: 'badge-yellow', confirmed: 'badge-blue', in_production: 'badge-blue',
  shipped: 'badge-purple', delivered: 'badge-green', completed: 'badge-green',
  cancelled: 'badge-red', delayed: 'badge-red',
  requested: 'badge-yellow', approved: 'badge-blue', in_transit: 'badge-purple',
  received: 'badge-green', rejected: 'badge-red',
};

const MILESTONE_STATUS_COLOR = {
  pending: 'var(--text3)', in_progress: 'var(--accent)', completed: 'var(--green)', delayed: 'var(--red)',
};

export default function FulfillmentPage() {
  const { lang } = useI18n();
  const [dash, setDash] = useState({});
  const [orders, setOrders] = useState([]);
  const [samples, setSamples] = useState([]);
  const [view, setView] = useState('orders');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [sampleForm, setSampleForm] = useState({ supplier_name: '', product: '', quantity: 1, expected_date: '', notes: '' });

  const reload = useCallback(() => {
    api.fetchFulfillmentDash().then(d => setDash(d)).catch(() => {});
    api.fetchFulfillmentOrders().then(d => setOrders(d.orders || [])).catch(() => {});
    api.fetchFulfillmentSamples().then(d => setSamples(d.samples || [])).catch(() => {});
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleCheckDelays = async () => {
    await api.checkDelays();
    reload();
  };

  const handleCreateSample = async () => {
    await api.createFulfillmentSample(sampleForm);
    setShowSampleModal(false);
    setSampleForm({ supplier_name: '', product: '', quantity: 1, expected_date: '', notes: '' });
    reload();
  };

  const handleSampleStatus = async (id, status) => {
    await api.updateSampleStatus(id, { status });
    reload();
  };

  const toggleOrder = async (id) => {
    if (expandedOrder === id) { setExpandedOrder(null); return; }
    setExpandedOrder(id);
  };

  const kpis = [
    { label: 'Total Orders', value: fmt(dash.total_orders) },
    { label: 'On-time Rate', value: pct(dash.on_time_rate), color: dash.on_time_rate >= 0.9 ? 'var(--green)' : 'var(--yellow)' },
    { label: 'Avg Lead Time', value: dash.avg_lead_time_days != null ? `${dash.avg_lead_time_days}d` : '—' },
    { label: 'Active Samples', value: fmt(dash.active_samples) },
    { label: 'Delay Alerts', value: fmt(dash.delay_alerts_count), color: dash.delay_alerts_count > 0 ? 'var(--red)' : 'var(--green)' },
  ];

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? '履约管理' : 'Fulfillment Management'}</h2>
      <p className="page-sub">{lang === 'zh' ? '跟踪订单、里程碑、样品请求和交付表现' : 'Track orders, milestones, sample requests, and delivery performance'}</p>

      <div className="kpis">
        {kpis.map(k => (
          <div className="kpi" key={k.label}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={k.color ? { color: k.color } : undefined}>{k.value}</div>
          </div>
        ))}
      </div>

      {dash.delay_alerts_count > 0 && (
        <div className="panel" style={{ background: 'rgba(239,68,68,.08)', borderLeft: '4px solid var(--red)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="panel-title" style={{ color: 'var(--red)' }}>Delay Alerts</div>
              <div style={{ fontSize: '.85rem', color: 'var(--text2)' }}>{dash.delay_alerts_count} order(s) have been flagged with delays</div>
            </div>
            <button className="btn btn-primary" style={{ background: 'var(--red)' }} onClick={handleCheckDelays}>Check Delays</button>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-sm" style={view === 'orders' ? { background: 'var(--accent)', color: '#fff' } : {}} onClick={() => setView('orders')}>📦 Orders</button>
            <button className="btn-sm" style={view === 'samples' ? { background: 'var(--accent)', color: '#fff' } : {}} onClick={() => setView('samples')}>🧪 Samples</button>
          </div>
          {view === 'samples' && (
            <button className="btn btn-primary" onClick={() => setShowSampleModal(true)}>+ Sample Request</button>
          )}
        </div>

        {view === 'orders' && (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['PO', 'Supplier', 'Product', 'Qty', 'Amount', 'Status', 'Date', ''].map(h => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <Fragment key={o.id || o.po_number}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => toggleOrder(o.id)}>
                      <td className="td" style={{ fontWeight: 600 }}>{o.po_number || o.po_key || '—'}</td>
                      <td className="td">{o.supplier_name || `#${o.supplier_id}`}</td>
                      <td className="td">{o.product || '—'}</td>
                      <td className="td">{fmt(o.quantity)}</td>
                      <td className="td">${o.amount?.toLocaleString() || o.total_usd?.toLocaleString() || '0'}</td>
                      <td className="td"><span className={`badge ${STATUS_BADGE[o.status] || 'badge-blue'}`}>{o.status}</span></td>
                      <td className="td" style={{ fontSize: '.82rem' }}>{o.created_at?.slice(0, 10) || o.order_date || '—'}</td>
                      <td className="td" style={{ fontSize: '.82rem', color: 'var(--text3)' }}>{expandedOrder === o.id ? '▲' : '▼'}</td>
                    </tr>
                    {expandedOrder === o.id && (
                      <tr>
                        <td colSpan={8} className="td" style={{ background: 'var(--bg2)', padding: '16px 24px' }}>
                          <div style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 12 }}>Milestone Timeline</div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, position: 'relative' }}>
                            {(o.milestones || []).map((m, i, arr) => (
                              <div key={m.name} style={{ flex: 1, position: 'relative', textAlign: 'center' }}>
                                {i < arr.length - 1 && (
                                  <div style={{ position: 'absolute', top: 8, left: '50%', width: '100%', height: 2, background: MILESTONE_STATUS_COLOR[m.status] || 'var(--border)', zIndex: 0 }} />
                                )}
                                <div style={{ width: 18, height: 18, borderRadius: '50%', background: MILESTONE_STATUS_COLOR[m.status] || 'var(--text3)', margin: '0 auto', position: 'relative', zIndex: 1 }} />
                                <div style={{ fontSize: '.75rem', fontWeight: 600, marginTop: 6 }}>{m.name}</div>
                                <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>Exp: {m.expected_date?.slice(0, 10) || '—'}</div>
                                <div style={{ fontSize: '.7rem', color: 'var(--text2)' }}>Act: {m.actual_date?.slice(0, 10) || '—'}</div>
                                <span className={`badge ${STATUS_BADGE[m.status] || 'badge-blue'}`} style={{ fontSize: '.65rem', marginTop: 4 }}>{m.status}</span>
                              </div>
                            ))}
                            {(!o.milestones || o.milestones.length === 0) && (
                              <div style={{ color: 'var(--text3)', fontSize: '.82rem', padding: 12 }}>No milestones tracked for this order</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {!orders.length && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No orders yet</div>}
          </>
        )}

        {view === 'samples' && (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['ID', 'Supplier', 'Product', 'Qty', 'Status', 'Request Date', 'Expected Date', 'Tracking #', ''].map(h => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {samples.map(s => (
                  <tr key={s.id}>
                    <td className="td" style={{ fontWeight: 600 }}>#{s.id}</td>
                    <td className="td">{s.supplier_name || '—'}</td>
                    <td className="td">{s.product || '—'}</td>
                    <td className="td">{s.quantity}</td>
                    <td className="td"><span className={`badge ${STATUS_BADGE[s.status] || 'badge-blue'}`}>{s.status}</span></td>
                    <td className="td" style={{ fontSize: '.82rem' }}>{s.request_date?.slice(0, 10) || s.created_at?.slice(0, 10) || '—'}</td>
                    <td className="td" style={{ fontSize: '.82rem' }}>{s.expected_date?.slice(0, 10) || '—'}</td>
                    <td className="td" style={{ fontSize: '.82rem', fontFamily: 'monospace' }}>{s.tracking_number || '—'}</td>
                    <td className="td">
                      <div style={{ display: 'flex', gap: 4 }}>
                        {s.status === 'requested' && <button className="btn-sm" onClick={() => handleSampleStatus(s.id, 'approved')}>Approve</button>}
                        {s.status === 'approved' && <button className="btn-sm" onClick={() => handleSampleStatus(s.id, 'in_transit')}>Ship</button>}
                        {s.status === 'in_transit' && <button className="btn-sm" onClick={() => handleSampleStatus(s.id, 'received')}>Received</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!samples.length && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No sample requests yet</div>}
          </>
        )}
      </div>

      {showSampleModal && (
        <div className="modal-overlay" onClick={() => setShowSampleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>New Sample Request</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '.82rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Supplier Name</label>
                <input className="input" value={sampleForm.supplier_name} onChange={e => setSampleForm(p => ({ ...p, supplier_name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '.82rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Product</label>
                <input className="input" value={sampleForm.product} onChange={e => setSampleForm(p => ({ ...p, product: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '.82rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Quantity</label>
                <input className="input" type="number" min={1} value={sampleForm.quantity} onChange={e => setSampleForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <label style={{ fontSize: '.82rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Expected Date</label>
                <input className="input" type="date" value={sampleForm.expected_date} onChange={e => setSampleForm(p => ({ ...p, expected_date: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '.82rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Notes</label>
                <input className="input" value={sampleForm.notes} onChange={e => setSampleForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-secondary" onClick={() => setShowSampleModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreateSample}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
