import { useState, useEffect } from 'react';
import * as api from '../api';

function PackageCard({ pkg, selected, onToggle }) {
  return (
    <div style={{ background: '#16213e', borderRadius: 8, padding: 16, borderLeft: `4px solid ${pkg.color}`, opacity: selected ? 1 : 0.6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={selected} onChange={onToggle} />
            <span style={{ fontSize: 18 }}>{pkg.icon}</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{pkg.package_name}</span>
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{pkg.package_name_zh} | {pkg.item_count} items</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#34d399' }}>${pkg.total?.toFixed(2)}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{pkg.lead_days} days lead</div>
        </div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {(pkg.suppliers || []).map(s => <span key={s} style={{ background: '#2a2a4a', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#aaa' }}>{s}</span>)}
      </div>
      <div style={{ marginTop: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <tbody>
            {(pkg.items || []).slice(0, 5).map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                <td style={{ padding: '3px 4px' }}>{item.part}</td>
                <td style={{ padding: '3px 4px', textAlign: 'right', color: '#888' }}>×{item.qty}</td>
                <td style={{ padding: '3px 4px', textAlign: 'right', color: '#34d399' }}>${(item.qty * item.unit_cost).toFixed(2)}</td>
              </tr>
            ))}
            {(pkg.items || []).length > 5 && <tr><td colSpan={3} style={{ padding: '3px 4px', color: '#888', fontSize: 11 }}>... and {pkg.items.length - 5} more items</td></tr>}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#888' }}>
        <span>Parts: ${pkg.subtotal?.toFixed(2)}</span>
        <span>Shipping: ${pkg.shipping_cost?.toFixed(2)}</span>
      </div>
    </div>
  );
}

export default function PrototypeBundlePage() {
  const [bomItems, setBomItems] = useState([]);
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPkgs, setSelectedPkgs] = useState([]);
  const [order, setOrder] = useState(null);
  const [shippingSpeed, setShippingSpeed] = useState('standard');
  const [shippingOptions, setShippingOptions] = useState([]);
  const [addPart, setAddPart] = useState('');
  const [addCat, setAddCat] = useState('Passive');
  const [addQty, setAddQty] = useState('1');
  const [addCost, setAddCost] = useState('0');

  useEffect(() => {
    api.fetchDemoBom().then(r => setBomItems(r.items || [])).catch(() => {});
    api.fetchShippingOptions().then(r => setShippingOptions(r.options || [])).catch(() => {});
  }, []);

  const splitBom = async () => {
    setLoading(true); setOrder(null);
    try {
      const r = await api.splitBom({ project_name: 'My Prototype', items: bomItems, shipping_speed: shippingSpeed });
      setBundle(r);
      setSelectedPkgs((r.packages || []).map(p => p.package_id));
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const checkout = async () => {
    if (!bundle) return;
    try {
      const r = await api.checkoutBundle({ bundle_id: bundle.id, packages: selectedPkgs });
      setOrder(r);
    } catch (e) { /* ignore */ }
  };

  const togglePkg = (id) => {
    setSelectedPkgs(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const addItem = () => {
    if (!addPart) return;
    setBomItems(prev => [...prev, { part: addPart, category: addCat, qty: parseInt(addQty) || 1, unit_cost: parseFloat(addCost) || 0 }]);
    setAddPart('');
  };

  const removeItem = (i) => setBomItems(prev => prev.filter((_, idx) => idx !== i));

  const selectedTotal = bundle ? (bundle.packages || []).filter(p => selectedPkgs.includes(p.package_id)).reduce((s, p) => s + p.total, 0) : 0;

  const S = { page: { padding: 24 }, card: { background: '#1a1a2e', borderRadius: 8, padding: 16, marginBottom: 12 } };

  return (
    <div style={S.page}>
      <h2 style={{ margin: '0 0 4px' }}>Prototype Bundle</h2>
      <p style={{ color: '#aaa', margin: '0 0 16px', fontSize: 14 }}>Upload your BOM and we split it into optimized procurement packages. One-click checkout across all suppliers.</p>

      {!bundle && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>BOM ({bomItems.length} items)</h3>
            <button onClick={() => api.fetchDemoBom().then(r => setBomItems(r.items || []))} style={{ background: '#16213e', border: '1px solid #333', borderRadius: 4, color: '#aaa', padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Load Demo BOM</button>
          </div>

          <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ textAlign: 'left', padding: 6, color: '#aaa' }}>Part</th>
                <th style={{ textAlign: 'left', padding: 6, color: '#aaa' }}>Category</th>
                <th style={{ textAlign: 'right', padding: 6, color: '#aaa' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: 6, color: '#aaa' }}>Unit $</th>
                <th style={{ width: 30 }} />
              </tr></thead>
              <tbody>
                {bomItems.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: 6 }}>{item.part}</td>
                    <td style={{ padding: 6 }}><span style={{ background: '#2a2a4a', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>{item.category}</span></td>
                    <td style={{ padding: 6, textAlign: 'right' }}>{item.qty}</td>
                    <td style={{ padding: 6, textAlign: 'right', color: '#34d399' }}>${item.unit_cost}</td>
                    <td><button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, alignItems: 'end' }}>
            <input value={addPart} onChange={e => setAddPart(e.target.value)} placeholder="Part name" style={{ background: '#111', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', color: '#fff', flex: 1, minWidth: 150 }} />
            <select value={addCat} onChange={e => setAddCat(e.target.value)} style={{ background: '#111', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', color: '#fff' }}>
              {['MCU/SoC','Sensor','Motor Driver','Power','Connector','Passive','Discrete','PCB','3D Print','CNC','Fasteners','Bearings','Sheet Metal','Custom Mechanical'].map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="number" value={addQty} onChange={e => setAddQty(e.target.value)} placeholder="Qty" style={{ background: '#111', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', color: '#fff', width: 60 }} />
            <input type="number" value={addCost} onChange={e => setAddCost(e.target.value)} placeholder="Unit $" style={{ background: '#111', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', color: '#fff', width: 80 }} />
            <button onClick={addItem} style={{ background: '#34d399', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>Add</button>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={shippingSpeed} onChange={e => setShippingSpeed(e.target.value)} style={{ background: '#111', border: '1px solid #333', borderRadius: 6, padding: '8px 12px', color: '#fff' }}>
              {shippingOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <button onClick={splitBom} disabled={loading || bomItems.length === 0} style={{ background: '#2563eb', border: 'none', borderRadius: 6, color: '#fff', padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14, flex: 1 }}>
              {loading ? 'Splitting...' : 'Split BOM into Packages'}
            </button>
          </div>
        </div>
      )}

      {bundle && !order && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0 }}>Procurement Packages</h3>
              <div style={{ fontSize: 13, color: '#aaa' }}>{bundle.total_items} items across {bundle.packages?.length} packages</div>
            </div>
            <button onClick={() => { setBundle(null); setOrder(null); }} style={{ background: 'none', border: '1px solid #555', borderRadius: 6, color: '#aaa', padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>{'← Edit BOM'}</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 12, marginBottom: 16 }}>
            {(bundle.packages || []).map(pkg => (
              <PackageCard key={pkg.package_id} pkg={pkg} selected={selectedPkgs.includes(pkg.package_id)} onToggle={() => togglePkg(pkg.package_id)} />
            ))}
          </div>

          <div style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#16213e', borderTop: '3px solid #2563eb' }}>
            <div>
              <div style={{ fontSize: 13, color: '#aaa' }}>{selectedPkgs.length} packages selected</div>
              <div style={{ fontSize: 11, color: '#888' }}>Max lead time: {bundle.max_lead_days} days</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#34d399' }}>${selectedTotal.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: '#888' }}>Total incl. shipping</div>
              </div>
              <button onClick={checkout} disabled={selectedPkgs.length === 0} style={{ background: '#2563eb', border: 'none', borderRadius: 8, color: '#fff', padding: '12px 32px', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>
                Checkout All
              </button>
            </div>
          </div>
        </>
      )}

      {order && (
        <div style={S.card}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
            <h2 style={{ margin: 0, color: '#34d399' }}>Order Confirmed!</h2>
            <div style={{ color: '#aaa', fontSize: 14, marginTop: 4 }}>Order ID: <strong>{order.order_id}</strong></div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '1px solid #333' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Sub-Order</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Package</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Supplier</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Items</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Total</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Delivery</th>
              <th style={{ textAlign: 'center', padding: 8 }}>Status</th>
            </tr></thead>
            <tbody>
              {(order.orders || []).map(o => (
                <tr key={o.sub_order_id} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: 8, fontFamily: 'monospace', color: '#60a5fa' }}>{o.sub_order_id}</td>
                  <td style={{ padding: 8 }}>{o.package}</td>
                  <td style={{ padding: 8 }}>{o.supplier}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{o.items}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: '#34d399', fontWeight: 600 }}>${o.total?.toFixed(2)}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: '#888' }}>{o.estimated_delivery}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}><span style={{ background: '#065f46', borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>✓ {o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, padding: '12px 0', borderTop: '2px solid #333' }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Grand Total</span>
            <span style={{ fontWeight: 700, fontSize: 20, color: '#34d399' }}>${order.grand_total?.toFixed(2)}</span>
          </div>
          <button onClick={() => { setBundle(null); setOrder(null); }} style={{ marginTop: 12, background: '#2563eb', border: 'none', borderRadius: 6, color: '#fff', padding: '10px 20px', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
            Start New Bundle
          </button>
        </div>
      )}
    </div>
  );
}
