import { useState, useEffect } from 'react';
import * as api from '../api';

const QUICK_PARTS = [
  { name: 'Motor Mount Plate', template: 'motor_mount', material: 'al6061', quantity: 2, params: { width: 80, height: 80, thickness: 5, center_hole: 22, bolt_pattern: 4, bolt_pcd: 50, bolt_hole: 5 } },
  { name: 'Shaft M8x60', template: 'shaft', material: 'steel45', quantity: 4, params: { length: 60, dia_large: 12, dia_small: 8, step_pos: 30 } },
  { name: 'Bearing Housing', template: 'bearing_housing', material: 'al6061', quantity: 2, params: { outer_dia: 50, bore_dia: 25, height: 30, bolt_holes: 4 } },
  { name: 'Gear Blank Z20', template: 'gear_blank', material: '20crmnti', quantity: 4, params: { outer_dia: 40, bore_dia: 8, face_width: 12, teeth: 20 } },
  { name: 'Side Plate', template: 'plate', material: 'al6061', quantity: 2, params: { width: 120, height: 80, thickness: 3 } },
  { name: 'Enclosure Box', template: 'enclosure', material: 'abs', quantity: 1, params: { width: 150, height: 100, depth: 60, wall: 2.5, corner_radius: 3 } },
  { name: 'Titanium Bracket', template: 'bracket_l', material: 'ti_gr5', quantity: 2, params: { width: 30, height: 50, flange: 15, thickness: 2 } },
  { name: 'PCB Mount', template: 'pcb_bracket', material: 'ss304', quantity: 4, params: { width: 80, depth: 60, height: 12, thickness: 1.5, standoff_height: 6 } },
];

