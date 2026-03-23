import { useState, useEffect, useRef } from 'react';

const LAYERS = [
  { id: 'f_cu', name: 'F.Cu', color: '#ff3333' },
  { id: 'b_cu', name: 'B.Cu', color: '#3333ff' },
  { id: 'f_mask', name: 'F.Mask', color: '#009933' },
  { id: 'f_silk', name: 'F.Silk', color: '#ffff00' },
  { id: 'edge_cuts', name: 'Edge', color: '#ffffff' },
];

const FOOTPRINTS = [
  { id: 'r0402', name: '0402', w: 12, h: 6 },
  { id: 'r0603', name: '0603', w: 16, h: 8 },
  { id: 'r0805', name: '0805', w: 20, h: 10 },
  { id: 'sot23', name: 'SOT-23', w: 18, h: 14 },
  { id: 'soic8', name: 'SOIC-8', w: 30, h: 20 },
  { id: 'qfp48', name: 'LQFP-48', w: 50, h: 50 },
  { id: 'usb_c', name: 'USB-C', w: 22, h: 14 },
  { id: 'via', name: 'Via', w: 6, h: 6 },
];

export default function PcbLayoutEditor() {
  const [fps, setFps] = useState([]);
  const [traces, setTraces] = useState([]);
  const [board, setBoard] = useState({ w: 80, h: 60 });
  const [activeLayer, setActiveLayer] = useState('f_cu');
  const [vis, setVis] = useState(() => Object.fromEntries(LAYERS.map(l => [l.id, true])));
  const [tool, setTool] = useState('select');
  const [sel, setSel] = useState(null);
  const [drag, setDrag] = useState(null);
  const [traceStart, setTraceStart] = useState(null);
  const [drc, setDrc] = useState(null);
  const [zoom, setZoom] = useState(4);
  const canvasRef = useRef(null);
  const nid = useRef(1);

  const addFp = (fp) => { const id = nid.current++; setFps(prev => [...prev, { id, type: fp.id, name: `${fp.name}_${id}`, layer: activeLayer, x: board.w/2+(Math.random()-.5)*20, y: board.h/2+(Math.random()-.5)*15, rotation: 0, w: fp.w/zoom, h: fp.h/zoom }]); };

  const runDrc = () => {
    const errs = [];
    for (let i=0;i<fps.length;i++) for (let j=i+1;j<fps.length;j++) {
      const d = Math.sqrt((fps[i].x-fps[j].x)**2+(fps[i].y-fps[j].y)**2);
      if (d < (fps[i].w+fps[j].w)/2+0.15) errs.push({ msg: `${fps[i].name} ↔ ${fps[j].name}: clearance violation`, sev: 'error' });
    }
    fps.forEach(fp => { if (fp.x<0||fp.y<0||fp.x>board.w||fp.y>board.h) errs.push({ msg: `${fp.name} outside board`, sev: 'warn' }); });
    setDrc({ errs, pass: errs.filter(e => e.sev==='error').length===0 });
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    const cw = c.width, ch = c.height;
    ctx.fillStyle = '#0a0e14'; ctx.fillRect(0,0,cw,ch);
    const ox = (cw-board.w*zoom)/2, oy = (ch-board.h*zoom)/2;

    ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 0.5;
    for (let x = ox%(zoom*2.54); x<cw; x+=zoom*2.54) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,ch); ctx.stroke(); }
    for (let y = oy%(zoom*2.54); y<ch; y+=zoom*2.54) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cw,y); ctx.stroke(); }

    if (vis.edge_cuts) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(ox,oy,board.w*zoom,board.h*zoom); }
    if (vis.f_mask) { ctx.fillStyle = 'rgba(0,102,51,0.2)'; ctx.fillRect(ox+1,oy+1,board.w*zoom-2,board.h*zoom-2); }

    traces.forEach(t => {
      if (!vis[t.layer]) return;
      const li = LAYERS.find(l => l.id===t.layer);
      ctx.strokeStyle = li?.color||'#ff3333'; ctx.lineWidth = 0.25*zoom; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ox+t.x1*zoom, oy+t.y1*zoom); ctx.lineTo(ox+t.x2*zoom, oy+t.y2*zoom); ctx.stroke();
    });

    fps.forEach(fp => {
      if (!vis[fp.layer]) return;
      const fx=ox+fp.x*zoom, fy=oy+fp.y*zoom, fw=fp.w*zoom, fh=fp.h*zoom;
      const isSel = sel?.id===fp.id;
      ctx.save(); ctx.translate(fx,fy); ctx.rotate((fp.rotation||0)*Math.PI/180);
      ctx.fillStyle = isSel ? 'rgba(59,130,246,.3)' : 'rgba(200,200,200,.1)';
      ctx.fillRect(-fw/2,-fh/2,fw,fh);
      ctx.strokeStyle = isSel ? '#3b82f6' : (LAYERS.find(l=>l.id===fp.layer)?.color||'#888');
      ctx.lineWidth = isSel ? 2 : 1; ctx.strokeRect(-fw/2,-fh/2,fw,fh);
      ctx.fillStyle = '#cc9900';
      if (fp.type==='via') { ctx.beginPath(); ctx.arc(0,0,fw/2,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#0a0e14'; ctx.beginPath(); ctx.arc(0,0,fw/4,0,Math.PI*2); ctx.fill(); }
      else { const ps = Math.min(fw,fh)*.3; ctx.fillRect(-fw/2+1,-fh/2+1,ps,fh-2); ctx.fillRect(fw/2-ps-1,-fh/2+1,ps,fh-2); }
      ctx.fillStyle = isSel?'#3b82f6':'#94a3b8'; ctx.font = `${Math.max(8,zoom*1.5)}px sans-serif`; ctx.textAlign='center';
      ctx.fillText(fp.name,0,-fh/2-4); ctx.restore();
    });

    ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
    ctx.fillText(`${board.w}mm x ${board.h}mm | ${LAYERS.find(l=>l.id===activeLayer)?.name} | ${zoom}x`, 10, ch-10);
  }, [fps, traces, board, vis, activeLayer, sel, zoom, traceStart]);

  const toBoard = (e) => { const r = canvasRef.current.getBoundingClientRect(); const cx=(e.clientX-r.left)*(canvasRef.current.width/r.width), cy=(e.clientY-r.top)*(canvasRef.current.height/r.height); const ox=(canvasRef.current.width-board.w*zoom)/2, oy=(canvasRef.current.height-board.h*zoom)/2; return { x: (cx-ox)/zoom, y: (cy-oy)/zoom }; };

  const onClick = (e) => {
    const p = toBoard(e);
    if (tool==='trace') { if (!traceStart) setTraceStart(p); else { setTraces(prev => [...prev,{x1:traceStart.x,y1:traceStart.y,x2:p.x,y2:p.y,layer:activeLayer,width:.25}]); setTraceStart(null); } return; }
    setSel(fps.find(f => Math.abs(f.x-p.x)<f.w/2+1 && Math.abs(f.y-p.y)<f.h/2+1) || null);
  };

  return (
    <div>
      <h2 className="page-title">PCB Layout Editor</h2>
      <p className="page-sub">Place footprints, route traces, and run DRC checks.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`btn ${tool==='select'?'btn-primary':'btn-secondary'}`} onClick={() => { setTool('select'); setTraceStart(null); }}>Select</button>
        <button className={`btn ${tool==='trace'?'btn-primary':'btn-secondary'}`} onClick={() => setTool('trace')}>Route Trace</button>
        <button className="btn btn-secondary" onClick={() => sel && setFps(prev => prev.map(f => f.id===sel.id?{...f,rotation:((f.rotation||0)+90)%360}:f))} disabled={!sel}>Rotate</button>
        <button className="btn btn-secondary" style={{ color: sel?'var(--red)':undefined }} onClick={() => { if (sel) { setFps(prev => prev.filter(f=>f.id!==sel.id)); setSel(null); } }} disabled={!sel}>Delete</button>
        <button className="btn btn-secondary" onClick={runDrc}>Run DRC</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 200px', gap: 14, minHeight: 550 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="panel" style={{ padding: 14, maxHeight: 250, overflow: 'auto' }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.85rem' }}>Footprints</div>
            {FOOTPRINTS.map(fp => (
              <div key={fp.id} style={{ padding: '4px 8px', fontSize: '.8rem', cursor: 'pointer', borderRadius: 6, marginBottom: 2 }} onClick={() => addFp(fp)} onMouseEnter={e => e.target.style.background='rgba(59,130,246,.1)'} onMouseLeave={e => e.target.style.background='none'}>
                {fp.name} <span style={{ float: 'right', color: 'var(--text3)', fontSize: '.7rem' }}>{fp.w}x{fp.h}</span>
              </div>
            ))}
          </div>
          <div className="panel" style={{ padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.85rem' }}>Layers</div>
            {LAYERS.map(l => (
              <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '.78rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={vis[l.id]} onChange={() => setVis(v => ({...v,[l.id]:!v[l.id]}))} />
                <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                <span onClick={(e) => { e.preventDefault(); setActiveLayer(l.id); }} style={{ fontWeight: activeLayer===l.id?700:400, color: activeLayer===l.id?l.color:undefined }}>{l.name}</span>
              </label>
            ))}
          </div>
          <div className="panel" style={{ padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '.85rem' }}>Board (mm)</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input className="input" type="number" value={board.w} onChange={e => setBoard(b => ({...b,w:parseFloat(e.target.value)||80}))} style={{ width: 60 }} />
              <span style={{ color: 'var(--text3)', alignSelf: 'center' }}>x</span>
              <input className="input" type="number" value={board.h} onChange={e => setBoard(b => ({...b,h:parseFloat(e.target.value)||60}))} style={{ width: 60 }} />
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <canvas ref={canvasRef} width={900} height={550} style={{ width: '100%', height: 550, display: 'block', cursor: tool==='trace'?'crosshair':'default' }} onClick={onClick} onMouseDown={e => { if (tool!=='select') return; const p=toBoard(e); const f=fps.find(fp=>Math.abs(fp.x-p.x)<fp.w/2+1&&Math.abs(fp.y-p.y)<fp.h/2+1); if (f) { setDrag({id:f.id,ox:p.x-f.x,oy:p.y-f.y}); setSel(f); } }} onMouseUp={() => setDrag(null)} onMouseMove={e => { if (drag) { const p=toBoard(e); setFps(prev => prev.map(f=>f.id===drag.id?{...f,x:p.x-drag.ox,y:p.y-drag.oy}:f)); } }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sel && <div className="panel" style={{ padding: 14 }}><div style={{ fontWeight: 600, marginBottom: 6, fontSize: '.85rem' }}>Properties</div><div style={{ fontSize: '.82rem', color: 'var(--text2)' }}><div>Name: {sel.name}</div><div>Layer: {sel.layer}</div><div>Pos: ({sel.x.toFixed(1)}, {sel.y.toFixed(1)})</div></div></div>}
          <div className="panel" style={{ padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '.85rem' }}>Stats</div>
            <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}><div>Footprints: {fps.length}</div><div>Traces: {traces.length}</div></div>
          </div>
          <div className="panel" style={{ padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '.85rem' }}>Zoom</div>
            <input type="range" min="2" max="10" step=".5" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={{ width: '100%' }} />
            <div style={{ fontSize: '.72rem', color: 'var(--text3)', textAlign: 'center' }}>{zoom}x</div>
          </div>
          {drc && (
            <div className="panel" style={{ padding: 14, borderColor: drc.pass?'var(--green)':'var(--red)' }}>
              <div style={{ fontWeight: 600, marginBottom: 6, color: drc.pass?'var(--green)':'var(--red)', fontSize: '.85rem' }}>DRC: {drc.pass?'PASSED':`${drc.errs.length} Issues`}</div>
              {drc.errs.map((e,i) => <div key={i} style={{ fontSize: '.75rem', color: e.sev==='error'?'var(--red)':'var(--yellow)', marginBottom: 3 }}>{e.msg}</div>)}
              {drc.pass && <div style={{ fontSize: '.82rem', color: 'var(--green)' }}>All checks passed</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
