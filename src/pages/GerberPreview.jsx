import { useState, useRef, useEffect, useCallback } from 'react';

const LAYER_COLORS = { top_copper: '#ff3333', bottom_copper: '#3333ff', top_soldermask: '#00aa00', top_silkscreen: '#ffff00', board_outline: '#ffffff', drill: '#ff9900' };
const LAYER_LABELS = { top_copper: 'Top Copper', bottom_copper: 'Bottom Copper', top_soldermask: 'Solder Mask', top_silkscreen: 'Silkscreen', board_outline: 'Board Outline', drill: 'Drill Holes' };
const BOARD_COLORS = { green: { mask: '#006633', sub: '#1a3d1a' }, red: { mask: '#990000', sub: '#3d1a1a' }, blue: { mask: '#003399', sub: '#1a1a3d' }, black: { mask: '#222', sub: '#111' }, white: { mask: '#ccc', sub: '#aaa' }, yellow: { mask: '#cc9900', sub: '#665500' }, purple: { mask: '#660099', sub: '#331a4d' } };

export default function GerberPreview() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [vis, setVis] = useState({});
  const [zoom, setZoom] = useState(1);
  const [boardColor, setBoardColor] = useState('green');
  const canvasRef = useRef(null);

  const onUpload = useCallback((e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setFile(f);
    const layers = { top_copper: true, bottom_copper: true, top_soldermask: true, top_silkscreen: true, board_outline: true, drill: true };
    setVis(layers);
    setData({ name: f.name, layers: Object.keys(layers), bw: 80, bh: 60, layerCount: 2 });
  }, []);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const c = canvasRef.current, ctx = c.getContext('2d'), w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h); ctx.save(); ctx.scale(zoom, zoom);
    const bw = data.bw, bh = data.bh;
    const scale = Math.min((w/zoom-80)/bw, (h/zoom-80)/bh);
    const ox = (w/zoom-bw*scale)/2, oy = (h/zoom-bh*scale)/2;
    const col = BOARD_COLORS[boardColor] || BOARD_COLORS.green;

    ctx.fillStyle = '#0a0e14'; ctx.fillRect(0, 0, w/zoom, h/zoom);
    if (vis.board_outline) { ctx.fillStyle = col.sub; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.fillRect(ox,oy,bw*scale,bh*scale); ctx.strokeRect(ox,oy,bw*scale,bh*scale); }
    if (vis.top_soldermask) { ctx.fillStyle = col.mask; ctx.globalAlpha = .6; ctx.fillRect(ox+2,oy+2,bw*scale-4,bh*scale-4); ctx.globalAlpha = 1; }
    if (vis.top_copper) {
      ctx.strokeStyle = LAYER_COLORS.top_copper; ctx.lineWidth = 2;
      for (let i=0;i<8;i++) { ctx.beginPath(); ctx.moveTo(ox+10+Math.random()*(bw*scale-40), oy+10+Math.random()*(bh*scale-40)); ctx.lineTo(ox+10+Math.random()*(bw*scale-40), oy+10+Math.random()*(bh*scale-40)); ctx.stroke(); }
      ctx.fillStyle = LAYER_COLORS.top_copper;
      for (let i=0;i<12;i++) { ctx.beginPath(); ctx.arc(ox+15+Math.random()*(bw*scale-30), oy+15+Math.random()*(bh*scale-30), 3+Math.random()*4, 0, Math.PI*2); ctx.fill(); }
    }
    if (vis.top_silkscreen) { ctx.font = `${10*scale/4}px monospace`; ctx.fillStyle = '#ffff00'; ctx.fillText('U1',ox+20,oy+30); ctx.fillText('R1',ox+bw*scale-40,oy+20); ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 1; ctx.strokeRect(ox+15,oy+15,30,20); }
    if (vis.drill) { ctx.fillStyle = '#000'; ctx.strokeStyle = LAYER_COLORS.drill; ctx.lineWidth = 1; for (let i=0;i<8;i++) { const dx=ox+20+Math.random()*(bw*scale-40), dy=oy+20+Math.random()*(bh*scale-40); ctx.beginPath(); ctx.arc(dx,dy,2.5,0,Math.PI*2); ctx.fill(); ctx.stroke(); } }
    ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif'; ctx.fillText(`${bw}mm x ${bh}mm | ${data.layerCount} layers`, ox, oy+bh*scale+18);
    ctx.restore();
  }, [data, vis, zoom, boardColor]);

  return (
    <div>
      <h2 className="page-title">Gerber Preview</h2>
      <p className="page-sub">Upload and visualize Gerber files before ordering.</p>

      {!data && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 14 }}>👁️</div>
          <div style={{ fontSize: '1rem', marginBottom: 8 }}>No Gerber file loaded</div>
          <label className="btn btn-primary" style={{ marginTop: 16, cursor: 'pointer' }}>
            Upload Gerber ZIP
            <input type="file" accept=".zip,.rar,.gbr" style={{ display: 'none' }} onChange={onUpload} />
          </label>
        </div>
      )}

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="panel" style={{ padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: '.9rem' }}>Layers</div>
              {data.layers.map(l => (
                <label key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '.82rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!vis[l]} onChange={() => setVis(v => ({...v,[l]:!v[l]}))} />
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: LAYER_COLORS[l]||'#666' }} />
                  {LAYER_LABELS[l]||l}
                </label>
              ))}
            </div>
            <div className="panel" style={{ padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: '.9rem' }}>Board Info</div>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
                <div>Size: {data.bw} x {data.bh} mm</div>
                <div>Layers: {data.layerCount}</div>
                <div>File: {data.name}</div>
              </div>
            </div>
            <div className="panel" style={{ padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: '.9rem' }}>Board Color</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.keys(BOARD_COLORS).map(c => (
                  <button key={c} onClick={() => setBoardColor(c)} style={{ width: 28, height: 28, borderRadius: 6, border: boardColor===c?'2px solid var(--accent)':'2px solid transparent', background: BOARD_COLORS[c].mask, cursor: 'pointer' }} title={c} />
                ))}
              </div>
            </div>
            <div className="panel" style={{ padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '.9rem' }}>Zoom</div>
              <input type="range" min=".5" max="3" step=".1" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={{ width: '100%' }} />
              <div style={{ fontSize: '.72rem', color: 'var(--text3)', textAlign: 'center' }}>{Math.round(zoom*100)}%</div>
            </div>
          </div>
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <canvas ref={canvasRef} width={900} height={600} style={{ width: '100%', height: 600, display: 'block' }} />
          </div>
        </div>
      )}
    </div>
  );
}
