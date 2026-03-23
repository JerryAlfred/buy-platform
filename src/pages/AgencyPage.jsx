import { useState, useEffect } from 'react';
import * as api from '../api';
import { useI18n } from '../i18n';

const DEMO_AGENCIES = [
  { id: 1, brand: 'UnitreeGo', productLine: 'Quadruped Robots', territory: 'North America', start: '2024-01-15', end: '2026-01-14', exclusivity: 'Exclusive', status: 'active', minOrder: 50, unitsSold: 187, revenue: 1496000, target: 200, contact: 'David Liu', email: 'david@unitree.com' },
  { id: 2, brand: 'AgileX Robotics', productLine: 'Mobile Platforms', territory: 'US West Coast', start: '2024-06-01', end: '2025-12-31', exclusivity: 'Semi-Exclusive', status: 'active', minOrder: 30, unitsSold: 42, revenue: 378000, target: 60, contact: 'Wei Zhang', email: 'wei@agilex.ai' },
  { id: 3, brand: 'JAKA Robotics', productLine: 'Collaborative Arms', territory: 'United States', start: '2023-09-01', end: '2025-08-31', exclusivity: 'Exclusive', status: 'expiring', minOrder: 25, unitsSold: 31, revenue: 589000, target: 40, contact: 'Lin Chen', email: 'lin@jaka.com' },
  { id: 4, brand: 'Elephant Robotics', productLine: 'myCobot Series', territory: 'Americas', start: '2024-03-01', end: '2026-02-28', exclusivity: 'Non-Exclusive', status: 'active', minOrder: 100, unitsSold: 156, revenue: 234000, target: 200, contact: 'Joey Wang', email: 'joey@elephantrobotics.com' },
  { id: 5, brand: 'Deep Robotics', productLine: 'Quadruped X Series', territory: 'North America', start: '2025-01-01', end: '2026-12-31', exclusivity: 'Exclusive', status: 'new', minOrder: 20, unitsSold: 0, revenue: 0, target: 30, contact: 'Fang Li', email: 'fang@deeprobotics.cn' },
];

const DEMO_CATALOG = [
  { id: 1, agencyId: 1, name: 'Go2 EDU', spec: '12 DOF, 15kg payload', price1: 2800, price10: 2500, price50: 2200, leadTime: '4-6 weeks', moq: 5 },
  { id: 2, agencyId: 1, name: 'Go2 Pro', spec: '12 DOF, 5kg payload, AI vision', price1: 8500, price10: 7800, price50: 7200, leadTime: '6-8 weeks', moq: 3 },
  { id: 3, agencyId: 2, name: 'Scout Mini', spec: '4WD, 10kg payload, ROS2', price1: 9500, price10: 8800, price50: 8200, leadTime: '4-5 weeks', moq: 2 },
  { id: 4, agencyId: 3, name: 'JAKA Zu 7', spec: '7-axis, 7kg payload', price1: 19000, price10: 17500, price50: 16000, leadTime: '8-10 weeks', moq: 1 },
  { id: 5, agencyId: 4, name: 'myCobot 280', spec: '6-axis, 250g payload', price1: 1299, price10: 1150, price50: 999, leadTime: '2-3 weeks', moq: 10 },
];