export default function DesignToQuotePage() {
  const [step, setStep] = useState(1);
  const [parts, setParts] = useState([]);
  const [rfq, setRfq] = useState(null);
  const [quotes, setQuotes] = useState(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState({});
  const [loading, setLoading] = useState(false);
  const [engineStatus, setEngineStatus] = useState(null);

  useEffect(() => {
    api.fetchCadEngineStatus().then(setEngineStatus).catch(() => {});
  }, []);

  const addQuickPart = (qp) => setParts(prev => [...prev, { ...qp }]);
  const removePart = (idx) => setParts(prev => prev.filter((_, i) => i !== idx));

  const generateQuotes = async () => {
    if (parts.length === 0) return;
    setLoading(true);
    try {
      const res = await api.getCadRfqQuotes({
        name: 'Quick Design',
        description: 'Design-to-Quote auto-generated',
        parts,
      });
      setRfq(res.rfq);
      setQuotes(res.quotes);
      setStep(2);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleSupplier = (sid) => setSelectedSuppliers(prev => ({ ...prev, [sid]: !prev[sid] }));
  const selectedCount = Object.values(selectedSuppliers).filter(Boolean).length;

  return (
    <div>
      <h2 className="page-title">Design to Quote</h2>
      <p className="page-sub">Add parts — Auto-generate RFQ — Real-time quotes from 8+ suppliers — Place order.</p>

      {engineStatus && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: '.78rem' }}>
          <span className={`badge ${engineStatus.cadquery_available ? 'badge-green' : 'badge-blue'}`}>
            3D Engine: {engineStatus.backend}
          </span>
          <span className="badge">Xometry | RapidDirect | JLCPCB | PCBWay | Protolabs | Hubs | HQ</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
        {[{ n: 1, label: 'Add Parts' }, { n: 2, label: 'Review Quotes' }, { n: 3, label: 'Confirm Order' }].map((s, i) => (
          <span key={s.n} style={{ display: 'contents' }}>
            <span onClick={() => s.n <= step && setStep(s.n)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: s.n <= step ? 'pointer' : 'default' }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: step >= s.n ? 'var(--accent)' : 'var(--card)', color: step >= s.n ? '#fff' : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.85rem' }}>{s.n}</span>
              <span style={{ fontSize: '.88rem', color: step >= s.n ? 'var(--text)' : 'var(--text3)', fontWeight: step === s.n ? 700 : 400 }}>{s.label}</span>
            </span>
            {i < 2 && <span style={{ color: 'var(--text3)', margin: '0 4px' }}>{'->'}</span>}
          </span>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="panel">
            <div className="panel-title" style={{ marginBottom: 12 }}>Quick Add Common Parts</div>
            <div className="grid-2" style={{ gap: 8 }}>
              {QUICK_PARTS.map((qp, i) => (
                <div key={i} className="card" style={{ padding: 10, cursor: 'pointer' }} onClick={() => addQuickPart(qp)}>
                  <strong style={{ fontSize: '.85rem' }}>{qp.name}</strong>
                  <div style={{ fontSize: '.72rem', color: 'var(--text2)' }}>{qp.template} | {qp.material} | x{qp.quantity}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Your Parts ({parts.length})</span>
              {parts.length > 0 && (
                <button className="btn btn-primary" style={{ fontSize: '.8rem' }} onClick={generateQuotes} disabled={loading}>
                  {loading ? 'Querying 8+ suppliers...' : 'Get Real Quotes \u2192'}
                </button>
              )}
            </div>
            {parts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Click parts on the left to add them</div>
            ) : (
              <div>
                {parts.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <strong style={{ fontSize: '.88rem' }}>{p.name}</strong>
                      <div style={{ fontSize: '.72rem', color: 'var(--text2)' }}>{p.template} | {p.material} | x{p.quantity}</div>
                    </div>
                    <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', color: 'var(--red)', cursor: 'pointer', fontSize: '.75rem' }} onClick={() => removePart(i)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && rfq && quotes && (
        <div>
          <div className="panel" style={{ borderColor: 'var(--accent)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{rfq.rfq_id}</div>
                <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{rfq.total_parts} parts | {rfq.created_at?.split('T')[0]}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Internal Estimate</div>
                <div style={{ fontSize: '1rem', color: 'var(--text2)' }}>${rfq.total_estimated_cost_usd}</div>
              </div>
            </div>
          </div>

          {quotes.best_price && (
            <div className="panel" style={{ borderColor: 'var(--green)', marginBottom: 16, background: 'rgba(46,204,113,.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="badge badge-green">Best Overall Price</span>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 4 }}>{quotes.best_price.name_zh || quotes.best_price.name}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>Covers {quotes.best_price.parts_covered} parts | Max lead: {quotes.best_price.max_lead_days}d</div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green)' }}>${quotes.best_price.total_usd}</div>
              </div>
            </div>
          )}

          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-title" style={{ marginBottom: 12 }}>All Supplier Quotes ({quotes.total_suppliers} suppliers)</div>
            <div className="grid-3">
              {(quotes.supplier_summary || []).map((s, i) => (
                <div key={s.supplier || i} className={`card${selectedSuppliers[s.supplier] ? ' active' : ''}`} style={{ padding: 14, cursor: 'pointer' }} onClick={() => toggleSupplier(s.supplier)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      {i === 0 && <span className="badge badge-green" style={{ display: 'block', marginBottom: 4 }}>Cheapest</span>}
                      <strong>{s.name_zh || s.name}</strong>
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: i === 0 ? 'var(--green)' : 'var(--text)' }}>${s.total_usd}</span>
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>Parts: {s.parts_covered} | Lead: {s.max_lead_days}d | Rating: {s.rating}/5</div>
                  {selectedSuppliers[s.supplier] && <span className="badge badge-green" style={{ marginTop: 6 }}>Selected</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-title" style={{ marginBottom: 10 }}>Per-Part Breakdown</div>
            {(quotes.per_part_quotes || []).map((pq, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: 6 }}>{pq.item_no ? `#${pq.item_no} ` : ''}{pq.part_name}</div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                  {(pq.quotes || []).slice(0, 6).map((q, j) => (
                    <div key={j} style={{ minWidth: 140, padding: 8, background: 'var(--bg)', borderRadius: 6, border: j === 0 ? '1px solid var(--green)' : '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 600, fontSize: '.82rem' }}>{q.supplier_name_zh || q.supplier_name || q.supplier}</div>
                      <div style={{ color: j === 0 ? 'var(--green)' : 'var(--text)', fontWeight: 700, fontSize: '.95rem' }}>${q.quote_usd}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{q.lead_days}d | {q.source}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)} disabled={selectedCount === 0}>{'Confirm & Send RFQ to ' + selectedCount + ' Supplier' + (selectedCount !== 1 ? 's' : '') + ' \u2192'}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: '4rem', marginBottom: 14 }}>🎉</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>RFQ Sent to {selectedCount} Supplier{selectedCount !== 1 ? 's' : ''}!</div>
          <div style={{ fontSize: '.88rem', color: 'var(--text2)', marginBottom: 8 }}>
            {rfq?.rfq_id} | {rfq?.total_parts} parts
          </div>
          {quotes?.best_price && (
            <div style={{ fontSize: '.88rem', color: 'var(--text2)', marginBottom: 20 }}>
              Best price: ${quotes.best_price.total_usd} from {quotes.best_price.name_zh || quotes.best_price.name}
            </div>
          )}
          <div className="panel" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'left' }}>
            <div className="panel-title" style={{ marginBottom: 10 }}>Next Steps</div>
            {[
              { icon: '📧', text: 'Suppliers receive RFQ with STEP files + full specs', time: 'Now' },
              { icon: '🔧', text: 'CadQuery generates STEP/STL for DFM review', time: 'Automatic' },
              { icon: '💬', text: 'AI Negotiation Agent follows up for best terms', time: '1-4 hours' },
              { icon: '📊', text: 'Compare final quotes in Negotiation page', time: '1-3 days' },
              { icon: '✅', text: 'Confirm order and track production', time: 'After selection' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
                <div><div style={{ fontSize: '.88rem' }}>{s.text}</div><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{s.time}</div></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={() => { setStep(1); setParts([]); setRfq(null); setQuotes(null); setSelectedSuppliers({}); }}>New Design</button>
            <button className="btn btn-primary" onClick={() => document.dispatchEvent(new CustomEvent('nav', { detail: 'orders' }))}>View Order Tracking</button>
          </div>
        </div>
      )}
    </div>
  );
}
