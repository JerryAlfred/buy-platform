import { useState, useEffect, useRef } from 'react';
import * as api from '../api';

const COLORS = { aluminum: '#b0c4de', steel: '#8899aa', plastic: '#44aa88', copper: '#cc9944', titanium: '#99aabb', iron: '#667788', composite: '#334466' };

function Viewport3D({ parts, selectedIdx, stlPreview }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'), w = c.width, h = c.height;
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, h / 2 - 150); ctx.lineTo(x, h / 2 + 150); ctx.stroke(); }
    for (let y = h / 2 - 150; y <= h / 2 + 150; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(w/2, h/2); ctx.lineTo(w/2+80, h/2); ctx.stroke();
    ctx.fillStyle='#e74c3c'; ctx.font='10px monospace'; ctx.fillText('X', w/2+82, h/2+4);
    ctx.strokeStyle = '#2ecc71';
    ctx.beginPath(); ctx.moveTo(w/2, h/2); ctx.lineTo(w/2, h/2-80); ctx.stroke();
    ctx.fillStyle='#2ecc71'; ctx.fillText('Y', w/2+4, h/2-82);
    ctx.strokeStyle = '#3498db';
    ctx.beginPath(); ctx.moveTo(w/2, h/2); ctx.lineTo(w/2-50, h/2+40); ctx.stroke();
    ctx.fillStyle='#3498db'; ctx.fillText('Z', w/2-60, h/2+44);

    parts.forEach((p, idx) => {
      const isSel = idx === selectedIdx;
      const tpl = p.template || 'box';
      const px = p.params || {};
      const ox = w / 2 + (idx - parts.length / 2) * 120, oy = h / 2;
      const mat = (p._material || {});
      const color = COLORS[mat.category || 'aluminum'] || '#8899aa';

      ctx.save(); ctx.translate(ox, oy);
      ctx.fillStyle = isSel ? 'rgba(59,130,246,.25)' : `${color}33`;
      ctx.strokeStyle = isSel ? '#3b82f6' : color;
      ctx.lineWidth = isSel ? 2.5 : 1.5;
      const sc = 1.5;

      if (tpl === 'box' || tpl === 'plate' || tpl === 'motor_mount' || tpl === 'pcb_bracket' || tpl === 'enclosure') {
        const bw = (px.width || 50) * sc, bh = (px.height || 30) * sc, bd = (px.depth || px.thickness || 20) * sc;
        const dx = -bw / 2, dy = -bh / 2;
        ctx.fillRect(dx, dy, bw, bh); ctx.strokeRect(dx, dy, bw, bh);
        ctx.fillStyle = `${color}22`; ctx.beginPath();
        ctx.moveTo(dx + bw, dy); ctx.lineTo(dx + bw + bd * 0.4, dy - bd * 0.3);
        ctx.lineTo(dx + bd * 0.4, dy - bd * 0.3); ctx.lineTo(dx, dy); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(dx + bw, dy); ctx.lineTo(dx + bw + bd * 0.4, dy - bd * 0.3);
        ctx.lineTo(dx + bw + bd * 0.4, dy + bh - bd * 0.3); ctx.lineTo(dx + bw, dy + bh); ctx.fill(); ctx.stroke();
      } else if (tpl === 'cylinder' || tpl === 'shaft' || tpl === 'tube') {
        const r = ((px.diameter || px.outer_dia || px.dia_large || 30) / 2) * sc;
        const ch = (px.height || px.length || 80) * sc * 0.6;
        ctx.beginPath(); ctx.ellipse(0, -ch / 2, r, r * 0.3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillRect(-r, -ch / 2, r * 2, ch); ctx.strokeRect(-r, -ch / 2, r * 2, ch);
        ctx.beginPath(); ctx.ellipse(0, ch / 2, r, r * 0.3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (tpl === 'sphere') {
        const r = ((px.diameter || 40) / 2) * sc;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
        const grd = ctx.createRadialGradient(-r*0.3, -r*0.3, r*0.1, 0, 0, r);
        grd.addColorStop(0, `${color}44`); grd.addColorStop(1, `${color}08`);
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      } else if (tpl === 'gear_blank') {
        const r = ((px.outer_dia || 50) / 2) * sc;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        const br = ((px.bore_dia || 10) / 2) * sc;
        ctx.fillStyle = '#0d1117'; ctx.beginPath(); ctx.arc(0, 0, br, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        const teeth = px.teeth || 24;
        for (let t = 0; t < teeth; t++) { const a = (t / teeth) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3)); ctx.lineTo(Math.cos(a) * (r + 5), Math.sin(a) * (r + 5)); ctx.stroke(); }
      } else if (tpl === 'bracket_l') {
        const bw = (px.width || 40) * sc, bh = (px.height || 60) * sc, fl = (px.flange || 20) * sc, th = (px.thickness || 3) * sc * 2;
        ctx.beginPath(); ctx.moveTo(-bw / 2, bh / 2); ctx.lineTo(-bw / 2, -bh / 2); ctx.lineTo(-bw / 2 + th, -bh / 2);
        ctx.lineTo(-bw / 2 + th, bh / 2 - th); ctx.lineTo(-bw / 2 + fl, bh / 2 - th); ctx.lineTo(-bw / 2 + fl, bh / 2); ctx.closePath();
        ctx.fill(); ctx.stroke();
      } else {
        ctx.fillRect(-30, -20, 60, 40); ctx.strokeRect(-30, -20, 60, 40);
      }
      ctx.fillStyle = isSel ? '#3b82f6' : '#94a3b8';
      ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(p.name || tpl, 0, (tpl === 'cylinder' || tpl === 'shaft' ? 65 : 55));
      ctx.restore();
    });

    if (parts.length === 0) {
      ctx.fillStyle = '#64748b'; ctx.font = '14px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Click a part template on the left to add', w / 2, h / 2);
      ctx.font = '11px Inter, sans-serif'; ctx.fillText('Parts are rendered with CadQuery/OCCT engine', w / 2, h / 2 + 24);
    }

    if (stlPreview) {
      ctx.fillStyle = '#2ecc71'; ctx.font = '10px monospace'; ctx.textAlign = 'right';
      ctx.fillText(`STL Preview: ${stlPreview.engine} | ${(stlPreview.size_bytes/1024).toFixed(1)}KB`, w - 10, 14);
    }

    ctx.fillStyle = '#334155'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`Parts: ${parts.length}`, 10, h - 10);
  }, [parts, selectedIdx, stlPreview]);

  return <canvas ref={canvasRef} width={900} height={520} style={{ width: '100%', height: 520, display: 'block' }} />;
}

