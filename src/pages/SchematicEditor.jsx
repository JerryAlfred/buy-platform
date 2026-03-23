import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../api';

const COMPONENT_LIBRARY = [
  { id: 'resistor', name: 'Resistor', symbol: 'R', category: 'passive', pins: 2 },
  { id: 'capacitor', name: 'Capacitor', symbol: 'C', category: 'passive', pins: 2 },
  { id: 'inductor', name: 'Inductor', symbol: 'L', category: 'passive', pins: 2 },
  { id: 'diode', name: 'Diode', symbol: 'D', category: 'semiconductor', pins: 2 },
  { id: 'led', name: 'LED', symbol: 'LED', category: 'semiconductor', pins: 2 },
  { id: 'npn', name: 'NPN Transistor', symbol: 'Q', category: 'semiconductor', pins: 3 },
  { id: 'mosfet_n', name: 'N-MOSFET', symbol: 'M', category: 'semiconductor', pins: 3 },
  { id: 'opamp', name: 'Op-Amp', symbol: 'U', category: 'ic', pins: 5 },
  { id: 'mcu', name: 'Microcontroller', symbol: 'U', category: 'ic', pins: 'multi' },
  { id: 'connector_2', name: '2-Pin Connector', symbol: 'J', category: 'connector', pins: 2 },
  { id: 'usb_c', name: 'USB-C', symbol: 'J', category: 'connector', pins: 24 },
  { id: 'crystal', name: 'Crystal', symbol: 'Y', category: 'passive', pins: 2 },
  { id: 'voltage_reg', name: 'Voltage Regulator', symbol: 'U', category: 'ic', pins: 3 },
  { id: 'can_transceiver', name: 'CAN Transceiver', symbol: 'U', category: 'ic', pins: 8 },
  { id: 'gnd', name: 'Ground', symbol: 'GND', category: 'power', pins: 1 },
  { id: 'vcc', name: 'VCC', symbol: 'VCC', category: 'power', pins: 1 },
];

const SHAPES = {
  resistor: (x, y, ctx) => { ctx.strokeRect(x-15,y-6,30,12); ctx.moveTo(x-25,y); ctx.lineTo(x-15,y); ctx.moveTo(x+15,y); ctx.lineTo(x+25,y); },
  capacitor: (x, y, ctx) => { ctx.moveTo(x-3,y-12); ctx.lineTo(x-3,y+12); ctx.moveTo(x+3,y-12); ctx.lineTo(x+3,y+12); ctx.moveTo(x-25,y); ctx.lineTo(x-3,y); ctx.moveTo(x+3,y); ctx.lineTo(x+25,y); },
  diode: (x, y, ctx) => { ctx.moveTo(x-8,y-10); ctx.lineTo(x+8,y); ctx.lineTo(x-8,y+10); ctx.closePath(); ctx.moveTo(x+8,y-10); ctx.lineTo(x+8,y+10); },
  gnd: (x, y, ctx) => { ctx.moveTo(x,y-10); ctx.lineTo(x,y); ctx.moveTo(x-10,y); ctx.lineTo(x+10,y); ctx.moveTo(x-6,y+4); ctx.lineTo(x+6,y+4); ctx.moveTo(x-2,y+8); ctx.lineTo(x+2,y+8); },
  vcc: (x, y, ctx) => { ctx.moveTo(x,y+10); ctx.lineTo(x,y); ctx.moveTo(x-8,y); ctx.lineTo(x+8,y); },
  default: (x, y, ctx) => { ctx.strokeRect(x-18,y-14,36,28); },
};