export default function AgencyPage() {
  const { lang } = useI18n();
  const [agencies] = useState(DEMO_AGENCIES);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('overview');

  const statusBadge = (s) => {
    const m = { active: 'badge-green', expiring: 'badge-yellow', expired: 'badge-red', new: 'badge-blue' };
    return <span className={`badge ${m[s] || 'badge-blue'}`}>{s}</span>;
  };

  const exclBadge = (e) => {
    const m = { 'Exclusive': 'badge-purple', 'Semi-Exclusive': 'badge-yellow', 'Non-Exclusive': 'badge-blue' };
    return <span className={`badge ${m[e] || 'badge-blue'}`}>{e}</span>;
  };

  const pct = (sold, target) => target ? Math.min(100, Math.round(sold / target * 100)) : 0;
  const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);
  const detail = selected ? agencies.find(a => a.id === selected) : null;
  const catalog = selected ? DEMO_CATALOG.filter(c => c.agencyId === selected) : [];

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? '独家代理' : 'Exclusive Agency'}</h2>
      <p className="page-sub">{lang === 'zh' ? '独家代理协议、产品目录和绩效追踪' : 'Exclusive agency agreements, product catalogs, and performance tracking'}</p>

      <div className="kpis">
        <div className="kpi"><div className="kpi-label">Active Agreements</div><div className="kpi-value" style={{ color: 'var(--green)' }}>{agencies.filter(a => a.status === 'active').length}</div></div>
        <div className="kpi"><div className="kpi-label">Expiring Soon</div><div className="kpi-value" style={{ color: 'var(--yellow)' }}>{agencies.filter(a => a.status === 'expiring' || daysUntil(a.end) < 90).length}</div></div>
        <div className="kpi"><div className="kpi-label">Total Revenue</div><div className="kpi-value">${(agencies.reduce((s, a) => s + a.revenue, 0) / 1000).toFixed(0)}K</div></div>
        <div className="kpi"><div className="kpi-label">Avg Fulfillment</div><div className="kpi-value">{Math.round(agencies.reduce((s, a) => s + pct(a.unitsSold, a.target), 0) / agencies.length)}%</div></div>
      </div>

      {agencies.filter(a => a.status === 'expiring' || daysUntil(a.end) < 90).length > 0 && (
        <div className="panel" style={{ borderLeft: '4px solid var(--yellow)' }}>
          <div className="panel-title" style={{ color: 'var(--yellow)' }}>Renewal Alerts</div>
          {agencies.filter(a => a.status === 'expiring' || daysUntil(a.end) < 90).map(a => (
            <div key={a.id} className="card" style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>{a.brand}</strong> — {a.productLine} · Expires {a.end} ({daysUntil(a.end)} days)</div>
              <button className="btn btn-primary" style={{ fontSize: '.78rem', padding: '4px 12px' }}>Initiate Renewal</button>
            </div>
          ))}
        </div>
      )}

      <div className={selected ? 'grid-sidebar' : ''}>
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Agreements</span></div>
          {agencies.map(a => (
            <div key={a.id} className={`card ${selected === a.id ? 'active' : ''}`} style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => { setSelected(a.id); setTab('overview'); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{a.brand}</strong>
                <div style={{ display: 'flex', gap: 6 }}>{exclBadge(a.exclusivity)} {statusBadge(a.status)}</div>
              </div>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginTop: 4 }}>{a.productLine} · {a.territory}</div>
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--text3)', marginBottom: 2 }}>
                  <span>Performance</span><span>{a.unitsSold}/{a.target} units ({pct(a.unitsSold, a.target)}%)</span>
                </div>
                <div className="progress"><div className="progress-fill" style={{ width: `${pct(a.unitsSold, a.target)}%`, background: pct(a.unitsSold, a.target) >= 80 ? 'var(--green)' : pct(a.unitsSold, a.target) >= 50 ? 'var(--yellow)' : 'var(--red)' }} /></div>
              </div>
            </div>
          ))}
        </div>

        {detail && (
          <div>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{detail.brand} — Detail</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['overview', 'catalog', 'performance'].map(t => (
                    <button key={t} className={`btn-sm ${tab === t ? '' : ''}`} style={tab === t ? { background: 'var(--accent)', color: '#fff' } : {}} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                  ))}
                </div>
              </div>

              {tab === 'overview' && (
                <div className="form-grid" style={{ gap: 16 }}>
                  {[
                    ['Brand', detail.brand], ['Product Line', detail.productLine], ['Territory', detail.territory],
                    ['Exclusivity', detail.exclusivity], ['Start Date', detail.start], ['End Date', detail.end],
                    ['Min Order Commitment', `${detail.minOrder} units/year`], ['Contact', detail.contact], ['Email', detail.email],
                  ].map(([l, v]) => (
                    <div key={l}><div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div><div style={{ fontWeight: 600 }}>{v}</div></div>
                  ))}
                </div>
              )}

              {tab === 'catalog' && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Product', 'Spec', '1-9 pcs', '10-49 pcs', '50+ pcs', 'Lead Time', 'MOQ'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                  <tbody>{catalog.map(c => (
                    <tr key={c.id}>
                      <td className="td" style={{ fontWeight: 600 }}>{c.name}</td>
                      <td className="td" style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{c.spec}</td>
                      <td className="td">${c.price1.toLocaleString()}</td>
                      <td className="td">${c.price10.toLocaleString()}</td>
                      <td className="td" style={{ color: 'var(--green)' }}>${c.price50.toLocaleString()}</td>
                      <td className="td">{c.leadTime}</td>
                      <td className="td">{c.moq}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}

              {tab === 'performance' && (
                <>
                  <div className="kpis" style={{ marginBottom: 16 }}>
                    <div className="kpi"><div className="kpi-label">Units Sold</div><div className="kpi-value">{detail.unitsSold}</div></div>
                    <div className="kpi"><div className="kpi-label">Revenue</div><div className="kpi-value">${(detail.revenue / 1000).toFixed(0)}K</div></div>
                    <div className="kpi"><div className="kpi-label">Target</div><div className="kpi-value">{detail.target} units</div></div>
                    <div className="kpi"><div className="kpi-label">Fulfillment</div><div className="kpi-value" style={{ color: pct(detail.unitsSold, detail.target) >= 80 ? 'var(--green)' : 'var(--yellow)' }}>{pct(detail.unitsSold, detail.target)}%</div></div>
                  </div>
                  <div className="panel-title" style={{ marginBottom: 8 }}>Quarterly Breakdown</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['Quarter', 'Units', 'Revenue', 'Status'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                    <tbody>
                      {[
                        { q: 'Q1 2024', u: Math.round(detail.unitsSold * 0.2), r: Math.round(detail.revenue * 0.2) },
                        { q: 'Q2 2024', u: Math.round(detail.unitsSold * 0.25), r: Math.round(detail.revenue * 0.25) },
                        { q: 'Q3 2024', u: Math.round(detail.unitsSold * 0.3), r: Math.round(detail.revenue * 0.3) },
                        { q: 'Q4 2024', u: Math.round(detail.unitsSold * 0.25), r: Math.round(detail.revenue * 0.25) },
                      ].map(row => (
                        <tr key={row.q}>
                          <td className="td" style={{ fontWeight: 600 }}>{row.q}</td>
                          <td className="td">{row.u}</td>
                          <td className="td">${(row.r / 1000).toFixed(0)}K</td>
                          <td className="td"><span className="badge badge-green">Completed</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
