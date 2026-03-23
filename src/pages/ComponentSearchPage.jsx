import { useState, useEffect } from 'react';
import * as api from '../api';

function PriceCell({ prices }) {
  if (!prices) return <span style={{ color: '#888' }}>—</span>;
  const dists = Object.entries(prices);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {dists.map(([d, pbs]) => {
        const best = pbs?.[0];
        if (!best) return null;
        return <div key={d} style={{ fontSize: 11 }}><span style={{ color: '#60a5fa' }}>{d}</span>: <span style={{ color: '#34d399', fontWeight: 600 }}>${best.price}</span> <span style={{ color: '#888' }}>@{best.qty}+</span></div>;
      })}
    </div>
  );
}

function StockCell({ stock }) {
  if (!stock) return <span style={{ color: '#888' }}>—</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Object.entries(stock).map(([d, s]) => (
        <div key={d} style={{ fontSize: 11 }}><span style={{ color: '#60a5fa' }}>{d}</span>: <span style={{ color: s > 0 ? '#34d399' : '#ef4444', fontWeight: 600 }}>{s?.toLocaleString()}</span></div>
      ))}
    </div>
  );
}

function PartDetail({ part, onClose }) {
  if (!part) return null;
  const [alts, setAlts] = useState([]);
  useEffect(() => {
    api.crossReferenceComponent(part.mpn).then(r => setAlts(r.alternatives || [])).catch(() => {});
  }, [part.mpn]);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a2e', borderRadius: 12, padding: 24, width: 650, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, color: '#60a5fa' }}>{part.mpn}</h2>
            <div style={{ color: '#aaa', fontSize: 14 }}>{part.mfr} — {part.category}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ color: '#ccc' }}>{part.desc}</p>
        {part.specs && Object.keys(part.specs).length > 0 && (
          <>
            <h4>Specifications</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {Object.entries(part.specs).map(([k, v]) => (
                <div key={k} style={{ background: '#16213e', borderRadius: 4, padding: '4px 8px', fontSize: 13 }}><span style={{ color: '#888' }}>{k}:</span> <span style={{ fontWeight: 600 }}>{v}</span></div>
              ))}
            </div>
          </>
        )}
        <h4>Pricing</h4>
        {Object.entries(part.prices || {}).map(([dist, pbs]) => (
          <div key={dist} style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600, color: '#60a5fa', fontSize: 13, marginBottom: 4 }}>{dist}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(pbs || []).map((pb, i) => (
                <span key={i} style={{ background: '#16213e', borderRadius: 4, padding: '3px 8px', fontSize: 12 }}>{pb.qty}+ → <span style={{ color: '#34d399', fontWeight: 600 }}>${pb.price}</span></span>
              ))}
            </div>
          </div>
        ))}
        <h4>Stock</h4>
        <StockCell stock={part.stock} />
        {part.datasheet && <div style={{ marginTop: 12 }}><a href={part.datasheet} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>View Datasheet {'↗'}</a></div>}
        {alts.length > 0 && (
          <>
            <h4>Alternatives / Cross-Reference</h4>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {alts.map(a => (
                <div key={a.mpn} style={{ background: '#16213e', borderRadius: 6, padding: '6px 10px', fontSize: 12 }}>
                  <div style={{ fontWeight: 600 }}>{a.mpn}</div>
                  <div style={{ color: '#888' }}>{a.mfr}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ComponentSearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [sources, setSources] = useState({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [compareResults, setCompareResults] = useState(null);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    api.fetchComponentCategories().then(r => setCategories(r.categories || [])).catch(() => {});
    api.fetchPopularComponents().then(r => setPopular(r.parts || [])).catch(() => {});
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await api.searchComponents(query, category);
      setResults(r.results || []); setTotal(r.total || 0); setSources(r.sources || {});
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const toggleCompare = (mpn) => {
    setCompareList(prev => prev.includes(mpn) ? prev.filter(m => m !== mpn) : prev.length < 5 ? [...prev, mpn] : prev);
  };

  const runCompare = async () => {
    if (compareList.length < 2) return;
    try {
      const r = await api.compareComponents(compareList);
      setCompareResults(r.parts || []);
    } catch (e) { /* ignore */ }
  };

  const S = { page: { padding: 24 }, card: { background: '#1a1a2e', borderRadius: 8, padding: 16, marginBottom: 12 } };

  return (
    <div style={S.page}>
      <h2 style={{ margin: '0 0 4px' }}>Component Search</h2>
      <p style={{ color: '#aaa', margin: '0 0 16px', fontSize: 14 }}>Search across Mouser, DigiKey, and LCSC. Compare prices and check stock in real-time.</p>

      <div style={{ ...S.card, display: 'flex', gap: 8, alignItems: 'end' }}>
        <div style={{ flex: 1 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search by MPN, keyword, or description..."
            style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ background: '#111', border: '1px solid #333', borderRadius: 6, padding: '10px 12px', color: '#fff' }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={search} disabled={loading} style={{ background: '#2563eb', border: 'none', borderRadius: 6, color: '#fff', padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, fontSize: 11, color: '#888' }}>
        <span>Sources:</span>
        {sources.mouser_api && <span style={{ color: '#34d399' }}>Mouser API ✓</span>}
        {sources.digikey_api && <span style={{ color: '#34d399' }}>DigiKey API ✓</span>}
        {sources.built_in && <span style={{ color: '#60a5fa' }}>Built-in DB ✓</span>}
        {!sources.mouser_api && <span style={{ color: '#f97316' }}>Mouser (no key)</span>}
        {!sources.digikey_api && <span style={{ color: '#f97316' }}>DigiKey (no key)</span>}
      </div>

      {compareList.length > 0 && (
        <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 8, background: '#16213e' }}>
          <span style={{ fontSize: 13 }}>Compare ({compareList.length}):</span>
          {compareList.map(m => <span key={m} style={{ background: '#2a2a4a', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>{m} <button onClick={() => toggleCompare(m)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button></span>)}
          <button onClick={runCompare} style={{ marginLeft: 'auto', background: '#2563eb', border: 'none', borderRadius: 4, color: '#fff', padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>Compare</button>
        </div>
      )}

      {compareResults && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 8px' }}>Comparison</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>MPN</th><th style={{ textAlign: 'left', padding: 6 }}>Mfr</th><th style={{ textAlign: 'left', padding: 6 }}>Category</th><th style={{ textAlign: 'left', padding: 6 }}>Pricing</th><th style={{ textAlign: 'left', padding: 6 }}>Stock</th>
              </tr></thead>
              <tbody>{compareResults.map(p => (
                <tr key={p.mpn} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: 6, fontWeight: 600, color: '#60a5fa' }}>{p.mpn}</td>
                  <td style={{ padding: 6 }}>{p.mfr}</td>
                  <td style={{ padding: 6 }}>{p.category}</td>
                  <td style={{ padding: 6 }}><PriceCell prices={p.prices} /></td>
                  <td style={{ padding: 6 }}><StockCell stock={p.stock} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <button onClick={() => setCompareResults(null)} style={{ marginTop: 8, background: 'none', border: '1px solid #555', borderRadius: 4, color: '#aaa', padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Close Comparison</button>
        </div>
      )}

      {results.length > 0 ? (
        <div style={S.card}>
          <div style={{ marginBottom: 8, fontSize: 13, color: '#aaa' }}>{total} results</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '1px solid #333' }}>
              <th style={{ width: 30, padding: 6 }} /><th style={{ textAlign: 'left', padding: 6 }}>MPN</th><th style={{ textAlign: 'left', padding: 6 }}>Manufacturer</th><th style={{ textAlign: 'left', padding: 6 }}>Description</th><th style={{ textAlign: 'left', padding: 6 }}>Category</th><th style={{ textAlign: 'left', padding: 6 }}>Pricing</th><th style={{ textAlign: 'left', padding: 6 }}>Stock</th>
            </tr></thead>
            <tbody>
              {results.map(p => (
                <tr key={p.mpn} style={{ borderBottom: '1px solid #222', cursor: 'pointer' }} onClick={() => setSelected(p)}>
                  <td style={{ padding: 6 }}><input type="checkbox" checked={compareList.includes(p.mpn)} onChange={() => toggleCompare(p.mpn)} onClick={e => e.stopPropagation()} /></td>
                  <td style={{ padding: 6, fontWeight: 600, color: '#60a5fa' }}>{p.mpn}</td>
                  <td style={{ padding: 6 }}>{p.mfr}</td>
                  <td style={{ padding: 6, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.desc}</td>
                  <td style={{ padding: 6 }}><span style={{ background: '#2a2a4a', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>{p.category}</span></td>
                  <td style={{ padding: 6 }}><PriceCell prices={p.prices} /></td>
                  <td style={{ padding: 6 }}><StockCell stock={p.stock} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loading && results.length === 0 && total === 0 && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 8px' }}>Popular Components</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
            {popular.map(p => (
              <div key={p.mpn} onClick={() => setSelected(p)} style={{ background: '#16213e', borderRadius: 6, padding: 10, cursor: 'pointer' }}>
                <div style={{ fontWeight: 600, color: '#60a5fa' }}>{p.mpn}</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>{p.mfr} — {p.category}</div>
                <div style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>{p.desc?.slice(0, 80)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && <PartDetail part={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
