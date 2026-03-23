import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

const QUICK_PARTS = [
  { name: 'Motor Mount Plate', template: 'motor_mount', material: 'al6061', quantity: 2, params: { width: 80, height: 80, thickness: 5, center_hole: 22, bolt_pattern: 4, bolt_pcd: 50, bolt_hole: 5 } },
  { name: 'Shaft M8x60', template: 'shaft', material: 'steel45', quantity: 4, params: { length: 60, dia_large: 12, dia_small: 8, step_pos: 30 } },
  { name: 'Bearing Housing', template: 'bearing_housing', material: 'al6061', quantity: 2, params: { outer_dia: 50, bore_dia: 25, height: 30, bolt_holes: 4 } },
  { name: 'Gear Blank Z20', template: 'gear_blank', material: '20crmnti', quantity: 4, params: { outer_dia: 40, bore_dia: 8, face_width: 12, teeth: 20 } },
  { name: 'Side Plate', template: 'plate', material: 'al6061', quantity: 2, params: { width: 120, height: 80, thickness: 3 } },
  { name: 'Enclosure Box', template: 'enclosure', material: 'abs', quantity: 1, params: { width: 150, height: 100, depth: 60, wall: 2.5, corner_radius: 3 } },
];

const MOCK_SUPPLIERS = [
  { id: 1, name: 'SZ Precision CNC', name_zh: '深圳精密CNC', location: 'Shenzhen', capability: 'CNC Milling/Turning', rating: 4.8, response_hrs: 4, moq: 1 },
  { id: 2, name: 'DG Sheet Metal', name_zh: '东莞钣金加工', location: 'Dongguan', capability: 'Sheet Metal + Laser', rating: 4.6, response_hrs: 6, moq: 1 },
  { id: 3, name: 'Rapid Proto 3D', name_zh: '快速原型3D', location: 'Guangzhou', capability: '3D Print (FDM/SLA/SLS)', rating: 4.9, response_hrs: 2, moq: 1 },
  { id: 4, name: 'JL Mold & Injection', name_zh: '嘉力模具注塑', location: 'Ningbo', capability: 'Injection Molding', rating: 4.5, response_hrs: 12, moq: 500 },
  { id: 5, name: 'Gear Master', name_zh: '齿轮大师', location: 'Wenzhou', capability: 'Gear Manufacturing', rating: 4.7, response_hrs: 8, moq: 10 },
];

