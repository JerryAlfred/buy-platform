import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../api';

const BODY_LAYOUT = [
  { id: 'head', x: 200, y: 30, w: 60, h: 50, rx: 30 },
  { id: 'torso', x: 165, y: 90, w: 130, h: 110, rx: 10 },
  { id: 'left_arm', x: 80, y: 95, w: 70, h: 35, rx: 6 },
  { id: 'right_arm', x: 310, y: 95, w: 70, h: 35, rx: 6 },
  { id: 'left_hand', x: 50, y: 140, w: 40, h: 35, rx: 6 },
  { id: 'right_hand', x: 370, y: 140, w: 40, h: 35, rx: 6 },
  { id: 'waist', x: 175, y: 210, w: 110, h: 40, rx: 6 },
  { id: 'left_leg', x: 155, y: 260, w: 55, h: 100, rx: 6 },
  { id: 'right_leg', x: 250, y: 260, w: 55, h: 100, rx: 6 },
  { id: 'left_foot', x: 140, y: 370, w: 65, h: 30, rx: 6 },
  { id: 'right_foot', x: 255, y: 370, w: 65, h: 30, rx: 6 },
];

export default function HumanoidAtlasPage() {
  const [tab, setTab] = useState('body');
  const [regions, setRegions] = useState({});
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionDetail, setRegionDetail] = useState(null);
  const [oems, setOems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [layers, setLayers] = useState([]);
  const [bomTree, setBomTree] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [oemCountry, setOemCountry] = useState('');
  const [hoverRegion, setHoverRegion] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    api.fetchHumanoidRegions().then(r => setRegions(r.regions || {})).catch(() => {});
    api.fetchHumanoidOem().then(r => setOems(r.companies || [])).catch(() => {});
    api.fetchHumanoidSuppliers().then(r => setSuppliers(r.suppliers || [])).catch(() => {});
    api.fetchHumanoidLayers().then(r => setLayers(r.layers || [])).catch(() => {});
    api.fetchHumanoidBomTree().then(r => setBomTree(r.tree || [])).catch(() => {});
    api.fetchHumanoidStats().then(setStats).catch(() => {});
  }, []);

  const selectRegion = useCallback(async (regionId) => {
    setSelectedRegion(regionId);
    try {
      const r = await api.fetchHumanoidRegionDetail(regionId);
      setRegionDetail(r);
    } catch (e) { console.error(e); }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!search.trim()) { setSearchResults([]); return; }
    try {
      const r = await api.searchHumanoidComponents(search);
      setSearchResults(r.results || []);
    } catch (e) { console.error(e); }
  }, [search]);

  useEffect(() => { const t = setTimeout(handleSearch, 400); return () => clearTimeout(t); }, [handleSearch]);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);

    BODY_LAYOUT.forEach(part => {
      const isSelected = selectedRegion === part.id;
      const isHover = hoverRegion === part.id;
      ctx.save();
      ctx.beginPath();
      if (part.id === 'head') {
        ctx.ellipse(part.x + part.w/2, part.y + part.h/2, part.w/2, part.h/2, 0, 0, Math.PI*2);
      } else {
        const r = part.rx || 0;
        ctx.moveTo(part.x+r, part.y); ctx.lineTo(part.x+part.w-r, part.y); ctx.quadraticCurveTo(part.x+part.w,part.y,part.x+part.w,part.y+r);
        ctx.lineTo(part.x+part.w,part.y+part.h-r); ctx.quadraticCurveTo(part.x+part.w,part.y+part.h,part.x+part.w-r,part.y+part.h);
        ctx.lineTo(part.x+r,part.y+part.h); ctx.quadraticCurveTo(part.x,part.y+part.h,part.x,part.y+part.h-r);
        ctx.lineTo(part.x,part.y+r); ctx.quadraticCurveTo(part.x,part.y,part.x+r,part.y);
      }
      ctx.fillStyle = isSelected ? 'rgba(59,130,246,.35)' : isHover ? 'rgba(59,130,246,.2)' : 'rgba(59,130,246,.08)';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#3b82f6' : isHover ? '#60a5fa' : '#334155';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      const region = regions[part.id];
      if (region) {
        ctx.fillStyle = isSelected ? '#3b82f6' : '#94a3b8';
        ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(region.label_zh, part.x+part.w/2, part.y+part.h/2+4);
      }
      ctx.restore();
    });
  }, [regions, selectedRegion, hoverRegion]);

  const canvasHit = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left)*(canvasRef.current.width/rect.width);
    const y = (e.clientY - rect.top)*(canvasRef.current.height/rect.height);
    return BODY_LAYOUT.find(p => x >= p.x && x <= p.x+p.w && y >= p.y && y <= p.y+p.h);
  };

  const filteredOems = oemCountry ? oems.filter(o => o.country === oemCountry) : oems;
  const TABS = [{ id: 'body', label: '🤖 Body Map' }, { id: 'oem', label: '🏭 OEM Database' }, { id: 'suppliers', label: '📦 Component Suppliers' }, { id: 'layers', label: '🔗 Supply Chain Layers' }, { id: 'bom', label: '🌳 BOM Tree' }];

  return (
    <div>
      <h2 className="page-title">Humanoid Atlas</h2>
      <p className="page-sub">Interactive humanoid robot supply chain map — {stats.oem_companies || 0} OEMs, {stats.total_components || 0} components, {stats.component_suppliers || 0} tier-1 suppliers.</p>

      <div className="kpis">
        <div className="kpi"><div className="kpi-label">Body Regions</div><div className="kpi-value">{stats.body_regions || 0}</div></div>
        <div className="kpi"><div className="kpi-label">Subsystems</div><div className="kpi-value">{stats.subsystems || 0}</div></div>
        <div className="kpi"><div className="kpi-label">Components</div><div className="kpi-value">{stats.total_components || 0}</div></div>
        <div className="kpi"><div className="kpi-label">OEMs</div><div className="kpi-value">{stats.oem_companies || 0}</div></div>
        <div className="kpi"><div className="kpi-label">Suppliers</div><div className="kpi-value">{stats.component_suppliers || 0}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 16px', fontSize: '.85rem', cursor: 'pointer', border: 'none', background: 'none', color: tab===t.id?'var(--accent)':'var(--text2)', borderBottom: tab===t.id?'2px solid var(--accent)':'2px solid transparent', fontWeight: tab===t.id?600:400 }}>{t.label}</button>)}
      </div>

      {tab === 'body' && (
        <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: 20 }}>
          <div>
            <div className="panel" style={{ padding: 10, textAlign: 'center' }}>
              <canvas ref={canvasRef} width={460} height={420} style={{ width: '100%', height: 420, cursor: 'pointer' }}
                onClick={e => { const h = canvasHit(e); if (h) selectRegion(h.id); }}
                onMouseMove={e => { const h = canvasHit(e); setHoverRegion(h?.id || null); }}
                onMouseLeave={() => setHoverRegion(null)} />
              <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 4 }}>Click a body region to explore components</div>
            </div>
            <div style={{ marginTop: 12 }}>
              <input className="input" placeholder="Search components: motor, sensor, reducer..." value={search} onChange={e => setSearch(e.target.value)} />
              {searchResults.length > 0 && (
                <div className="panel" style={{ marginTop: 8, maxHeight: 200, overflow: 'auto', padding: 10 }}>
                  {searchResults.map((r, i) => <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: '.82rem' }}><strong>{r.name_zh}</strong> <span style={{ color: 'var(--text2)' }}>— {r.subsystem}</span><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{r.price_range} | {(r.suppliers||[]).join(', ')}</div></div>)}
                </div>
              )}
            </div>
          </div>

          <div>
            {!regionDetail && <div className="panel" style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}><div style={{ fontSize: '3rem', marginBottom: 10 }}>👈</div>Click a body region on the left to see components</div>}
            {regionDetail && (
              <>
                <div className="panel" style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{regionDetail.label_zh} ({regionDetail.label})</div>
                  <div style={{ fontSize: '.85rem', color: 'var(--text2)' }}>{regionDetail.description_zh}</div>
                </div>
                {(regionDetail.subsystem_details || []).map(sub => (
                  <div key={sub.id} className="panel" style={{ marginBottom: 12 }}>
                    <div className="panel-title" style={{ marginBottom: 10 }}>{sub.label_zh}</div>
                    <div className="grid-3">
                      {(sub.components || []).map(c => (
                        <div key={c.id} className="card" style={{ padding: 12 }}>
                          <strong>{c.name_zh}</strong>
                          <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: 2 }}>{c.name}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 6, fontSize: '.72rem' }}>
                            <span className="badge badge-blue">{c.category}</span>
                            <span style={{ color: 'var(--green)' }}>{c.price_range}</span>
                          </div>
                          <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {(c.suppliers || []).map(s => <span key={s} style={{ fontSize: '.68rem', padding: '1px 6px', background: 'rgba(59,130,246,.1)', borderRadius: 4, color: 'var(--accent)' }}>{s}</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'oem' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['', 'US', 'CN', 'CA', 'NO', 'JP'].map(c => <button key={c} className="btn-sm" style={{ background: oemCountry===c?'var(--accent)':'#334155', color: oemCountry===c?'#fff':'var(--text)' }} onClick={() => setOemCountry(c)}>{c||'All'}</button>)}
          </div>
          <div className="grid-3">
            {filteredOems.map(o => (
              <div key={o.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong>{o.name_zh || o.name}</strong>
                  <span className={`badge badge-${o.status==='commercial'?'green':o.status==='pilot'?'yellow':'blue'}`}>{o.status}</span>
                </div>
                <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: 8 }}>{o.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: '.78rem', color: 'var(--text2)' }}>
                  <div>DOF: <strong>{o.dof}</strong></div>
                  <div>Height: <strong>{o.height_cm}cm</strong></div>
                  <div>Weight: <strong>{o.weight_kg}kg</strong></div>
                  <div>Country: <strong>{o.country}</strong></div>
                </div>
                {o.funding_usd && <div style={{ fontSize: '.78rem', color: 'var(--green)', marginTop: 6 }}>Funding: {o.funding_usd}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'suppliers' && (
        <div className="grid-3">
          {suppliers.map(s => (
            <div key={s.id} className="card" style={{ padding: 14 }}>
              <strong>{s.name_zh}</strong>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{s.name} ({s.country})</div>
              <div style={{ fontSize: '.78rem', marginTop: 6 }}><span className="badge badge-blue">{s.category}</span> {s.market_share && <span style={{ color: 'var(--text3)' }}>Market: {s.market_share}</span>}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--text2)', marginTop: 6 }}>{(s.products || []).join(', ')}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'layers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {layers.map((layer, idx) => (
            <div key={layer.id} className="panel" style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{idx + 1}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '.95rem' }}>{layer.label_zh} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>({layer.label})</span></div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {(layer.examples || []).map(ex => <span key={ex} className="badge badge-blue">{ex}</span>)}
                </div>
              </div>
              {idx < layers.length - 1 && <div style={{ position: 'absolute', left: 36, bottom: -16, height: 16, width: 2, background: 'var(--accent)' }} />}
            </div>
          ))}
        </div>
      )}

      {tab === 'bom' && (
        <div className="panel">
          <div className="panel-title" style={{ marginBottom: 16 }}>Complete Humanoid BOM Tree</div>
          {bomTree.map(region => (
            <div key={region.id} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: 8, padding: '6px 10px', background: 'rgba(59,130,246,.08)', borderRadius: 6 }}>🤖 {region.label}</div>
              {(region.children || []).map(sub => (
                <div key={sub.id} style={{ marginLeft: 24, marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--accent)', marginBottom: 4 }}>├ {sub.label}</div>
                  <div style={{ marginLeft: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(sub.children || []).map(comp => (
                      <span key={comp.id} className="badge badge-blue" style={{ fontSize: '.75rem', padding: '3px 8px' }}>{comp.label} <span style={{ color: 'var(--green)', marginLeft: 4 }}>{comp.price}</span></span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
