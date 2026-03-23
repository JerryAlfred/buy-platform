import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

const DEFAULT_SPEC = { layers: 2, thickness: 1.6, width_mm: 100, height_mm: 100, quantity: 5, color: 'green', surface_finish: 'HASL', copper_weight: '1oz', min_trace: 0.15, min_hole: 0.3, smt: false };
const STATUS_BADGE = { draft: 'blue', quoted: 'blue', ordered: 'blue', in_production: 'yellow', shipped: 'purple', delivered: 'green', cancelled: 'red' };
const SOLDER_COLORS = { green: '#006633', red: '#990000', blue: '#003399', black: '#222', white: '#ccc', yellow: '#cc9900', purple: '#660099', matte_black: '#111' };

export default function PcbOrderPage() {
  const [tab, setTab] = useState('new');
  const [spec, setSpec] = useState({ ...DEFAULT_SPEC });
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [vendorOpts, setVendorOpts] = useState(null);
  const [vendor, setVendor] = useState('jlcpcb');
  const [notes, setNotes] = useState('');
  const [orderOk, setOrderOk] = useState(null);

  useEffect(() => {
    api.fetchPcbVendorOptions().then(setVendorOpts).catch(console.error);
    api.fetchPcbOrders().then(r => setOrders(r.items || [])).catch(console.error);
  }, []);

  const getQuote = useCallback(async () => {
    setQuoteLoading(true);
    try { setQuote(await api.fetchPcbQuote(spec)); } catch (e) { console.error(e); }
    finally { setQuoteLoading(false); }
  }, [spec]);

  useEffect(() => { const t = setTimeout(getQuote, 500); return () => clearTimeout(t); }, [getQuote]);

  const doOrder = async () => {
    const res = await api.createPcbOrder({ project_id: 0, vendor, spec, notes });
    setOrderOk(res);
    api.fetchPcbOrders().then(r => setOrders(r.items || []));
  };

  const doConfirm = async (id) => { await api.confirmPcbOrder(id); api.fetchPcbOrders().then(r => setOrders(r.items || [])); };

  const TABS = [{ id: 'new', label: '🛒 New Order' }, { id: 'orders', label: '📦 My Orders' }, { id: 'vendors', label: '🏭 Vendors' }];

  return (
    <div>
      <h2 className="page-title">PCB Order</h2>
      <p className="page-sub">Configure specs, get instant quotes, and order from JLCPCB / HuaQiu / PCBWay.</p>

      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 18px', fontSize: '.88rem', cursor: 'pointer', border: 'none', background: 'none', color: tab===t.id?'var(--accent)':'var(--text2)', borderBottom: tab===t.id?'2px solid var(--accent)':'2px solid transparent', fontWeight: tab===t.id?600:400 }}>{t.label}</button>
        ))}
      </div>

      {tab === 'new' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          <div>
            <div className="panel">
              <div className="panel-title" style={{ marginBottom: 16 }}>PCB Specifications</div>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 14 }}>
                <div><label style={{ fontSize: '.72rem', color: 'var(--text3)', display: 'block' }}>Layers</label><select className="select" value={spec.layers} onChange={e => setSpec(s => ({...s, layers: +e.target.value}))}>{[1,2,4,6,8].map(l => <option key={l} value={l}>{l} Layer</option>)}</select></div>
                <div><label style={{ fontSize: '.72rem', color: 'var(--text3)', display: 'block' }}>Thickness</label><select className="select" value={spec.thickness} onChange={e => setSpec(s => ({...s, thickness: +e.target.value}))}>{[0.6,.8,1,1.2,1.6,2].map(t => <option key={t} value={t}>{t}mm</option>)}</select></div>
                <div><label style={{ fontSize: '.72rem', color: 'var(--text3)', display: 'block' }}>Quantity</label><input className="input" type="number" min="5" value={spec.quantity} onChange={e => setSpec(s => ({...s, quantity: +e.target.value||5}))} /></div>
                <div><label style={{ fontSize: '.72rem', color: 'var(--text3)', display: 'block' }}>Width (mm)</label><input className="input" type="number" value={spec.width_mm} onChange={e => setSpec(s => ({...s, width_mm: +e.target.value||100}))} /></div>
                <div><label style={{ fontSize: '.72rem', color: 'var(--text3)', display: 'block' }}>Height (mm)</label><input className="input" type="number" value={spec.height_mm} onChange={e => setSpec(s => ({...s, height_mm: +e.target.value||100}))} /></div>
                <div><label style={{ fontSize: '.72rem', color: 'var(--text3)', display: 'block' }}>Surface</label><select className="select" value={spec.surface_finish} onChange={e => setSpec(s => ({...s, surface_finish: e.target.value}))}>{['HASL','HASL_Lead_Free','ENIG','OSP'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}</select></div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '.72rem', color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Solder Mask Color</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['green','red','blue','black','white','yellow','purple'].map(c => (
                    <button key={c} onClick={() => setSpec(s => ({...s,color:c}))} style={{ width: 32, height: 32, borderRadius: 6, border: spec.color===c?'2px solid var(--accent)':'2px solid var(--border)', background: SOLDER_COLORS[c], cursor: 'pointer' }} title={c} />
                  ))}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.88rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={spec.smt} onChange={e => setSpec(s => ({...s,smt:e.target.checked}))} /> Include SMT Assembly
              </label>
            </div>

            <div className="panel">
              <div className="panel-title" style={{ marginBottom: 12 }}>Vendor</div>
              <div style={{ display: 'flex', gap: 12 }}>
                {(vendorOpts?.vendors || [{ id: 'jlcpcb', name: 'JLCPCB / 嘉立创', lead_time_days: '3-5', api_available: true }, { id: 'huaqiu', name: '华秋', lead_time_days: '4-7' }, { id: 'pcbway', name: 'PCBWay', lead_time_days: '3-7' }]).map(v => (
                  <div key={v.id} onClick={() => setVendor(v.id)} className={`card${vendor===v.id?' active':''}`} style={{ flex: 1, cursor: 'pointer', padding: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{v.name}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: 4 }}>Lead: {v.lead_time_days}d</div>
                    {v.api_available && <span className="badge badge-green" style={{ marginTop: 4 }}>API</span>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '.72rem', color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Notes</label>
              <textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special requirements..." />
            </div>
          </div>

          <div>
            <div className="panel" style={{ position: 'sticky', top: 20 }}>
              <div className="panel-title" style={{ marginBottom: 16 }}>Quote</div>
              {quoteLoading ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)' }}>Calculating...</div> : quote ? (
                <>
                  {[['Board', `${spec.width_mm}x${spec.height_mm}mm`], ['Layers', spec.layers], ['Qty', `${spec.quantity} pcs`], ['Color', spec.color], ['Surface', spec.surface_finish.replace(/_/g,' ')]].map(([k,v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '.85rem' }}><span style={{ color: 'var(--text2)' }}>{k}</span><span>{v}</span></div>
                  ))}
                  {spec.smt && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '.85rem', color: 'var(--accent)' }}><span>SMT Assembly</span><span>Included</span></div>}
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '14px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', marginBottom: 4 }}><span style={{ color: 'var(--text2)' }}>Unit</span><span>¥{quote.unit_price_cny}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.25rem', color: 'var(--green)' }}><span>Total</span><span>¥{quote.total_cny}</span></div>
                  {quote.estimated && <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 6 }}>* Estimated. Final price may vary.</div>}
                </>
              ) : null}
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 18, padding: '12px 0' }} onClick={doOrder}>Place Order</button>
            </div>
            {orderOk && (
              <div className="panel" style={{ borderColor: 'var(--green)', marginTop: 14 }}>
                <div style={{ color: 'var(--green)', fontWeight: 600, marginBottom: 8 }}>Order Created!</div>
                <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
                  <div>ID: #{orderOk.id}</div><div>Status: {orderOk.status}</div><div>Amount: ¥{orderOk.quote_amount}</div>
                </div>
                <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => doConfirm(orderOk.id)}>Confirm & Pay</button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Order History</span><span style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{orders.length} orders</span></div>
          {orders.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No orders yet</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['ID','Vendor','Amount','Status','Date','Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="td">#{o.id}</td>
                    <td className="td">{o.vendor}</td>
                    <td className="td">¥{o.quote_amount}</td>
                    <td className="td"><span className={`badge badge-${STATUS_BADGE[o.status]||'blue'}`}>{o.status}</span></td>
                    <td className="td" style={{ color: 'var(--text2)', fontSize: '.8rem' }}>{o.created_at?new Date(o.created_at).toLocaleDateString():'—'}</td>
                    <td className="td">{o.status==='quoted' && <button className="btn-sm" style={{ background: 'var(--accent)', color: '#fff' }} onClick={() => doConfirm(o.id)}>Confirm</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'vendors' && (
        <div className="grid-3">
          {(vendorOpts?.vendors || []).map(v => (
            <div key={v.id} className="card" style={{ padding: 16 }}>
              <strong>{v.name}</strong>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginTop: 4 }}>Min: {v.min_order} pcs | Lead: {v.lead_time_days}d</div>
              {v.api_available && <span className="badge badge-green" style={{ marginTop: 6 }}>API Connected</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
