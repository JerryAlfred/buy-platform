import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

export default function SupplyTreePage() {
  const [tab, setTab] = useState('tree');
  const [industries, setIndustries] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [components, setComponents] = useState([]);
  const [categories, setCategories] = useState({});
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [expandedSubs, setExpandedSubs] = useState({});
  const [selectedComponent, setSelectedComponent] = useState(null);

  useEffect(() => {
    api.fetchGraphIndustries().then(r => setIndustries(r.industries || [])).catch(() => {});
    api.fetchGraphComponents().then(r => setComponents(r.components || [])).catch(() => {});
    api.fetchGraphCategories().then(r => setCategories(r.categories || {})).catch(() => {});
  }, []);

  const selectIndustry = useCallback(async (ind) => {
    setSelectedIndustry(ind);
    try {
      const vis = await api.fetchGraphVis(ind.id);
      setGraphData(vis);
    } catch (e) { console.error(e); }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!search.trim()) { setSearchResults([]); return; }
    try { const r = await api.searchGraph(search); setSearchResults(r.results || r.components || []); } catch (e) { console.error(e); }
  }, [search]);

  useEffect(() => { const t = setTimeout(handleSearch, 400); return () => clearTimeout(t); }, [handleSearch]);

  const TABS = [{ id: 'tree', label: '🌳 Industry Tree' }, { id: 'graph', label: '🕸️ Supply Graph' }, { id: 'components', label: '📦 All Components' }, { id: 'categories', label: '📊 Category Summary' }];

  return (
    <div>
      <h2 className="page-title">Supply Chain Tree</h2>
      <p className="page-sub">Full supply chain visualization: Industry → Product → Subsystem → Component → Supplier. {components.length} components across {industries.length} industries.</p>

      <div className="kpis">
        <div className="kpi"><div className="kpi-label">Industries</div><div className="kpi-value">{industries.length}</div></div>
        <div className="kpi"><div className="kpi-label">Components</div><div className="kpi-value">{components.length}</div></div>
        <div className="kpi"><div className="kpi-label">Categories</div><div className="kpi-value">{Object.keys(categories).length}</div></div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input className="input" style={{ maxWidth: 500 }} placeholder="Search: motor, sensor, bearing, PCB, battery..." value={search} onChange={e => setSearch(e.target.value)} />
        {searchResults.length > 0 && (
          <div className="panel" style={{ marginTop: 8, maxHeight: 300, overflow: 'auto' }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.85rem' }}>Search Results ({searchResults.length})</div>
            <div className="grid-3">
              {searchResults.slice(0, 12).map((r, i) => (
                <div key={i} className="card" style={{ padding: 12 }}>
                  <strong>{r.label_zh || r.label}</strong>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{r.industry} → {r.product} → {r.subsystem}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 4 }}>{r.price_range} | {r.lead_time}</div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(r.suppliers || []).map(s => <span key={s} style={{ fontSize: '.68rem', padding: '1px 5px', background: 'rgba(34,197,94,.1)', borderRadius: 3, color: 'var(--green)' }}>{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 16px', fontSize: '.85rem', cursor: 'pointer', border: 'none', background: 'none', color: tab===t.id?'var(--accent)':'var(--text2)', borderBottom: tab===t.id?'2px solid var(--accent)':'2px solid transparent', fontWeight: tab===t.id?600:400 }}>{t.label}</button>)}
      </div>

      {tab === 'tree' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {industries.map(ind => (
              <button key={ind.id} className={`btn ${selectedIndustry?.id===ind.id?'btn-primary':'btn-secondary'}`} onClick={() => selectIndustry(ind)}>
                {ind.icon} {ind.label_zh}
              </button>
            ))}
          </div>

          {selectedIndustry && (
            <div className="panel">
              <div className="panel-title" style={{ marginBottom: 16 }}>{selectedIndustry.icon} {selectedIndustry.label_zh} — Product Breakdown</div>
              {(selectedIndustry.products || []).map(prod => (
                <div key={prod.id} style={{ marginBottom: 16 }}>
                  <div onClick={() => setExpandedProducts(p => ({...p,[prod.id]:!p[prod.id]}))} style={{ fontWeight: 600, fontSize: '.95rem', cursor: 'pointer', padding: '8px 10px', background: 'rgba(59,130,246,.06)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{expandedProducts[prod.id] ? '▼' : '▶'} {prod.label_zh} ({prod.label})</span>
                    <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{(prod.subsystems||[]).length} subsystems</span>
                  </div>
                  {expandedProducts[prod.id] && (prod.subsystems || []).map(sub => (
                    <div key={sub.id} style={{ marginLeft: 20, marginTop: 8 }}>
                      <div onClick={() => setExpandedSubs(s => ({...s,[sub.id]:!s[sub.id]}))} style={{ fontWeight: 500, fontSize: '.88rem', cursor: 'pointer', padding: '5px 8px', color: 'var(--accent)' }}>
                        {expandedSubs[sub.id] ? '▼' : '▶'} {sub.label_zh}
                      </div>
                      {expandedSubs[sub.id] && (
                        <div style={{ marginLeft: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginTop: 6 }}>
                          {(sub.modules || []).map(mod => (
                            <div key={mod.id} className="card" style={{ padding: 12, cursor: 'pointer' }} onClick={() => setSelectedComponent(mod)}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong style={{ fontSize: '.85rem' }}>{mod.label_zh}</strong>
                                <span className="badge badge-blue">{mod.category}</span>
                              </div>
                              <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: 2 }}>{mod.label}</div>
                              <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: '.72rem', color: 'var(--text3)' }}>
                                <span style={{ color: 'var(--green)' }}>{mod.price_range}</span>
                                <span>{mod.lead_time}</span>
                              </div>
                              <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {(mod.suppliers || []).map(s => <span key={s} style={{ fontSize: '.65rem', padding: '1px 5px', background: 'rgba(34,197,94,.1)', borderRadius: 3, color: 'var(--green)' }}>{s}</span>)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'graph' && (
        <div className="panel" style={{ minHeight: 400 }}>
          <div className="panel-title" style={{ marginBottom: 14 }}>Supply Graph Visualization</div>
          {!graphData ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Select an industry above to view the supply graph</div>
          ) : (
            <div>
              <div style={{ marginBottom: 12, fontSize: '.82rem', color: 'var(--text2)' }}>
                Nodes: {graphData.nodes?.length || 0} | Edges: {graphData.edges?.length || 0}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {(graphData.nodes || []).map(n => (
                  <div key={n.id} style={{ padding: '6px 12px', borderRadius: 8, fontSize: '.78rem', fontWeight: 600, cursor: 'default',
                    background: n.type==='industry'?'rgba(168,85,247,.2)':n.type==='product'?'rgba(59,130,246,.2)':n.type==='subsystem'?'rgba(234,179,8,.15)':'rgba(34,197,94,.15)',
                    color: n.type==='industry'?'var(--purple)':n.type==='product'?'var(--accent)':n.type==='subsystem'?'var(--yellow)':'var(--green)',
                    border: `1px solid ${n.type==='industry'?'var(--purple)':n.type==='product'?'var(--accent)':n.type==='subsystem'?'var(--yellow)':'var(--green)'}33`,
                  }}>
                    {n.label}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: 8 }}>Relationships</div>
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                  {(graphData.edges || []).slice(0, 50).map((e, i) => (
                    <div key={i} style={{ fontSize: '.78rem', padding: '3px 0', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>
                      {e.source} → {e.target} <span style={{ color: 'var(--text3)' }}>({e.relation})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'components' && (
        <div className="panel" style={{ maxHeight: 600, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Component', 'Industry', 'Product', 'Category', 'Price', 'Lead Time', 'Suppliers'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {components.slice(0, 100).map((c, i) => (
                <tr key={i}>
                  <td className="td"><strong>{c.label_zh || c.label}</strong></td>
                  <td className="td" style={{ fontSize: '.78rem' }}>{c.industry}</td>
                  <td className="td" style={{ fontSize: '.78rem' }}>{c.product}</td>
                  <td className="td"><span className="badge badge-blue">{c.category}</span></td>
                  <td className="td" style={{ fontSize: '.78rem', color: 'var(--green)' }}>{c.price_range}</td>
                  <td className="td" style={{ fontSize: '.78rem' }}>{c.lead_time}</td>
                  <td className="td" style={{ fontSize: '.72rem' }}>{(c.suppliers||[]).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {components.length > 100 && <div style={{ textAlign: 'center', padding: 14, color: 'var(--text3)', fontSize: '.82rem' }}>Showing first 100 of {components.length} components</div>}
        </div>
      )}

      {tab === 'categories' && (
        <div className="grid-3">
          {Object.entries(categories).map(([cat, data]) => (
            <div key={cat} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <strong style={{ textTransform: 'capitalize' }}>{cat.replace(/_/g, ' ')}</strong>
                <span className="badge badge-blue">{data.count}</span>
              </div>
              <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{(data.examples || []).join(', ')}</div>
            </div>
          ))}
        </div>
      )}

      {selectedComponent && (
        <div className="modal-overlay" onClick={() => setSelectedComponent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 4 }}>{selectedComponent.label_zh}</h3>
            <div style={{ fontSize: '.88rem', color: 'var(--text2)', marginBottom: 16 }}>{selectedComponent.label}</div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Category</div><div><span className="badge badge-blue">{selectedComponent.category}</span></div></div>
              <div><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Price Range</div><div style={{ color: 'var(--green)' }}>{selectedComponent.price_range}</div></div>
              <div><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Lead Time</div><div>{selectedComponent.lead_time}</div></div>
            </div>
            {selectedComponent.specs && <div style={{ marginBottom: 14 }}><div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 4 }}>Specifications</div>{Object.entries(selectedComponent.specs).map(([k,v]) => <div key={k} style={{ fontSize: '.82rem' }}>{k}: {v}</div>)}</div>}
            <div><div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 4 }}>Suppliers</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{(selectedComponent.suppliers||[]).map(s => <span key={s} className="badge badge-green">{s}</span>)}</div></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}><button className="btn btn-secondary" onClick={() => setSelectedComponent(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
