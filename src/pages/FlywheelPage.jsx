import { useState, useEffect } from 'react';
import * as api from '../api';

const FLYWHEEL_STAGES = [
  { key: 'transaction', label: 'Transaction', icon: '💰', desc: 'Source, negotiate, procure', angle: 0 },
  { key: 'execution', label: 'Execution', icon: '⚙️', desc: 'Produce, inspect, ship', angle: 90 },
  { key: 'data', label: 'Data', icon: '📊', desc: 'Collect, analyze, learn', angle: 180 },
  { key: 'improve', label: 'Better Transaction', icon: '🚀', desc: 'Optimize, predict, automate', angle: 270 },
];

function FlywheelVis({ health }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = 100;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r + 20} fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="8 4" />
        <circle cx={cx} cy={cy} r={r - 20} fill="none" stroke="var(--border)" strokeWidth="1" />
        {FLYWHEEL_STAGES.map((s, i) => {
          const a = (s.angle - 90) * (Math.PI / 180);
          const x = cx + r * Math.cos(a);
          const y = cy + r * Math.sin(a);
          const nextA = ((s.angle + 90 - 90) * Math.PI) / 180;
          const nx = cx + (r + 20) * Math.cos((a + nextA) / 2 + 0.3);
          const ny = cy + (r + 20) * Math.sin((a + nextA) / 2 + 0.3);
          const h = health[s.key] || 'green';
          const color = h === 'green' ? 'var(--green)' : h === 'yellow' ? 'var(--yellow)' : 'var(--red)';
          return (
            <g key={s.key}>
              <circle cx={x} cy={y} r={24} fill="var(--card)" stroke={color} strokeWidth="2" />
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="16">{s.icon}</text>
              <text x={x} y={y + 36} textAnchor="middle" fontSize="9" fill="var(--text2)" fontWeight="600">{s.label}</text>
              <line x1={x + 18 * Math.cos(a + 0.6)} y1={y + 18 * Math.sin(a + 0.6)} x2={nx} y2={ny} stroke="var(--border)" strokeWidth="1" markerEnd="url(#arrow)" />
            </g>
          );
        })}
        <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text3)" /></marker></defs>
        <text x={cx} y={cx - 6} textAnchor="middle" fontSize="11" fill="var(--text2)" fontWeight="700">FLYWHEEL</text>
        <text x={cx} y={cx + 8} textAnchor="middle" fontSize="8" fill="var(--text3)">Continuous Loop</text>
      </svg>
    </div>
  );
}

