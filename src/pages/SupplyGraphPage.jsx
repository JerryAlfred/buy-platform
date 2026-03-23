import { useState, useEffect } from 'react';
import * as api from '../api';

export default function SupplyGraphPage() {
  const [industries, setIndustries] = useState([]);
  const [selInd, setSelInd] = useState(null);
  const [graph, setGraph] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState(null);
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    api.fetchGraphIndustries().then(d => setIndustries(d.industries || [])).catch(() => {});
    api.fetchGraphCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => { if (selInd) api.fetchGraphVis(selInd).then(setGraph).catch(() => setGraph(null)); }, [selInd]);

  const doSearch = async () => {
    if (!searchQ.trim()) return;
    setSearchRes(await api.searchGraph(searchQ));
  };

  return (
    <>
      <h2 className="page-title">Supply Graph</h2>
      <p className="page-sub">Global supply chain knowledge graph — factories, products, processes, who-makes-what</p>

      <div className="ai-bar">
        <input className="ai-input" placeholder='Search components: "servo motor", "harmonic drive", "6-axis robot"...' value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} />
        <button className="ai-send" onClick={doSearch}>Search</button>
      </div>

      {searchRes?.results?.length > 0 && (
        <div className="panel">
          <div className="panel-title">Search Results ({searchRes.total})</div>
          <div className="grid-3">
            {searchRes.results.slice(0, 12).map((r, i) => (
              <div key={i} className="card">
                <strong>{r.name || r.component}</strong>
                {r.category && <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{r.category}</div>}
                {r.industry && <span className="badge badge-blue">{r.industry}</span>}
                {r.specs && <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: 4 }}>{typeof r.specs === 'string' ? r.specs : JSON.stringify(r.specs).slice(0, 80)}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">Industries</div>
          {industries.map(ind => (
            <div key={ind.id || ind} className={`card ${selInd === (ind.id || ind) ? 'active' : ''}`} style={{ cursor: 'pointer', marginBottom: 6 }} onClick={() => setSelInd(ind.id || ind)}>
              <strong>{ind.name || ind.id || ind}</strong>
              {ind.description && <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{ind.description}</div>}
              {ind.product_count != null && <span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{ind.product_count} products</span>}
            </div>
          ))}
          {!industries.length && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)' }}>No industry data</div>}
        </div>

        <div className="panel">
          {graph ? (<>
            <div className="panel-title">Graph: {selInd}</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: '.85rem' }}>
              <span>{graph.nodes?.length || 0} nodes</span>
              <span>{graph.edges?.length || 0} edges</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(graph.nodes || []).slice(0, 40).map((n, i) => {
                const colors = { factory: 'var(--accent)', product: 'var(--green)', process: 'var(--purple)', component: 'var(--orange)' };
                return (
                  <div key={i} style={{ padding: '6px 12px', borderRadius: 20, background: `${colors[n.type] || 'var(--text3)'}22`, border: `1px solid ${colors[n.type] || 'var(--border)'}`, fontSize: '.78rem', color: colors[n.type] || 'var(--text2)' }}>
                    {n.label || n.name || n.id}
                  </div>
                );
              })}
            </div>
            {(graph.edges || []).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: 8 }}>Relationships</div>
                {(graph.edges || []).slice(0, 20).map((e, i) => (
                  <div key={i} style={{ fontSize: '.78rem', padding: '4px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--accent)' }}>{e.source}</span>
                    <span style={{ color: 'var(--text3)' }}>→ {e.relationship || e.type || 'related'} →</span>
                    <span style={{ color: 'var(--green)' }}>{e.target}</span>
                  </div>
                ))}
              </div>
            )}
          </>) : <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Select an industry to view its supply graph</div>}
        </div>
      </div>

      {categories && (
        <div className="panel">
          <div className="panel-title">Component Categories</div>
          <pre style={{ fontSize: '.78rem', color: 'var(--text2)', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(categories, null, 2)}</pre>
        </div>
      )}
    </>
  );
}