export default function CADDesignPage() {
  const [templates, setTemplates] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [parts, setParts] = useState([]);
  const [selIdx, setSelIdx] = useState(-1);
  const [designName, setDesignName] = useState('');
  const [designDesc, setDesignDesc] = useState('');
  const [savedId, setSavedId] = useState(null);
  const [exportResult, setExportResult] = useState(null);
  const [rfqResult, setRfqResult] = useState(null);
  const [costEst, setCostEst] = useState(null);
  const [supplierQuotes, setSupplierQuotes] = useState(null);
  const [engineStatus, setEngineStatus] = useState(null);
  const [stlPreview, setStlPreview] = useState(null);
  const [tab, setTab] = useState('design');
  const [quoting, setQuoting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.fetchCadTemplates().then(r => setTemplates(r.templates || [])).catch(() => {});
    api.fetchCadMaterials().then(r => setMaterials(r.materials || [])).catch(() => {});
    api.fetchCadProcesses().then(r => setProcesses(r.processes || [])).catch(() => {});
    api.fetchCadEngineStatus().then(setEngineStatus).catch(() => {});
  }, []);

  const addPart = (tpl) => {
    const mat = materials.find(m => m.name === tpl.material_default) || materials[0] || {};
    setParts(prev => [...prev, { template: tpl.id, name: `${tpl.label_zh}_${prev.length + 1}`, params: { ...tpl.params }, material: mat.id || 'al6061', quantity: 1, notes: '', _material: mat }]);
    setSelIdx(parts.length);
  };

  const updatePart = (idx, key, val) => {
    setParts(prev => prev.map((p, i) => {
      if (i !== idx) return p;
      const updated = { ...p, [key]: val };
      if (key === 'material') updated._material = materials.find(m => m.id === val) || {};
      return updated;
    }));
  };
  const updateParam = (idx, paramKey, val) => {
    setParts(prev => prev.map((p, i) => i !== idx ? p : { ...p, params: { ...p.params, [paramKey]: parseFloat(val) || 0 } }));
  };
  const removePart = (idx) => { setParts(prev => prev.filter((_, i) => i !== idx)); setSelIdx(-1); };

  const handleSave = async () => {
    if (!designName.trim()) return;
    const res = await api.createCadDesign({ name: designName, description: designDesc, parts: parts.map(({ _material, ...p }) => p) });
    setSavedId(res.id);
    return res.id;
  };

  const handleExport = async (fmt) => {
    setExporting(true);
    try {
      let id = savedId;
      if (!id) id = await handleSave();
      if (!id) return;
      const res = await api.exportCadDesign(id, fmt);
      setExportResult(res);
    } finally { setExporting(false); }
  };

  const handleStlPreview = async () => {
    if (selIdx < 0 || !parts[selIdx]) return;
    const p = parts[selIdx];
    try {
      const res = await api.previewPartStl({ template: p.template, params: p.params });
      setStlPreview(res);
    } catch(e) { console.error(e); }
  };

  const handleRfq = async () => {
    const designData = { name: designName || 'Untitled', description: designDesc, parts: parts.map(({ _material, ...p }) => p) };
    const res = await api.quickCadRfq(designData);
    setRfqResult(res);
    setTab('rfq');
  };

  const handleRfqWithQuotes = async () => {
    setQuoting(true);
    try {
      const designData = { name: designName || 'Untitled', description: designDesc, parts: parts.map(({ _material, ...p }) => p) };
      const res = await api.getCadRfqQuotes(designData);
      setRfqResult(res.rfq);
      setSupplierQuotes(res.quotes);
      setTab('quotes');
    } catch(e) { console.error(e); }
    finally { setQuoting(false); }
  };

  const handleEstimate = async () => {
    if (selIdx < 0 || !parts[selIdx]) return;
    const p = parts[selIdx];
    const res = await api.estimateCadCost({ template: p.template, params: p.params, material: p.material, quantity: p.quantity });
    setCostEst(res);
  };

  const handleGetQuote = async () => {
    if (selIdx < 0 || !parts[selIdx]) return;
    const p = parts[selIdx];
    const tpl = templates.find(t => t.id === p.template);
    setQuoting(true);
    try {
      const res = await api.getCadQuote({ template: p.template, params: p.params, material: p.material, process: tpl?.process || 'CNC Milling', quantity: p.quantity });
      setSupplierQuotes({ per_part_quotes: [{ part_name: p.name, quotes: res.quotes }], supplier_summary: res.quotes });
      setTab('quotes');
    } catch(e) { console.error(e); }
    finally { setQuoting(false); }
  };

  const sel = selIdx >= 0 ? parts[selIdx] : null;
  const selTpl = sel ? templates.find(t => t.id === sel.template) : null;

  const TABS = [
    { id: 'design', label: 'Design' },
    { id: 'bom', label: 'BOM' },
    { id: 'rfq', label: 'RFQ Doc' },
    { id: 'quotes', label: 'Supplier Quotes' },
  ];

  return (
    <div>
      <h2 className="page-title">3D CAD Design Studio</h2>
      <p className="page-sub">CadQuery/OCCT engine — Real STEP/STL export — Multi-supplier instant quotes.</p>

      {engineStatus && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, fontSize: '.78rem' }}>
          <span className={`badge ${engineStatus.cadquery_available ? 'badge-green' : 'badge-yellow'}`}>
            Engine: {engineStatus.backend}
          </span>
          {engineStatus.cadquery_available && <span className="badge badge-green">CadQuery/OCCT Ready</span>}
          {engineStatus.trimesh_available && <span className="badge badge-blue">trimesh Ready</span>}
          {!engineStatus.cadquery_available && !engineStatus.trimesh_available && <span className="badge badge-yellow">Install cadquery for real STEP export</span>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 16px', fontSize: '.85rem', cursor: 'pointer', border: 'none', background: 'none', color: tab===t.id?'var(--accent)':'var(--text2)', borderBottom: tab===t.id?'2px solid var(--accent)':'2px solid transparent', fontWeight: tab===t.id?600:400 }}>{t.label}</button>)}
      </div>

      {tab === 'design' && (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 260px', gap: 14, minHeight: 560 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="panel" style={{ padding: 12, maxHeight: 380, overflow: 'auto' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.85rem' }}>Part Templates</div>
              {templates.map(tpl => (
                <div key={tpl.id} style={{ padding: '5px 8px', fontSize: '.78rem', cursor: 'pointer', borderRadius: 6, marginBottom: 2 }} onClick={() => addPart(tpl)} onMouseEnter={e => e.target.style.background='rgba(59,130,246,.1)'} onMouseLeave={e => e.target.style.background='none'}>
                  <span style={{ marginRight: 6 }}>{tpl.icon}</span>{tpl.label_zh}
                  <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginLeft: 22 }}>{tpl.process}</div>
                </div>
              ))}
            </div>
            <div className="panel" style={{ padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '.85rem' }}>Project</div>
              <input className="input" placeholder="Design name" value={designName} onChange={e => setDesignName(e.target.value)} style={{ marginBottom: 6, fontSize: '.82rem' }} />
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" style={{ fontSize: '.75rem', padding: '4px 10px' }} onClick={handleSave}>Save</button>
                <button className="btn btn-secondary" style={{ fontSize: '.75rem', padding: '4px 10px' }} onClick={() => handleExport('step')} disabled={exporting}>{exporting ? '...' : 'STEP'}</button>
                <button className="btn btn-secondary" style={{ fontSize: '.75rem', padding: '4px 10px' }} onClick={() => handleExport('stl')} disabled={exporting}>STL</button>
                <button className="btn btn-secondary" style={{ fontSize: '.75rem', padding: '4px 10px' }} onClick={() => handleExport('obj')} disabled={exporting}>OBJ</button>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                <button className="btn btn-secondary" style={{ fontSize: '.75rem', padding: '4px 10px', color: 'var(--green)' }} onClick={handleRfq}>RFQ</button>
                <button className="btn btn-primary" style={{ fontSize: '.75rem', padding: '4px 10px' }} onClick={handleRfqWithQuotes} disabled={quoting || parts.length === 0}>{quoting ? 'Quoting...' : 'Get Quotes'}</button>
              </div>
              {savedId && <div style={{ fontSize: '.72rem', color: 'var(--green)', marginTop: 4 }}>Saved: {savedId}</div>}
              {exportResult && (
                <div style={{ fontSize: '.72rem', color: 'var(--accent)', marginTop: 4 }}>
                  <div>{exportResult.filename} ({exportResult.engine || 'mock'})</div>
                  <div>{(exportResult.size_bytes / 1024).toFixed(1)} KB</div>
                  {exportResult.download_url && <a href={exportResult.download_url} style={{ color: 'var(--accent)' }}>Download</a>}
                </div>
              )}
            </div>
          </div>

          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <Viewport3D parts={parts} selectedIdx={selIdx} stlPreview={stlPreview} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="panel" style={{ padding: 12, maxHeight: 200, overflow: 'auto' }}>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '.85rem' }}>Parts ({parts.length})</div>
              {parts.map((p, i) => (
                <div key={i} style={{ padding: '4px 6px', fontSize: '.78rem', cursor: 'pointer', borderRadius: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: selIdx === i ? 'rgba(59,130,246,.12)' : 'none', color: selIdx === i ? 'var(--accent)' : 'var(--text)' }} onClick={() => setSelIdx(i)}>
                  <span>{p.name}</span>
                  <button style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '.72rem' }} onClick={e => { e.stopPropagation(); removePart(i); }}>x</button>
                </div>
              ))}
            </div>

            {sel && (
              <div className="panel" style={{ padding: 12, maxHeight: 360, overflow: 'auto' }}>
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.85rem' }}>Properties</div>
                <div style={{ marginBottom: 6 }}>
                  <label style={{ fontSize: '.68rem', color: 'var(--text3)' }}>Name</label>
                  <input className="input" value={sel.name} onChange={e => updatePart(selIdx, 'name', e.target.value)} style={{ fontSize: '.82rem' }} />
                </div>
                {selTpl && Object.entries(sel.params || {}).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 4 }}>
                    <label style={{ fontSize: '.68rem', color: 'var(--text3)' }}>{k} (mm)</label>
                    <input className="input" type="number" value={v} onChange={e => updateParam(selIdx, k, e.target.value)} style={{ fontSize: '.82rem' }} />
                  </div>
                ))}
                <div style={{ marginBottom: 4 }}>
                  <label style={{ fontSize: '.68rem', color: 'var(--text3)' }}>Material</label>
                  <select className="select" style={{ width: '100%', fontSize: '.78rem' }} value={sel.material} onChange={e => updatePart(selIdx, 'material', e.target.value)}>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name_zh} ({m.name})</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 6 }}>
                  <label style={{ fontSize: '.68rem', color: 'var(--text3)' }}>Quantity</label>
                  <input className="input" type="number" min="1" value={sel.quantity} onChange={e => updatePart(selIdx, 'quantity', parseInt(e.target.value) || 1)} style={{ fontSize: '.82rem' }} />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-secondary" style={{ flex: 1, fontSize: '.75rem' }} onClick={handleEstimate}>Estimate</button>
                  <button className="btn btn-primary" style={{ flex: 1, fontSize: '.75rem' }} onClick={handleGetQuote} disabled={quoting}>{quoting ? '...' : 'Quotes'}</button>
                </div>
                <button className="btn btn-secondary" style={{ width: '100%', fontSize: '.72rem', marginTop: 4 }} onClick={handleStlPreview}>Preview STL</button>
                {costEst && <div style={{ marginTop: 6, fontSize: '.78rem', padding: 8, background: 'var(--bg)', borderRadius: 6 }}>
                  <div style={{ color: 'var(--green)', fontWeight: 700 }}>${costEst.total_usd} total</div>
                  <div style={{ color: 'var(--text2)' }}>${costEst.per_unit_usd}/unit | {costEst.mass_g}g | {Math.round(costEst.volume_mm3 / 1000)}cm3</div>
                </div>}
                {stlPreview && <div style={{ marginTop: 4, fontSize: '.72rem', padding: 6, background: 'rgba(46,204,113,.08)', borderRadius: 4, color: 'var(--green)' }}>
                  STL Ready ({stlPreview.engine}) | {(stlPreview.size_bytes/1024).toFixed(1)} KB
                </div>}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'bom' && (
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Bill of Materials</span><span style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{parts.length} items</span></div>
          {parts.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Add parts in the Design tab first</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['#', 'Part Name', 'Type', 'Material', 'Process', 'Dimensions', 'Qty'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {parts.map((p, i) => { const tpl = templates.find(t => t.id === p.template); const mat = materials.find(m => m.id === p.material); return (
                  <tr key={i}>
                    <td className="td">{i + 1}</td>
                    <td className="td"><strong>{p.name}</strong></td>
                    <td className="td"><span className="badge badge-blue">{p.template}</span></td>
                    <td className="td" style={{ fontSize: '.8rem' }}>{mat?.name_zh || p.material}</td>
                    <td className="td" style={{ fontSize: '.8rem' }}>{tpl?.process || '-'}</td>
                    <td className="td" style={{ fontSize: '.75rem' }}>{Object.entries(p.params || {}).map(([k, v]) => `${k}:${v}`).join(', ')}</td>
                    <td className="td">{p.quantity}</td>
                  </tr>
                ); })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'rfq' && (
        <div>
          {!rfqResult ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 14 }}>📄</div>
              <div style={{ marginBottom: 10 }}>Generate an RFQ document from your design</div>
              <button className="btn btn-primary" onClick={handleRfq} disabled={parts.length === 0}>Generate RFQ</button>
            </div>
          ) : (
            <div>
              <div className="panel" style={{ borderColor: 'var(--green)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div><div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{rfqResult.rfq_id}</div><div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{rfqResult.project_name} | {rfqResult.created_at?.split('T')[0]}</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--green)' }}>${rfqResult.total_estimated_cost_usd}</div><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Estimated Total</div></div>
                </div>
                <div className="kpis">
                  <div className="kpi"><div className="kpi-label">Parts</div><div className="kpi-value">{rfqResult.total_parts}</div></div>
                  <div className="kpi"><div className="kpi-label">Lead Time</div><div className="kpi-value">{rfqResult.required_lead_time_days}d</div></div>
                </div>
              </div>
              <div className="panel" style={{ marginBottom: 12 }}>
                <div className="panel-title" style={{ marginBottom: 10 }}>Parts Specification</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['#', 'Part', 'Material', 'Process', 'Qty', 'Mass', 'Cost', 'Tolerance'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                  <tbody>
                    {(rfqResult.parts || []).map(p => (
                      <tr key={p.item_no}>
                        <td className="td">{p.item_no}</td>
                        <td className="td"><strong>{p.part_name}</strong><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{Object.entries(p.dimensions_mm || {}).map(([k, v]) => `${k}:${v}mm`).join(', ')}</div></td>
                        <td className="td" style={{ fontSize: '.8rem' }}>{p.material_zh}</td>
                        <td className="td" style={{ fontSize: '.8rem' }}>{p.process}</td>
                        <td className="td">{p.quantity}</td>
                        <td className="td">{p.mass_g}g</td>
                        <td className="td" style={{ color: 'var(--green)', fontWeight: 600 }}>${p.estimated_cost_usd}</td>
                        <td className="td" style={{ fontSize: '.75rem' }}>{p.tolerance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="panel" style={{ marginBottom: 12 }}>
                <div className="panel-title" style={{ marginBottom: 8 }}>General Requirements</div>
                {rfqResult.general_requirements && Object.entries(rfqResult.general_requirements).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: '.85rem' }}>
                    <span style={{ color: 'var(--text2)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                    <span>{Array.isArray(v) ? v.join(', ') : v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={handleRfqWithQuotes} disabled={quoting}>{quoting ? 'Getting Quotes...' : 'Get Multi-Supplier Quotes'}</button>
                <button className="btn btn-secondary">Download PDF</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'quotes' && (
        <div>
          {!supplierQuotes ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 14 }}>💰</div>
              <div style={{ marginBottom: 10 }}>Get real-time quotes from 8+ manufacturing suppliers</div>
              <button className="btn btn-primary" onClick={handleRfqWithQuotes} disabled={quoting || parts.length === 0}>{quoting ? 'Querying Suppliers...' : 'Get Quotes Now'}</button>
            </div>
          ) : (
            <div>
              {supplierQuotes.supplier_summary && (
                <div className="panel" style={{ marginBottom: 16 }}>
                  <div className="panel-title" style={{ marginBottom: 12 }}>Supplier Comparison (Ranked by Price)</div>
                  <div className="grid-3">
                    {(supplierQuotes.supplier_summary || []).map((s, i) => (
                      <div key={s.supplier || i} className="card" style={{ padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div>
                            {i === 0 && <span className="badge badge-green" style={{ marginBottom: 4, display: 'inline-block' }}>Best Price</span>}
                            <div style={{ fontWeight: 700 }}>{s.supplier_name_zh || s.name_zh || s.supplier_name || s.name}</div>
                            <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{s.supplier_name || s.name}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: i === 0 ? 'var(--green)' : 'var(--text)' }}>${s.quote_usd || s.total_usd}</div>
                            {s.per_unit_usd && <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>${s.per_unit_usd}/unit</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, fontSize: '.78rem', flexWrap: 'wrap' }}>
                          {s.lead_days > 0 && <span>Lead: {s.lead_days || s.max_lead_days}d</span>}
                          {s.rating > 0 && <span>Rating: {s.rating}/5</span>}
                          {s.parts_covered > 0 && <span>Parts: {s.parts_covered}</span>}
                          <span className={`badge ${s.source === 'api' ? 'badge-green' : 'badge-blue'}`}>
                            {s.source === 'api' ? 'Live API' : 'Smart Est.'}
                          </span>
                          {s.confidence_pct && <span className="badge">{s.confidence_pct}% confidence</span>}
                        </div>
                        {s.website && <a href={s.website} target="_blank" rel="noreferrer" style={{ fontSize: '.72rem', color: 'var(--accent)', marginTop: 6, display: 'block' }}>Visit supplier</a>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {supplierQuotes.per_part_quotes && (
                <div className="panel">
                  <div className="panel-title" style={{ marginBottom: 10 }}>Per-Part Quote Breakdown</div>
                  {supplierQuotes.per_part_quotes.map((pq, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>{pq.part_name}</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>{['Supplier', 'Price', 'Per Unit', 'Lead', 'Source', 'Rating'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                        <tbody>
                          {(pq.quotes || []).slice(0, 5).map((q, j) => (
                            <tr key={j}>
                              <td className="td"><strong>{q.supplier_name_zh || q.supplier_name || q.supplier}</strong></td>
                              <td className="td" style={{ color: j === 0 ? 'var(--green)' : 'var(--text)', fontWeight: j === 0 ? 700 : 400 }}>${q.quote_usd}</td>
                              <td className="td">${q.per_unit_usd}</td>
                              <td className="td">{q.lead_days}d</td>
                              <td className="td"><span className={`badge ${q.source === 'api' ? 'badge-green' : 'badge-blue'}`}>{q.source}</span></td>
                              <td className="td">{q.rating}/5</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