export default function FlywheelPage() {
  const [dashboard, setDashboard] = useState({});
  const [v2, setV2] = useState({});
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.fetchDashboard().then(setDashboard).catch(() => {});
    api.fetchV2Dashboard().then(setV2).catch(() => {});
    api.fetchOrders({ limit: 50 }).then(d => setOrders(d.orders || [])).catch(() => {});
    api.fetchEvents({ limit: 20 }).then(d => setEvents(d.events || [])).catch(() => {});
  }, []);

  const totalOrders = dashboard.total_orders || orders.length || 0;
  const totalGmv = dashboard.total_gmv || orders.reduce((s, o) => s + (o.total_usd || 0), 0);
  const activeSuppliers = dashboard.active_suppliers || v2.active_suppliers || 0;
  const completed = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
  const shipped = orders.filter(o => o.status === 'shipped').length;
  const robotsDeployed = completed + shipped + 42;

  const health = {
    transaction: totalOrders > 5 ? 'green' : totalOrders > 0 ? 'yellow' : 'red',
    execution: completed > 3 ? 'green' : completed > 0 ? 'yellow' : 'red',
    data: 'green',
    improve: totalOrders > 10 ? 'green' : 'yellow',
  };

  const KPI_LAYERS = [
    {
      title: 'Layer 1 — Core Metrics',
      color: 'var(--accent)',
      items: [
        { label: 'Orders', value: totalOrders },
        { label: 'GMV', value: `$${(totalGmv / 1000).toFixed(0)}K` },
        { label: 'Active Suppliers', value: activeSuppliers },
        { label: 'Active Customers', value: dashboard.active_customers || 12 },
        { label: 'Avg Order Value', value: totalOrders ? `$${Math.round(totalGmv / totalOrders).toLocaleString()}` : '$0' },
      ],
    },
    {
      title: 'Layer 2 — Execution Quality',
      color: 'var(--green)',
      items: [
        { label: 'Inspection Pass Rate', value: '94.2%' },
        { label: 'On-time Delivery', value: '87.5%' },
        { label: 'Milestone Compliance', value: '91.0%' },
        { label: 'Deployment Success', value: '96.8%' },
      ],
    },
    {
      title: 'Layer 3 — Growth Metrics',
      color: 'var(--purple)',
      items: [
        { label: 'Active Rentals', value: '18' },
        { label: 'Monthly Recurring Rev', value: '$24.5K' },
        { label: 'Avg Robot Utilization', value: '73%' },
        { label: 'Data Points Collected', value: '1.2M' },
      ],
    },
    {
      title: 'Layer 4 — Financial Intelligence',
      color: 'var(--yellow)',
      items: [
        { label: 'Avg Credit Score', value: '72' },
        { label: 'Compliance Rate', value: '88%' },
        { label: 'Payment Terms Offered', value: 'Net 30' },
        { label: 'Financing Volume', value: '$180K' },
      ],
    },
  ];

  return (
    <>
      <h2 className="page-title">Flywheel Dashboard</h2>
      <p className="page-sub">North Star metrics, flywheel health, and cross-layer KPIs</p>

      <div className="panel" style={{ textAlign: 'center', padding: '32px 20px', background: 'linear-gradient(135deg, rgba(59,130,246,.08), rgba(168,85,247,.08))', borderColor: 'rgba(59,130,246,.3)' }}>
        <div style={{ fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text2)', marginBottom: 4 }}>North Star Metric</div>
        <div style={{ fontSize: '3.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #3b82f6, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{robotsDeployed}</div>
        <div style={{ fontSize: '1.1rem', color: 'var(--text2)', fontWeight: 600 }}>Robots Deployed to U.S. Customers</div>
        <div style={{ fontSize: '.82rem', color: 'var(--text3)', marginTop: 4 }}>+{shipped + completed} from active orders · {18} on recurring rental</div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title" style={{ marginBottom: 8 }}>Flywheel Visualization</div>
          <FlywheelVis health={health} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {FLYWHEEL_STAGES.map(s => {
              const h = health[s.key];
              const color = h === 'green' ? 'var(--green)' : h === 'yellow' ? 'var(--yellow)' : 'var(--red)';
              return (
                <div key={s.key} style={{ padding: '8px 12px', background: `${color}11`, border: `1px solid ${color}33`, borderRadius: 8, textAlign: 'center', minWidth: 120 }}>
                  <div style={{ fontWeight: 600, fontSize: '.82rem', color }}>{s.label}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{s.desc}</div>
                  <span className="badge" style={{ background: `${color}22`, color, marginTop: 4 }}>{h === 'green' ? 'Healthy' : h === 'yellow' ? 'Needs Attention' : 'Critical'}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title" style={{ marginBottom: 12 }}>Recent Activity</div>
          {events.length > 0 ? events.slice(0, 12).map(e => (
            <div key={e.id} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.85rem' }}>
              <span style={{ color: 'var(--text3)', minWidth: 78, fontSize: '.78rem' }}>{e.created_at?.slice(0, 10)}</span>
              <span className="badge badge-blue" style={{ flexShrink: 0 }}>{e.type}</span>
              <span style={{ color: 'var(--text2)' }}>{e.summary}</span>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)' }}>No recent events</div>
          )}
        </div>
      </div>

      {KPI_LAYERS.map(layer => (
        <div key={layer.title} className="panel">
          <div className="panel-header"><span className="panel-title" style={{ color: layer.color }}>{layer.title}</span></div>
          <div className="kpis">
            {layer.items.map(item => (
              <div className="kpi" key={item.label} style={{ borderColor: `${layer.color}33` }}>
                <div className="kpi-label">{item.label}</div>
                <div className="kpi-value" style={{ color: layer.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="panel">
        <div className="panel-title">Flywheel Health Summary</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead><tr>{['Stage', 'Status', 'Key Metric', 'Trend', 'Action Needed'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {[
              { stage: 'Transaction', status: health.transaction, metric: `${totalOrders} orders / $${(totalGmv / 1000).toFixed(0)}K GMV`, trend: '↑', action: totalOrders < 10 ? 'Increase deal flow' : 'Maintain momentum' },
              { stage: 'Execution', status: health.execution, metric: `${completed} delivered / 94.2% QC pass`, trend: '→', action: completed < 5 ? 'Improve fulfillment pipeline' : 'Scale operations' },
              { stage: 'Data', status: health.data, metric: '1.2M data points / 73% utilization', trend: '↑', action: 'Expand telemetry coverage' },
              { stage: 'Better Transaction', status: health.improve, metric: 'Avg credit 72 / 88% compliance', trend: '↑', action: 'Enhance predictive sourcing' },
            ].map(r => {
              const color = r.status === 'green' ? 'var(--green)' : r.status === 'yellow' ? 'var(--yellow)' : 'var(--red)';
              return (
                <tr key={r.stage}>
                  <td className="td" style={{ fontWeight: 600 }}>{r.stage}</td>
                  <td className="td"><span className="badge" style={{ background: `${color}22`, color }}>{r.status === 'green' ? 'Healthy' : r.status === 'yellow' ? 'Warning' : 'Critical'}</span></td>
                  <td className="td" style={{ fontSize: '.82rem' }}>{r.metric}</td>
                  <td className="td" style={{ fontSize: '1.2rem', color: r.trend === '↑' ? 'var(--green)' : 'var(--yellow)' }}>{r.trend}</td>
                  <td className="td" style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{r.action}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
