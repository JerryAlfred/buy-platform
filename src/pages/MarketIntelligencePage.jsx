import { useState, useEffect } from 'react';
import * as api from '../api';

function PatentCard({ p }) {
  return (
    <div style={{ background: '#16213e', borderRadius: 6, padding: 12, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <a href={p.url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>{p.title}</a>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>US{p.patent_number} | {p.date}</div>
        </div>
        {p.citations > 0 && <span style={{ background: '#2a2a4a', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#fbbf24' }}>{p.citations} citations</span>}
      </div>
      <p style={{ color: '#ccc', fontSize: 12, margin: '6px 0 4px', lineHeight: 1.4 }}>{p.abstract}</p>
      <div style={{ fontSize: 11, color: '#888' }}>
        {(p.inventors || []).join(', ')} {p.assignees?.length > 0 && <span>| {p.assignees.join(', ')}</span>}
      </div>
    </div>
  );
}

function CampaignCard({ c }) {
  const fundedPct = c.goal > 0 ? Math.round(c.raised / c.goal * 100) : 0;
  return (
    <div style={{ background: '#16213e', borderRadius: 6, padding: 12, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <a href={c.url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>{c.title}</a>
          <div style={{ fontSize: 12, color: '#888' }}>{c.platform} | {c.category} | {c.year}</div>
        </div>
        <span style={{ background: c.status === 'successful' ? '#065f46' : '#7c2d12', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#fff', height: 'fit-content' }}>{c.status}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13 }}>
        <div><span style={{ color: '#34d399', fontWeight: 700 }}>${c.raised?.toLocaleString()}</span> <span style={{ color: '#888' }}>raised</span></div>
        <div><span style={{ color: '#fbbf24' }}>{fundedPct}%</span> funded</div>
        <div><span style={{ fontWeight: 600 }}>{c.backers?.toLocaleString()}</span> backers</div>
      </div>
      <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {(c.tags || []).map(t => <span key={t} style={{ background: '#2a2a4a', padding: '1px 6px', borderRadius: 4, fontSize: 10, color: '#ccc' }}>{t}</span>)}
      </div>
    </div>
  );
}

function TeardownCard({ t, onSelect }) {
  return (
    <div onClick={() => onSelect(t)} style={{ background: '#16213e', borderRadius: 6, padding: 12, marginBottom: 8, cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{t.product}</span>
        <span style={{ color: '#888', fontSize: 12 }}>{t.year}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 13 }}>
        <div>BOM: <span style={{ color: '#34d399', fontWeight: 600 }}>${t.bom_cost_est}</span></div>
        <div>Retail: <span style={{ fontWeight: 600 }}>${t.retail_price}</span></div>
        <div>Margin: <span style={{ color: '#fbbf24', fontWeight: 600 }}>{t.margin_pct}%</span></div>
      </div>
      <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {(t.tags || []).map(tag => <span key={tag} style={{ background: '#2a2a4a', padding: '1px 6px', borderRadius: 4, fontSize: 10, color: '#ccc' }}>{tag}</span>)}
      </div>
    </div>
  );
}

function TeardownDetail({ t, onClose }) {
  if (!t) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a2e', borderRadius: 12, padding: 24, width: 600, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>{t.product} Teardown</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 16, margin: '12px 0', fontSize: 14 }}>
          <div>BOM: <span style={{ color: '#34d399', fontWeight: 700 }}>${t.bom_cost_est}</span></div>
          <div>Retail: <span style={{ fontWeight: 700 }}>${t.retail_price}</span></div>
          <div>Margin: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{t.margin_pct}%</span></div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ borderBottom: '1px solid #333' }}>
            <th style={{ textAlign: 'left', padding: 6, color: '#aaa' }}>Part</th>
            <th style={{ textAlign: 'left', padding: 6, color: '#aaa' }}>Category</th>
            <th style={{ textAlign: 'right', padding: 6, color: '#aaa' }}>Est. Cost</th>
            <th style={{ textAlign: 'left', padding: 6, color: '#aaa' }}>Note</th>
          </tr></thead>
          <tbody>
            {(t.components || []).map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: 6, fontWeight: 600 }}>{c.part}</td>
                <td style={{ padding: 6 }}><span style={{ background: '#2a2a4a', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>{c.category}</span></td>
                <td style={{ padding: 6, textAlign: 'right', color: '#34d399' }}>${c.cost_est?.toFixed(2)}</td>
                <td style={{ padding: 6, color: '#888', fontSize: 11 }}>{c.note || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MarketIntelligencePage() {
  const [tab, setTab] = useState('patents');
  const [query, setQuery] = useState('');
  const [patents, setPatents] = useState([]);
  const [patentTotal, setPatentTotal] = useState(0);
  const [campaigns, setCampaigns] = useState([]);
  const [trending, setTrending] = useState([]);
  const [teardowns, setTeardowns] = useState([]);
  const [selectedTd, setSelectedTd] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.fetchTrendingCampaigns().then(r => setTrending(r.campaigns || [])).catch(() => {});
    api.fetchTeardowns('').then(r => setTeardowns(r.teardowns || [])).catch(() => {});
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      if (tab === 'patents') {
        const r = await api.searchPatents(query);
        setPatents(r.results || []); setPatentTotal(r.total || 0);
      } else if (tab === 'crowdfunding') {
        const r = await api.searchCrowdfunding(query);
        setCampaigns(r.results || []);
      } else if (tab === 'teardowns') {
        const r = await api.fetchTeardowns(query);
        setTeardowns(r.teardowns || []);
      }
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const S = { page: { padding: 24 }, card: { background: '#1a1a2e', borderRadius: 8, padding: 16, marginBottom: 12 }, tab: (a) => ({ background: a ? '#2563eb' : 'transparent', border: a ? 'none' : '1px solid #444', borderRadius: 6, color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: a ? 600 : 400 }) };

  return (
    <div style={S.page}>
      <h2 style={{ margin: '0 0 4px' }}>Market Intelligence</h2>
      <p style={{ color: '#aaa', margin: '0 0 16px', fontSize: 14 }}>Research patents, crowdfunding campaigns, FCC filings, and product teardowns.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[{id:'patents',label:'Patents'},{id:'crowdfunding',label:'Crowdfunding'},{id:'fcc',label:'FCC Database'},{id:'teardowns',label:'Teardowns'}].map(t => (
          <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div style={{ ...S.card, display: 'flex', gap: 8 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
          placeholder={tab === 'patents' ? 'Search patents (e.g. "airbag wearable")...' : tab === 'crowdfunding' ? 'Search campaigns...' : 'Search...'}
          style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 14 }} />
        <button onClick={search} disabled={loading} style={{ background: '#2563eb', border: 'none', borderRadius: 6, color: '#fff', padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {tab === 'patents' && (
        <div>
          {patentTotal > 0 && <div style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>{patentTotal.toLocaleString()} patents found (PatentsView API)</div>}
          {patents.map(p => <PatentCard key={p.patent_number} p={p} />)}
          {patents.length === 0 && !loading && <div style={{ color: '#888', textAlign: 'center', padding: 40 }}>Search US patents via PatentsView API. Try "robot vacuum", "airbag vest", "smart ring".</div>}
        </div>
      )}

      {tab === 'crowdfunding' && (
        <div>
          {campaigns.length > 0 ? campaigns.map(c => <CampaignCard key={c.id} c={c} />) : (
            <>
              <h3 style={{ fontSize: 15, marginBottom: 8 }}>Trending Hardware Campaigns</h3>
              {trending.map(c => <CampaignCard key={c.id} c={c} />)}
            </>
          )}
        </div>
      )}

      {tab === 'fcc' && (
        <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📡</div>
          <h3>FCC Equipment Authorization Search</h3>
          <p style={{ color: '#aaa', fontSize: 14 }}>Search FCC database for authorized devices. Enter a product name or FCC ID above.</p>
          <p style={{ color: '#888', fontSize: 12 }}>Connects to the FCC Equipment Authorization System (EAS) for real device certifications.</p>
        </div>
      )}

      {tab === 'teardowns' && (
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Product Teardown BOM Analysis</h3>
          {teardowns.map(t => <TeardownCard key={t.id} t={t} onSelect={setSelectedTd} />)}
        </div>
      )}

      {selectedTd && <TeardownDetail t={selectedTd} onClose={() => setSelectedTd(null)} />}
    </div>
  );
}
