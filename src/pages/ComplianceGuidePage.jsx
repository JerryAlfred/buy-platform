import { useState, useEffect } from 'react';
import * as api from '../api';

const MARKET_FLAGS = { US: '🇺🇸', EU: '🇪🇺', CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', UK: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺', IN: '🇮🇳' };

function CertCard({ cert }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: '#16213e', borderRadius: 8, padding: 14, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{MARKET_FLAGS[cert.market] || '🌐'}</span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{cert.name}</span>
            {cert.mandatory && <span style={{ background: '#ef4444', borderRadius: 4, padding: '1px 6px', fontSize: 10, color: '#fff' }}>MANDATORY</span>}
          </div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{cert.name_zh}</div>
        </div>
        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          <div style={{ fontWeight: 600, color: '#34d399', fontSize: 13 }}>${cert.cost_min?.toLocaleString()} – ${cert.cost_max?.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{cert.weeks} weeks</div>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #333' }}>
          <p style={{ color: '#ccc', fontSize: 13, margin: '0 0 8px' }}>{cert.desc}</p>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}><strong>Agency:</strong> {cert.agency}</div>
          <div style={{ fontSize: 12, color: '#888' }}><strong>Required Docs:</strong></div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
            {(cert.docs || []).map((d, i) => <li key={i} style={{ color: '#aaa', fontSize: 12, marginBottom: 2 }}>{d}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ComplianceGuidePage() {
  const [productTypes, setProductTypes] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [selectedType, setSelectedType] = useState('consumer_electronics');
  const [selectedMarkets, setSelectedMarkets] = useState(['US']);
  const [hasWireless, setHasWireless] = useState(true);
  const [hasBattery, setHasBattery] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.fetchComplianceProductTypes().then(r => setProductTypes(r.types || [])).catch(() => {});
    api.fetchComplianceMarkets().then(r => setMarkets(r.markets || [])).catch(() => {});
  }, []);

  const toggleMarket = (id) => {
    setSelectedMarkets(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const check = async () => {
    setLoading(true);
    try {
      const r = await api.checkCompliance({ product_type: selectedType, target_markets: selectedMarkets, has_wireless: hasWireless, has_battery: hasBattery });
      setResult(r);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const S = { page: { padding: 24 }, card: { background: '#1a1a2e', borderRadius: 8, padding: 16, marginBottom: 12 } };

  return (
    <div style={S.page}>
      <h2 style={{ margin: '0 0 4px' }}>Compliance Guide</h2>
      <p style={{ color: '#aaa', margin: '0 0 16px', fontSize: 14 }}>Automated certification checklist based on your product type and target markets. Covers FCC, CE, UL, RoHS, CCC, and 50+ standards.</p>

      <div style={S.card}>
        <h4 style={{ margin: '0 0 8px' }}>Product Type</h4>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {productTypes.map(t => (
            <button key={t.id} onClick={() => setSelectedType(t.id)}
              style={{ background: selectedType === t.id ? '#2563eb' : '#16213e', border: selectedType === t.id ? 'none' : '1px solid #333', borderRadius: 6, color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
              {t.label}
            </button>
          ))}
        </div>

        <h4 style={{ margin: '0 0 8px' }}>Target Markets</h4>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {markets.map(m => (
            <button key={m.id} onClick={() => toggleMarket(m.id)}
              style={{ background: selectedMarkets.includes(m.id) ? '#2563eb' : '#16213e', border: selectedMarkets.includes(m.id) ? 'none' : '1px solid #333', borderRadius: 6, color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
              {m.flag} {m.label}
            </button>
          ))}
        </div>

        <h4 style={{ margin: '0 0 8px' }}>Product Features</h4>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={hasWireless} onChange={() => setHasWireless(!hasWireless)} /> Has Wireless (WiFi/BLE/Zigbee)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={hasBattery} onChange={() => setHasBattery(!hasBattery)} /> Has Li-Ion/Li-Po Battery
          </label>
        </div>

        <button onClick={check} disabled={loading} style={{ background: '#2563eb', border: 'none', borderRadius: 6, color: '#fff', padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
          {loading ? 'Checking...' : 'Generate Compliance Checklist'}
        </button>
      </div>

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#60a5fa' }}>{result.total}</div>
              <div style={{ color: '#aaa', fontSize: 13 }}>Certifications</div>
            </div>
            <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#34d399' }}>${result.cost_range?.min?.toLocaleString()} – ${result.cost_range?.max?.toLocaleString()}</div>
              <div style={{ color: '#aaa', fontSize: 13 }}>Estimated Cost</div>
            </div>
            <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>{result.critical_path_weeks}</div>
              <div style={{ color: '#aaa', fontSize: 13 }}>Critical Path (weeks)</div>
            </div>
            <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{result.target_markets?.length}</div>
              <div style={{ color: '#aaa', fontSize: 13 }}>Markets</div>
            </div>
          </div>

          {Object.entries(result.by_market || {}).map(([market, certs]) => (
            <div key={market} style={{ marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>{MARKET_FLAGS[market]} {market}</h3>
              {certs.map(c => <CertCard key={c.id} cert={c} />)}
            </div>
          ))}

          {result.recommended_agencies?.length > 0 && (
            <div style={S.card}>
              <h3 style={{ margin: '0 0 12px' }}>Recommended Testing Agencies</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 8 }}>
                {result.recommended_agencies.map(a => (
                  <div key={a.name} style={{ background: '#16213e', borderRadius: 6, padding: 10 }}>
                    <a href={a.url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>{a.name}</a>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Regions: {a.regions?.join(', ')}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>Specialties: {a.specialties?.join(', ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
