import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

export default function PartsCatalogPage() {
  const [categories, setCategories] = useState([]);
  const [parts, setParts] = useState([]);
  const [stats, setStats] = useState({});
  const [total, setTotal] = useState(0);
  const [selCat, setSelCat] = useState('');
  const [selSub, setSelSub] = useState('');
  const [search, setSearch] = useState('');
  const [isStandard, setIsStandard] = useState(null);
  const [page, setPage] = useState(1);
  const [expandedCats, setExpandedCats] = useState({});
  const [selectedPart, setSelectedPart] = useState(null);
  const [view, setView] = useState('grid');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.fetchPartCategories().then(r => setCategories(r.categories || [])).catch(() => {});
    api.fetchPartStats().then(setStats).catch(() => {});
  }, []);

  const loadParts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.fetchParts({ q: search, category: selCat, subcategory: selSub, is_standard: isStandard, page, page_size: 50 });
      setParts(r.items || []);
      setTotal(r.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, selCat, selSub, isStandard, page]);

  useEffect(() => { const t = setTimeout(loadParts, 300); return () => clearTimeout(t); }, [loadParts]);

  const toggleCat = (catId) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const selectCategory = (catId, subId = '') => {
    setSelCat(catId);
    setSelSub(subId);
    setPage(1);
    setSelectedPart(null);
  };

  return (
    <div>
      <h2 className="page-title">Parts Catalog</h2>
      <p className="page-sub">Browse {stats.total_parts || 0} parts across {stats.total_categories || 0} categories — fasteners, bearings, motors, sensors, and more.</p>

      <div className="kpis">
        <div className="kpi"><div className="kpi-label">Total Parts</div><div className="kpi-value">{stats.total_parts || 0}</div></div>
        <div className="kpi"><div className="kpi-label">Categories</div><div className="kpi-value">{stats.total_categories || 0}</div></div>
        <div className="kpi"><div className="kpi-label">Standard Parts</div><div className="kpi-value" style={{ color: 'var(--green)' }}>{stats.standard_parts || 0}</div></div>
        <div className="kpi"><div className="kpi-label">Custom Parts</div><div className="kpi-value" style={{ color: 'var(--purple)' }}>{stats.custom_parts || 0}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, minHeight: 600 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="panel" style={{ padding: 14, maxHeight: 500, overflow: 'auto' }}>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: '.9rem' }}>Categories</div>
            <div onClick={() => selectCategory('', '')} style={{ padding: '6px 8px', fontSize: '.82rem', cursor: 'pointer', borderRadius: 6, fontWeight: !selCat ? 700 : 400, color: !selCat ? 'var(--accent)' : 'var(--text)', background: !selCat ? 'rgba(59,130,246,.1)' : 'none', marginBottom: 4 }}>
              All Parts ({stats.total_parts || 0})
            </div>
            {categories.map(cat => (
              <div key={cat.id}>
                <div onClick={() => { toggleCat(cat.id); selectCategory(cat.id); }} style={{ padding: '6px 8px', fontSize: '.82rem', cursor: 'pointer', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: selCat === cat.id && !selSub ? 700 : 400, color: selCat === cat.id ? 'var(--accent)' : 'var(--text)', background: selCat === cat.id && !selSub ? 'rgba(59,130,246,.1)' : 'none', marginBottom: 2 }}>
                  <span>{cat.icon} {cat.label_zh}</span>
                  <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{cat.total}</span>
                </div>
                {expandedCats[cat.id] && cat.subcategories?.map(sub => (
                  <div key={sub.id} onClick={() => selectCategory(cat.id, sub.id)} style={{ padding: '4px 8px 4px 28px', fontSize: '.78rem', cursor: 'pointer', borderRadius: 6, fontWeight: selSub === sub.id ? 700 : 400, color: selSub === sub.id ? 'var(--accent)' : 'var(--text2)', background: selSub === sub.id ? 'rgba(59,130,246,.08)' : 'none', marginBottom: 1 }}>
                    {sub.label_zh} <span style={{ float: 'right', color: 'var(--text3)', fontSize: '.68rem' }}>{sub.count}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="panel" style={{ padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.85rem' }}>Filter</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[{ v: null, label: 'All' }, { v: true, label: 'Standard' }, { v: false, label: 'Custom' }].map(f => (
                <button key={String(f.v)} className="btn-sm" style={{ background: isStandard === f.v ? 'var(--accent)' : '#334155', color: isStandard === f.v ? '#fff' : 'var(--text)' }} onClick={() => { setIsStandard(f.v); setPage(1); }}>{f.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <input className="input" style={{ flex: 1 }} placeholder="Search parts: screw, bearing, motor, connector..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            <span style={{ fontSize: '.82rem', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{total} results</span>
            <button className="btn-sm" onClick={() => setView(v => v === 'grid' ? 'table' : 'grid')}>{view === 'grid' ? 'Table' : 'Grid'}</button>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Loading...</div>}

          {!loading && parts.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}><div style={{ fontSize: '3rem', marginBottom: 14 }}>🔩</div><div>No parts found</div></div>}

          {!loading && view === 'grid' && (
            <div className="grid-3">
              {parts.map(p => (
                <div key={p.id} className={`card${selectedPart?.id === p.id ? ' active' : ''}`} style={{ padding: 14, cursor: 'pointer' }} onClick={() => setSelectedPart(p)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <strong style={{ fontSize: '.9rem' }}>{p.name_zh}</strong>
                    <span className={`badge ${p.is_standard ? 'badge-green' : 'badge-purple'}`}>{p.is_standard ? 'STD' : 'CUSTOM'}</span>
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginBottom: 6 }}>{p.name}</div>
                  {p.standards?.length > 0 && <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 4 }}>Standards: {p.standards.join(', ')}</div>}
                  {p.sizes && <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 4 }}>Sizes: {p.sizes}</div>}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                    {(p.suppliers || []).slice(0, 3).map(s => <span key={s} className="badge badge-blue" style={{ fontSize: '.68rem' }}>{s}</span>)}
                    {(p.suppliers || []).length > 3 && <span style={{ fontSize: '.68rem', color: 'var(--text3)' }}>+{p.suppliers.length - 3}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && view === 'table' && parts.length > 0 && (
            <div className="panel" style={{ padding: 0, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Name', 'Category', 'Standards', 'Materials', 'Sizes', 'Type', 'Suppliers'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {parts.map(p => (
                    <tr key={p.id} onClick={() => setSelectedPart(p)} style={{ cursor: 'pointer' }}>
                      <td className="td"><strong>{p.name_zh}</strong><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{p.name}</div></td>
                      <td className="td">{p.category}</td>
                      <td className="td" style={{ fontSize: '.78rem' }}>{(p.standards || []).join(', ')}</td>
                      <td className="td" style={{ fontSize: '.78rem' }}>{(p.materials || []).slice(0, 2).join(', ')}</td>
                      <td className="td" style={{ fontSize: '.78rem' }}>{p.sizes}</td>
                      <td className="td"><span className={`badge ${p.is_standard ? 'badge-green' : 'badge-purple'}`}>{p.is_standard ? 'STD' : 'CUSTOM'}</span></td>
                      <td className="td" style={{ fontSize: '.78rem' }}>{(p.suppliers || []).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > 50 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <span style={{ alignSelf: 'center', fontSize: '.82rem', color: 'var(--text2)' }}>Page {page} / {Math.ceil(total / 50)}</span>
              <button className="btn btn-secondary" disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </div>
      </div>

      {selectedPart && (
        <div className="modal-overlay" onClick={() => setSelectedPart(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 4 }}>{selectedPart.name_zh}</h3>
            <div style={{ fontSize: '.88rem', color: 'var(--text2)', marginBottom: 16 }}>{selectedPart.name}</div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Category</div><div>{selectedPart.category} / {selectedPart.subcategory}</div></div>
              <div><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Type</div><div><span className={`badge ${selectedPart.is_standard ? 'badge-green' : 'badge-purple'}`}>{selectedPart.is_standard ? 'Standard' : 'Custom'}</span></div></div>
              <div><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Standards</div><div>{(selectedPart.standards || []).join(', ') || '—'}</div></div>
              <div><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Sizes</div><div>{selectedPart.sizes || '—'}</div></div>
            </div>
            <div style={{ marginBottom: 14 }}><div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 4 }}>Materials</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{(selectedPart.materials || []).map(m => <span key={m} className="badge badge-blue">{m}</span>)}</div></div>
            <div><div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 4 }}>Suppliers</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{(selectedPart.suppliers || []).map(s => <span key={s} className="badge badge-green">{s}</span>)}</div></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}><button className="btn btn-secondary" onClick={() => setSelectedPart(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