export default function SchematicEditor() {
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tool, setTool] = useState('select');
  const [catFilter, setCatFilter] = useState('all');
  const [wireStart, setWireStart] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const canvasRef = useRef(null);
  const nextId = useRef(1);

  const addComponent = (lib) => {
    const id = nextId.current++;
    setComponents(prev => [...prev, { id, type: lib.id, name: `${lib.symbol}${id}`, symbol: lib.symbol, x: 300 + Math.random() * 200, y: 200 + Math.random() * 150, rotation: 0, value: lib.id === 'resistor' ? '10k' : lib.id === 'capacitor' ? '100nF' : '' }]);
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0a0e14'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 0.5;
    for (let x = 0; x < c.width; x += 20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,c.height); ctx.stroke(); }
    for (let y = 0; y < c.height; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(c.width,y); ctx.stroke(); }

    wires.forEach(w => {
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w.x1,w.y1); ctx.lineTo(w.x2,w.y2); ctx.stroke();
      ctx.fillStyle = '#22c55e'; [{ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }].forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); });
    });

    components.forEach(comp => {
      const isSel = selected?.id === comp.id;
      ctx.save(); ctx.translate(comp.x, comp.y); ctx.rotate((comp.rotation||0)*Math.PI/180);
      ctx.strokeStyle = isSel ? '#3b82f6' : '#e2e8f0'; ctx.lineWidth = isSel ? 2.5 : 1.5;
      ctx.beginPath(); (SHAPES[comp.type] || SHAPES.default)(0, 0, ctx); ctx.stroke();
      ctx.fillStyle = isSel ? '#3b82f6' : '#94a3b8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(comp.name, 0, -20);
      if (comp.value) { ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.fillText(comp.value, 0, 28); }
      ctx.restore();
    });

    if (wireStart) {
      ctx.strokeStyle = 'rgba(34,197,94,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([5,5]);
      ctx.beginPath(); ctx.moveTo(wireStart.x, wireStart.y); ctx.lineTo(wireStart.mx||wireStart.x, wireStart.my||wireStart.y); ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [components, wires, selected, wireStart]);

  const canvasXY = (e) => { const r = canvasRef.current.getBoundingClientRect(); return { x: (e.clientX-r.left)*(canvasRef.current.width/r.width), y: (e.clientY-r.top)*(canvasRef.current.height/r.height) }; };

  const onClick = (e) => {
    const { x, y } = canvasXY(e);
    if (tool === 'wire') {
      if (!wireStart) { setWireStart({ x, y, mx: x, my: y }); } else { setWires(prev => [...prev, { x1: wireStart.x, y1: wireStart.y, x2: x, y2: y }]); setWireStart(null); }
      return;
    }
    setSelected(components.find(c => Math.abs(c.x-x)<25 && Math.abs(c.y-y)<20) || null);
  };

  const onMouseDown = (e) => {
    if (tool !== 'select') return;
    const { x, y } = canvasXY(e);
    const hit = components.find(c => Math.abs(c.x-x)<25 && Math.abs(c.y-y)<20);
    if (hit) { setDragInfo({ id: hit.id, ox: x-hit.x, oy: y-hit.y }); setSelected(hit); }
  };

  const onMouseMove = (e) => {
    const { x, y } = canvasXY(e);
    if (dragInfo) setComponents(prev => prev.map(c => c.id===dragInfo.id ? {...c, x: x-dragInfo.ox, y: y-dragInfo.oy} : c));
    if (wireStart) setWireStart(prev => prev ? {...prev, mx: x, my: y} : null);
  };

  const bom = components.reduce((acc, c) => {
    const k = `${c.type}_${c.value||''}`; if (!acc[k]) acc[k] = { type: c.type, value: c.value, qty: 0, refs: [] }; acc[k].qty++; acc[k].refs.push(c.name); return acc;
  }, {});

  const filtered = COMPONENT_LIBRARY.filter(c => catFilter === 'all' || c.category === catFilter);

  return (
    <div>
      <h2 className="page-title">Schematic Editor</h2>
      <p className="page-sub">Design circuit schematics with drag-and-drop components.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`btn ${tool==='select'?'btn-primary':'btn-secondary'}`} onClick={() => { setTool('select'); setWireStart(null); }}>Select</button>
        <button className={`btn ${tool==='wire'?'btn-primary':'btn-secondary'}`} onClick={() => setTool('wire')}>Wire</button>
        <button className="btn btn-secondary" onClick={() => selected && setComponents(prev => prev.map(c => c.id===selected.id ? {...c, rotation:((c.rotation||0)+90)%360} : c))} disabled={!selected}>Rotate</button>
        <button className="btn btn-secondary" style={{ color: selected ? 'var(--red)' : undefined }} onClick={() => { if (selected) { setComponents(prev => prev.filter(c => c.id!==selected.id)); setSelected(null); } }} disabled={!selected}>Delete</button>
        {saveStatus && <span style={{ fontSize: '.78rem', color: saveStatus==='Saved' ? 'var(--green)' : 'var(--yellow)', alignSelf: 'center' }}>{saveStatus}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 220px', gap: 14, minHeight: 550 }}>
        <div className="panel" style={{ maxHeight: 550, overflow: 'auto', padding: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.9rem' }}>Components</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
            {['all','passive','semiconductor','ic','connector','power'].map(c => (
              <button key={c} className="btn-sm" style={{ background: catFilter===c ? 'var(--accent)' : '#334155', color: catFilter===c ? '#fff' : 'var(--text)' }} onClick={() => setCatFilter(c)}>{c}</button>
            ))}
          </div>
          {filtered.map(comp => (
            <div key={comp.id} style={{ padding: '5px 8px', fontSize: '.82rem', cursor: 'pointer', borderRadius: 6, marginBottom: 2 }} onClick={() => addComponent(comp)} onMouseEnter={e => e.target.style.background='rgba(59,130,246,.1)'} onMouseLeave={e => e.target.style.background='none'}>
              <span style={{ fontWeight: 600, marginRight: 6 }}>{comp.symbol}</span>{comp.name}
              <span style={{ float: 'right', color: 'var(--text3)', fontSize: '.72rem' }}>{comp.pins}p</span>
            </div>
          ))}
        </div>

        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <canvas ref={canvasRef} width={800} height={550} style={{ width: '100%', height: 550, display: 'block', cursor: tool==='wire'?'crosshair':dragInfo?'grabbing':'default' }} onClick={onClick} onMouseDown={onMouseDown} onMouseUp={() => setDragInfo(null)} onMouseMove={onMouseMove} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selected && (
            <div className="panel" style={{ padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.9rem' }}>Properties</div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: '.72rem', color: 'var(--text3)', display: 'block' }}>Reference</label>
                <input className="input" value={selected.name} onChange={e => { const v=e.target.value; setComponents(prev => prev.map(c => c.id===selected.id ? {...c,name:v}:c)); setSelected(s => ({...s,name:v})); }} />
              </div>
              <div>
                <label style={{ fontSize: '.72rem', color: 'var(--text3)', display: 'block' }}>Value</label>
                <input className="input" value={selected.value||''} onChange={e => { const v=e.target.value; setComponents(prev => prev.map(c => c.id===selected.id ? {...c,value:v}:c)); setSelected(s => ({...s,value:v})); }} />
              </div>
            </div>
          )}
          <div className="panel" style={{ padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.9rem' }}>BOM ({components.length})</div>
            {Object.values(bom).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--border)', fontSize: '.8rem' }}>
                <span>{item.type} {item.value && `(${item.value})`}</span>
                <span style={{ color: 'var(--text2)' }}>x{item.qty}</span>
              </div>
            ))}
          </div>
          <div className="panel" style={{ padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.9rem' }}>Stats</div>
            <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
              <div>Components: {components.length}</div>
              <div>Wires: {wires.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
