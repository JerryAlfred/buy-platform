import { useState, useEffect, useRef } from 'react';
import * as api from '../api';

const PHASE_COLORS = ['#a78bfa','#60a5fa','#34d399','#fbbf24','#f97316','#ef4444','#ec4899','#10b981'];

function BomTable({ bom }) {
  if (!bom?.length) return null;
  const total = bom.reduce((s, b) => s + (b.qty || 1) * (b.unit_cost || 0), 0);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ borderBottom: '1px solid #333' }}>
          {['Category','Part','Qty','Unit $','Subtotal','Note'].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: '#aaa' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {bom.map((b, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #222' }}>
              <td style={{ padding: '6px 8px', color: '#60a5fa' }}>{b.category}</td>
              <td style={{ padding: '6px 8px', fontWeight: 600 }}>{b.part}</td>
              <td style={{ padding: '6px 8px' }}>{b.qty}</td>
              <td style={{ padding: '6px 8px' }}>${b.unit_cost}</td>
              <td style={{ padding: '6px 8px', color: '#34d399' }}>${(b.qty * b.unit_cost).toFixed(2)}</td>
              <td style={{ padding: '6px 8px', color: '#888', fontSize: 11 }}>{b.note}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 700, borderTop: '2px solid #444' }}>
            <td colSpan={4} style={{ padding: '6px 8px', textAlign: 'right' }}>Total BOM</td>
            <td style={{ padding: '6px 8px', color: '#34d399' }}>${total.toFixed(2)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Timeline({ timeline }) {
  if (!timeline?.length) return null;
  let cumWeeks = 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {timeline.map((t, i) => {
        const start = cumWeeks;
        cumWeeks += t.weeks;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 120, fontSize: 12, color: '#aaa', textAlign: 'right' }}>W{start+1}–W{cumWeeks}</div>
            <div style={{ flex: 1, background: '#1a1a2e', borderRadius: 4, padding: '6px 10px', borderLeft: `3px solid ${PHASE_COLORS[i % PHASE_COLORS.length]}` }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{t.phase} <span style={{ color: '#888', fontWeight: 400 }}>({t.weeks}w)</span></div>
              <div style={{ fontSize: 12, color: '#aaa' }}>{t.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CostBreakdown({ cost }) {
  if (!cost) return null;
  const items = [
    ['BOM (Prototype)', cost.bom_prototype],
    ['PCB Fabrication', cost.pcb_fabrication],
    ['3D Printing', cost['3d_printing']],
    ['Certification', cost.certification],
    ['Tooling', cost.tooling],
    ['Engineering', cost.engineering_hours],
  ].filter(([,v]) => v);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {items.map(([k, v]) => (
        <div key={k} style={{ background: '#1a1a2e', borderRadius: 6, padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#aaa', fontSize: 13 }}>{k}</span>
          <span style={{ fontWeight: 600, color: '#34d399' }}>${v?.toLocaleString()}</span>
        </div>
      ))}
      <div style={{ gridColumn: 'span 2', background: '#16213e', borderRadius: 6, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #2563eb' }}>
        <span style={{ fontWeight: 700 }}>Total to Production</span>
        <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: 18 }}>${cost.total_to_production?.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function ProductWizardPage() {
  const [presets, setPresets] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('prd');
  const [source, setSource] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    api.fetchWizardPresets().then(r => setPresets(r.presets || [])).catch(() => {});
  }, []);

  const generate = async (text) => {
    const q = text || prompt;
    if (!q.trim()) return;
    setLoading(true); setResult(null);
    try {
      const r = await api.generateProductPlan({ prompt: q, use_llm: true });
      setResult(r); setSource(r.source || 'template'); setTab('prd');
    } catch (e) { alert('Generation failed'); }
    setLoading(false);
  };

  const S = { page: { padding: 24 }, card: { background: '#1a1a2e', borderRadius: 8, padding: 16, marginBottom: 12 }, tab: (a) => ({ background: a ? '#2563eb' : 'transparent', border: a ? 'none' : '1px solid #444', borderRadius: 6, color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: a ? 600 : 400 }) };

  return (
    <div style={S.page}>
      <h2 style={{ margin: '0 0 4px' }}>AI Product Wizard</h2>
      <p style={{ color: '#aaa', margin: '0 0 16px', fontSize: 14 }}>Describe your hardware idea and get an instant product development plan with BOM, timeline, and cost estimates.</p>

      <div style={S.card}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {presets.map(p => (
            <button key={p.id} onClick={() => { setPrompt(p.prompt); generate(p.prompt); }}
              style={{ background: '#16213e', border: '1px solid #333', borderRadius: 6, color: '#ddd', padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
              {p.title}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea ref={inputRef} value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
            placeholder="Describe your hardware product idea in detail..."
            style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 6, padding: '10px 12px', color: '#fff', resize: 'vertical', fontSize: 14, fontFamily: 'inherit' }} />
          <button onClick={() => generate()} disabled={loading}
            style={{ background: loading ? '#555' : '#2563eb', border: 'none', borderRadius: 6, color: '#fff', padding: '0 24px', cursor: loading ? 'wait' : 'pointer', fontWeight: 700, fontSize: 15, minWidth: 120 }}>
            {loading ? 'Generating...' : 'Generate Plan'}
          </button>
        </div>
      </div>

      {result && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            {['prd','bom','timeline','cost','certifications'].map(t => (
              <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>{t === 'prd' ? 'PRD' : t === 'bom' ? 'BOM' : t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}>Source: {source === 'llm' ? 'AI (GPT-4o-mini)' : 'Template Engine'}</span>
          </div>

          {tab === 'prd' && result.prd && (
            <div style={S.card}>
              <h3 style={{ margin: '0 0 8px', color: '#60a5fa' }}>{result.prd.product_name}</h3>
              <p style={{ color: '#ccc', fontSize: 14 }}><strong>Problem:</strong> {result.prd.problem_statement}</p>
              <p style={{ color: '#ccc', fontSize: 14 }}><strong>Target User:</strong> {result.prd.target_user}</p>
              <h4 style={{ margin: '12px 0 6px' }}>Key Features</h4>
              <ul style={{ margin: 0, paddingLeft: 20 }}>{(result.prd.key_features || []).map((f, i) => <li key={i} style={{ marginBottom: 4, color: '#ddd', fontSize: 13 }}>{f}</li>)}</ul>
              <h4 style={{ margin: '12px 0 6px' }}>Technical Requirements</h4>
              <ul style={{ margin: 0, paddingLeft: 20 }}>{(result.prd.technical_requirements || []).map((f, i) => <li key={i} style={{ marginBottom: 4, color: '#ddd', fontSize: 13 }}>{f}</li>)}</ul>
              {result.tech_stack?.mcu && (
                <div style={{ marginTop: 12, background: '#16213e', borderRadius: 6, padding: 10 }}>
                  <strong style={{ color: '#fbbf24' }}>Recommended MCU:</strong> {result.tech_stack.mcu.name} — {result.tech_stack.mcu.pros} (${result.tech_stack.mcu.cost})
                </div>
              )}
            </div>
          )}

          {tab === 'bom' && <div style={S.card}><BomTable bom={result.bom} /></div>}
          {tab === 'timeline' && <div style={S.card}><h3 style={{ margin: '0 0 12px' }}>Development Timeline — {result.total_weeks} Weeks</h3><Timeline timeline={result.timeline} /></div>}
          {tab === 'cost' && <div style={S.card}><h3 style={{ margin: '0 0 12px' }}>Cost Estimate</h3><CostBreakdown cost={result.cost_estimate} /></div>}
          {tab === 'certifications' && (
            <div style={S.card}>
              <h3 style={{ margin: '0 0 12px' }}>Required Certifications</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(result.certifications || []).map(c => (
                  <div key={c} style={{ background: '#16213e', border: '1px solid #333', borderRadius: 6, padding: '10px 16px', fontWeight: 600, fontSize: 14 }}>{c}</div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