export default function DesignToQuotePage() {
  const [step, setStep] = useState(1);
  const [parts, setParts] = useState([]);
  const [rfq, setRfq] = useState(null);
  const [supplierQuotes, setSupplierQuotes] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState({});
  const [loading, setLoading] = useState(false);

  const addQuickPart = (qp) => setParts(prev => [...prev, { ...qp }]);
  const removePart = (idx) => setParts(prev => prev.filter((_, i) => i !== idx));

  const generateRfq = async () => {
    if (parts.length === 0) return;
    setLoading(true);
    try {
      const res = await api.quickCadRfq({ name: 'Quick Design', description: 'Auto-generated for supplier quoting', parts });
      setRfq(res);
      const quotes = MOCK_SUPPLIERS.map(s => ({
        ...s,
        quote_usd: Math.round(res.total_estimated_cost_usd * (0.7 + Math.random() * 0.6)),
        lead_days: Math.round(7 + Math.random() * 14),
        can_do_all: Math.random() > 0.3,
        confidence: Math.round(70 + Math.random() * 30),
      }));
      quotes.sort((a, b) => a.quote_usd - b.quote_usd);
      setSupplierQuotes(quotes);
      setStep(2);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleSupplier = (sid) => setSelectedSuppliers(prev => ({ ...prev, [sid]: !prev[sid] }));

  return (
    <div>
      <h2 className="page-title">Design → Quote</h2>
      <p className="page-sub">One-click: Add parts → Generate RFQ spec → Get supplier quotes → Place order.</p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
        {[{ n: 1, label: 'Add Parts' }, { n: 2, label: 'Review & Quote' }, { n: 3, label: 'Select Supplier' }].map((s, i) => (
          <span key={s.n} style={{ display: 'contents' }}>
            <span onClick={() => s.n <= step && setStep(s.n)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: s.n <= step ? 'pointer' : 'default' }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: step >= s.n ? 'var(--accent)' : 'var(--card)', color: step >= s.n ? '#fff' : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.85rem' }}>{s.n}</span>
              <span style={{ fontSize: '.88rem', color: step >= s.n ? 'var(--text)' : 'var(--text3)', fontWeight: step === s.n ? 700 : 400 }}>{s.label}</span>
            </span>
            {i < 2 && <span style={{ color: 'var(--text3)', margin: '0 4px' }}>→</span>}
          </span>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div className="panel">
              <div className="panel-title" style={{ marginBottom: 12 }}>Quick Add Common Parts</div>
              <div className="grid-2" style={{ gap: 8 }}>
                {QUICK_PARTS.map((qp, i) => (
                  <div key={i} className="card" style={{ padding: 10, cursor: 'pointer' }} onClick={() => addQuickPart(qp)}>
                    <strong style={{ fontSize: '.85rem' }}>{qp.name}</strong>
                    <div style={{ fontSize: '.72rem', color: 'var(--text2)' }}>{qp.template} · {qp.material} · x{qp.quantity}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="panel">
              <div className="panel-header"><span className="panel-title">Your Parts ({parts.length})</span>{parts.length > 0 && <button className="btn btn-primary" style={{ fontSize: '.8rem' }} onClick={generateRfq} disabled={loading}>{loading ? 'Generating...' : 'Generate RFQ →'}</button>}</div>
              {parts.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Click parts on the left to add them</div> : (
                <div>
                  {parts.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <strong style={{ fontSize: '.88rem' }}>{p.name}</strong>
                        <div style={{ fontSize: '.72rem', color: 'var(--text2)' }}>{p.template} · {p.material} · x{p.quantity}</div>
                      </div>
                      <button className="btn-sm" style={{ color: 'var(--red)' }} onClick={() => removePart(i)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 2 && rfq && (
        <div>
          <div className="panel" style={{ borderColor: 'var(--accent)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{rfq.rfq_id}</div><div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{rfq.total_parts} parts · {rfq.created_at?.split('T')[0]}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--green)' }}>${rfq.total_estimated_cost_usd}</div><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Estimated</div></div>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-title" style={{ marginBottom: 10 }}>Parts Breakdown</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['#', 'Part', 'Material', 'Process', 'Qty', 'Est. Cost'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {(rfq.parts || []).map(p => (
                  <tr key={p.item_no}>
                    <td className="td">{p.item_no}</td>
                    <td className="td"><strong>{p.part_name}</strong></td>
                    <td className="td" style={{ fontSize: '.82rem' }}>{p.material_zh}</td>
                    <td className="td" style={{ fontSize: '.82rem' }}>{p.process}</td>
                    <td className="td">{p.quantity}</td>
                    <td className="td" style={{ color: 'var(--green)', fontWeight: 600 }}>${p.estimated_cost_usd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panel-title" style={{ marginBottom: 12 }}>Supplier Quotes</div>
            <div className="grid-3">
              {supplierQuotes.map(s => (
                <div key={s.id} className={`card${selectedSuppliers[s.id] ? ' active' : ''}`} style={{ padding: 14, cursor: 'pointer' }} onClick={() => toggleSupplier(s.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <strong>{s.name_zh}</strong>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--green)' }}>${s.quote_usd}</span>
                  </div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{s.location} · {s.capability}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: '.78rem' }}>
                    <span>Rating: {s.rating}/5</span>
                    <span>Lead: {s.lead_days}d</span>
                    <span>Response: {s.response_hrs}h</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {s.can_do_all && <span className="badge badge-green">Can do all</span>}
                    <span className="badge badge-blue">Match: {s.confidence}%</span>
                    {selectedSuppliers[s.id] && <span className="badge badge-green">Selected</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)} disabled={!Object.values(selectedSuppliers).some(Boolean)}>Confirm & Send RFQ →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: '4rem', marginBottom: 14 }}>🎉</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>RFQ Sent to {Object.values(selectedSuppliers).filter(Boolean).length} Suppliers!</div>
          <div style={{ fontSize: '.88rem', color: 'var(--text2)', marginBottom: 20 }}>
            {rfq.rfq_id} — {rfq.total_parts} parts — Est. ${rfq.total_estimated_cost_usd}
          </div>
          <div className="panel" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'left' }}>
            <div className="panel-title" style={{ marginBottom: 10 }}>Next Steps</div>
            {[
              { icon: '📧', text: 'Suppliers will receive your RFQ with full specifications', time: 'Now' },
              { icon: '💬', text: 'AI Negotiation Agent will follow up automatically', time: '1-4 hours' },
              { icon: '📊', text: 'Compare quotes in the Negotiation page', time: '1-3 days' },
              { icon: '✅', text: 'Confirm order and track production', time: 'After selection' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
                <div><div style={{ fontSize: '.88rem' }}>{s.text}</div><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{s.time}</div></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={() => { setStep(1); setParts([]); setRfq(null); setSelectedSuppliers({}); }}>New Design</button>
            <button className="btn btn-primary">View in Order Tracking</button>
          </div>
        </div>
      )}
    </div>
  );
}
