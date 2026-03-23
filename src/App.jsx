import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import * as api from './api';
import { AuthProvider, useAuth } from './auth';
import { I18nProvider, useI18n } from './i18n';
import AgentBar from './AgentBar';
import NotificationCenter from './components/NotificationCenter';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const ConfidencePage = lazy(() => import('./pages/ConfidencePage'));
const NegotiationPage = lazy(() => import('./pages/NegotiationPage'));
const MilestonePage = lazy(() => import('./pages/MilestonePage'));
const VerificationPage = lazy(() => import('./pages/VerificationPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));
const BrowserAgentPage = lazy(() => import('./pages/BrowserAgentPage'));
const SupplyGraphPage = lazy(() => import('./pages/SupplyGraphPage'));
const TrustScorePage = lazy(() => import('./pages/TrustScorePage'));
const FulfillmentPage = lazy(() => import('./pages/FulfillmentPage'));
const CompliancePage = lazy(() => import('./pages/CompliancePage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const RevenuePage = lazy(() => import('./pages/RevenuePage'));
const AgencyPage = lazy(() => import('./pages/AgencyPage'));
const CreditPage = lazy(() => import('./pages/CreditPage'));
const CustomerPortalPage = lazy(() => import('./pages/CustomerPortalPage'));
const FlywheelPage = lazy(() => import('./pages/FlywheelPage'));
const OrgManagementPage = lazy(() => import('./pages/OrgManagementPage'));
const RolesPermissionsPage = lazy(() => import('./pages/RolesPermissionsPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const CrawlerPage = lazy(() => import('./pages/CrawlerPage'));
const RequestsPage = lazy(() => import('./pages/RequestsPage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const EdaDesignHub = lazy(() => import('./pages/EdaDesignHub'));
const SchematicEditor = lazy(() => import('./pages/SchematicEditor'));
const PcbLayoutEditor = lazy(() => import('./pages/PcbLayoutEditor'));
const GerberPreview = lazy(() => import('./pages/GerberPreview'));
const PcbOrderPage = lazy(() => import('./pages/PcbOrderPage'));
const PartsCatalogPage = lazy(() => import('./pages/PartsCatalogPage'));
const HumanoidAtlasPage = lazy(() => import('./pages/HumanoidAtlasPage'));
const SupplyTreePage = lazy(() => import('./pages/SupplyTreePage'));
const CADDesignPage = lazy(() => import('./pages/CADDesignPage'));
const DesignToQuotePage = lazy(() => import('./pages/DesignToQuotePage'));
const MESWorkbenchPage = lazy(() => import('./pages/MESWorkbenchPage'));
const TraceabilityPage = lazy(() => import('./pages/TraceabilityPage'));
const AIAnalyticsPage = lazy(() => import('./pages/AIAnalyticsPage'));
const DesignTemplatesPage = lazy(() => import('./pages/DesignTemplatesPage'));
const ProjectWorkspacePage = lazy(() => import('./pages/ProjectWorkspacePage'));
const ProductWizardPage = lazy(() => import('./pages/ProductWizardPage'));
const ComponentSearchPage = lazy(() => import('./pages/ComponentSearchPage'));
const MarketIntelligencePage = lazy(() => import('./pages/MarketIntelligencePage'));
const ComplianceGuidePage = lazy(() => import('./pages/ComplianceGuidePage'));
const PrototypeBundlePage = lazy(() => import('./pages/PrototypeBundlePage'));
const APSSimulationPage = lazy(() => import('./pages/APSSimulationPage'));
const BuyerSchedulePage = lazy(() => import('./pages/BuyerSchedulePage'));
const LaunchpadPage = lazy(() => import('./pages/LaunchpadPage'));
const QuickStartPage = lazy(() => import('./pages/QuickStartPage'));
const LogisticsPage = lazy(() => import('./pages/LogisticsPage'));
const AutoNegPage = lazy(() => import('./pages/AutoNegPage'));
const InfraHubPage = lazy(() => import('./pages/InfraHubPage'));
const PlatformIntelPage = lazy(() => import('./pages/PlatformIntelPage'));
const RevenueOSPage = lazy(() => import('./pages/RevenueOSPage'));
const GeoIntelPage = lazy(() => import('./pages/GeoIntelPage'));


const NAV_DEF = [
  { groupKey: 'nav.home_group', collapsed: false, items: [
    { id: 'launchpad', labelKey: 'nav.launchpad', icon: '🏠' },
    { id: 'quick_start', labelKey: 'nav.quick_start', icon: '🚀' },
    { id: 'platform_intel', labelKey: 'nav.platform_intel', icon: '🧠' },
    { id: 'infra_hub', labelKey: 'nav.infra_hub', icon: '⚡' },
    { id: 'revenue_os', labelKey: 'nav.revenue_os', icon: '💎' },
    { id: 'geointel', labelKey: 'nav.geointel', icon: '🌐' },
    { id: 'project_workspace', labelKey: 'nav.project_workspace', icon: '📋' },
  ]},
  { groupKey: 'nav.product_dev', collapsed: false, items: [
    { id: 'product_wizard', labelKey: 'nav.product_wizard', icon: '🧙' },
    { id: 'component_search', labelKey: 'nav.component_search', icon: '🔍' },
    { id: 'prototype_bundle', labelKey: 'nav.prototype_bundle', icon: '📦' },
    { id: 'compliance_guide', labelKey: 'nav.compliance_guide', icon: '✅' },
    { id: 'market_intel', labelKey: 'nav.market_intel', icon: '📊' },
  ]},
  { groupKey: 'nav.design_tools', collapsed: false, items: [
    { id: 'cad_design', labelKey: 'nav.cad_design', icon: '🔧' },
    { id: 'eda_hub', labelKey: 'nav.eda_hub', icon: '🔌' },
    { id: 'design_templates', labelKey: 'nav.design_templates', icon: '📚' },
    { id: 'design_to_quote', labelKey: 'nav.design_to_quote', icon: '💰' },
  ]},
  { groupKey: 'nav.catalog', collapsed: true, items: [
    { id: 'parts_catalog', labelKey: 'nav.parts_catalog', icon: '🔩' },
    { id: 'humanoid_atlas', labelKey: 'nav.humanoid_atlas', icon: '🤖' },
    { id: 'supply_tree', labelKey: 'nav.supply_tree', icon: '🌳' },
  ]},
  { groupKey: 'nav.transaction', collapsed: true, items: [
    { id: 'marketplace', labelKey: 'nav.marketplace', icon: '🛒' },
    { id: 'rfq', labelKey: 'nav.rfq', icon: '📝' },
    { id: 'negotiation', labelKey: 'nav.negotiation', icon: '💬' },
    { id: 'bom', labelKey: 'nav.bom', icon: '🔧' },
    { id: 'orders', labelKey: 'nav.orders', icon: '📦' },
    { id: 'logistics', labelKey: 'nav.logistics', icon: '🚚' },
  ]},
  { groupKey: 'nav.supplier', collapsed: true, items: [
    { id: 'suppliers', labelKey: 'nav.suppliers', icon: '🏭' },
    { id: 'expert', labelKey: 'nav.expert', icon: '🧠' },
    { id: 'trust', labelKey: 'nav.trust', icon: '⭐' },
    { id: 'relationships', labelKey: 'nav.relationships', icon: '🤝' },
    { id: 'intelligence', labelKey: 'nav.intelligence', icon: '📈' },
    { id: 'auto_neg', labelKey: 'nav.auto_neg', icon: '🤝' },
  ]},
  { groupKey: 'nav.advanced', collapsed: true, items: [
    { id: 'dashboard', labelKey: 'nav.dashboard', icon: '📊' },
    { id: 'flywheel', labelKey: 'nav.flywheel', icon: '🎯' },
    { id: 'confidence', labelKey: 'nav.confidence', icon: '⚡' },
    { id: 'agency', labelKey: 'nav.agency', icon: '📜' },
    { id: 'procurement', labelKey: 'nav.procurement', icon: '🔗' },
    { id: 'milestones', labelKey: 'nav.milestones', icon: '🏦' },
    { id: 'verification', labelKey: 'nav.verification', icon: '🔍' },
    { id: 'compliance', labelKey: 'nav.compliance', icon: '📋' },
    { id: 'portal', labelKey: 'nav.portal', icon: '👤' },
    { id: 'credit', labelKey: 'nav.credit', icon: '💳' },
    { id: 'schematic', labelKey: 'nav.schematic', icon: '📐' },
    { id: 'pcb_layout', labelKey: 'nav.pcb_layout', icon: '🖥️' },
    { id: 'gerber_view', labelKey: 'nav.gerber_view', icon: '👁️' },
    { id: 'pcb_order', labelKey: 'nav.pcb_order', icon: '🛒' },
    { id: 'quality', labelKey: 'nav.quality_risk', icon: '🛡️' },
    { id: 'fulfillment', labelKey: 'nav.fulfillment', icon: '📦' },
    { id: 'payments', labelKey: 'nav.payments', icon: '💰' },
    { id: 'revenue', labelKey: 'nav.revenue', icon: '📈' },
    { id: 'mes_workbench', labelKey: 'nav.mes_workbench', icon: '☁️' },
    { id: 'aps_simulation', labelKey: 'nav.aps_simulation', icon: '🧪' },
    { id: 'buyer_schedule', labelKey: 'nav.buyer_schedule', icon: '📋' },
    { id: 'traceability', labelKey: 'nav.traceability', icon: '🔍' },
    { id: 'ai_analytics', labelKey: 'nav.ai_analytics', icon: '🤖' },
    { id: 'browser', labelKey: 'nav.browser', icon: '🌐' },
    { id: 'graph', labelKey: 'nav.graph', icon: '🕸️' },
    { id: 'crawler', labelKey: 'nav.crawler', icon: '🕷️' },
    { id: 'requests', labelKey: 'nav.requests', icon: '📋' },
    { id: 'timeline', labelKey: 'nav.timeline', icon: '🕐' },
  ]},
  { groupKey: 'nav.system', collapsed: true, items: [
    { id: 'org', labelKey: 'nav.org', icon: '🏢' },
    { id: 'roles', labelKey: 'nav.roles', icon: '🔐' },
    { id: 'account', labelKey: 'nav.account', icon: '⚙️' },
  ]},
];

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

function DashboardPage() {
  const { t } = useI18n();
  const [d1, setD1] = useState(null);
  const [d2, setD2] = useState(null);
  useEffect(() => { api.fetchDashboard().then(setD1).catch(() => {}); api.fetchV2Dashboard().then(setD2).catch(() => {}); }, []);

  return (
    <>
      <h2 className="page-title">{t('dash.title')}</h2>
      <p className="page-sub">{t('dash.sub')}</p>
      {d1 && (
        <div className="kpis">
          {[
            { l: t('dash.active_suppliers'), v: d1.active_suppliers, c: 'var(--accent)' },
            { l: t('dash.open_requests'), v: d1.active_requests, c: 'var(--yellow)' },
            { l: t('dash.active_negotiations'), v: d1.active_negotiations, c: 'var(--purple)' },
            { l: t('dash.pending_orders'), v: d1.pending_orders, c: 'var(--orange)' },
            { l: t('dash.completed_orders'), v: d1.completed_orders, c: 'var(--green)' },
          ].map(k => <div key={k.l} className="kpi"><div className="kpi-label">{k.l}</div><div className="kpi-value" style={{ color: k.c }}>{k.v}</div></div>)}
        </div>
      )}
      {d2 && (
        <div className="kpis">
          {[
            { l: t('dash.expert_insights'), v: d2.expert_memory?.total_insights || 0, c: 'var(--purple)' },
            { l: t('dash.bom_projects'), v: d2.bom?.total_projects || 0, c: 'var(--accent)' },
            { l: t('dash.standard_parts'), v: d2.bom?.standard_items || 0, c: 'var(--green)' },
            { l: t('dash.custom_parts'), v: d2.bom?.custom_items || 0, c: 'var(--orange)' },
            { l: t('dash.relationships'), v: d2.relationships?.total || 0, c: 'var(--accent)' },
            { l: t('dash.active_rfqs'), v: d2.rfq?.active || 0, c: 'var(--yellow)' },
            { l: t('dash.open_issues'), v: d2.quality?.open_issues || 0, c: 'var(--red)' },
            { l: t('dash.risk_alerts'), v: d2.quality?.active_alerts || 0, c: 'var(--orange)' },
            { l: t('dash.procurement_active'), v: d2.procurement?.active_projects || 0, c: 'var(--accent)' },
          ].map(k => <div key={k.l} className="kpi"><div className="kpi-label">{k.l}</div><div className="kpi-value" style={{ color: k.c }}>{k.v}</div></div>)}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPERT MEMORY
// ═══════════════════════════════════════════════════════════════════════════

function ExpertPage() {
  const [insights, setInsights] = useState([]);
  const [tags, setTags] = useState([]);
  const [avoidance, setAvoidance] = useState([]);
  const [rec, setRec] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ supplier_id: '', insight_type: 'strength', category: '', title: '', content: '', scenarios: '' });
  const [rf, setRf] = useState({ part_category: '', scenario: 'prototype', budget_tier: 'mid' });

  const load = useCallback(() => {
    api.fetchInsights().then(d => setInsights(d.insights || [])).catch(() => {});
    api.fetchTags().then(d => setTags(d.tags || [])).catch(() => {});
    api.fetchAvoidance().then(d => setAvoidance(d.records || [])).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    await api.createInsight({ ...form, supplier_id: Number(form.supplier_id), scenarios: form.scenarios.split(',').map(s => s.trim()).filter(Boolean) });
    setShowAdd(false); load();
  };

  const { t } = useI18n();
  return (
    <>
      <h2 className="page-title">{t('expert.title')}</h2>
      <p className="page-sub">{t('expert.sub')}</p>

      <div className="panel">
        <div className="panel-header"><span className="panel-title">{t('expert.recommender')}</span></div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <select className="select" value={rf.part_category} onChange={e => setRf({ ...rf, part_category: e.target.value })}>
            <option value="">All categories</option>
            {['motor','encoder','driver','bearing','pcb','CNC','injection_molding','cable','connector'].map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="select" value={rf.scenario} onChange={e => setRf({ ...rf, scenario: e.target.value })}>
            {['prototype','mass_production','us_demo','small_batch','custom'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="select" value={rf.budget_tier} onChange={e => setRf({ ...rf, budget_tier: e.target.value })}>
            {['budget','mid','premium'].map(t => <option key={t}>{t}</option>)}
          </select>
          <button className="btn btn-primary" onClick={async () => setRec(await api.aiRecommend(rf))}>{t('expert.find')}</button>
        </div>
        {rec?.recommendations?.length > 0 && rec.recommendations.slice(0, 8).map(r => (
          <div key={r.supplier_id} className="card" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
            <div>
              <strong>{r.name}</strong>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{r.platform} · {r.location}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{r.reasons.join(' | ')}</div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: r.match_score >= 50 ? 'var(--green)' : 'var(--yellow)' }}>{r.match_score}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('expert.insights')} ({insights.length})</span>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ {t('common.add')}</button>
        </div>
        {insights.map(i => (
          <div key={i.id} className="card" style={{ marginBottom: 8 }}>
            <span className={`badge badge-${i.insight_type === 'warning' ? 'red' : i.insight_type === 'strength' ? 'green' : 'blue'}`}>{i.insight_type}</span>
            {' '}<strong>{i.title}</strong> <span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>Supplier #{i.supplier_id}</span>
            <div style={{ fontSize: '.85rem', marginTop: 4 }}>{i.content}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">{t('expert.tags')} ({tags.length})</div>
          {tags.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.85rem' }}>
              <span>#{t.supplier_id}: <strong>{t.tag_label || t.tag_key}</strong></span>
              <span style={{ color: t.score >= .7 ? 'var(--green)' : 'var(--yellow)' }}>{(t.score * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-title">{t('expert.avoidance')} ({avoidance.length})</div>
          {avoidance.map(a => (
            <div key={a.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.85rem' }}>
              <span className={`badge badge-${a.severity === 'critical' || a.severity === 'high' ? 'red' : 'yellow'}`}>{a.severity}</span>
              {' '}#{a.supplier_id} — {a.description?.slice(0, 80)}
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>{t('expert.add')}</h3>
            <div className="form-grid">
              <input className="input" placeholder="Supplier ID" value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })} />
              <select className="select" value={form.insight_type} onChange={e => setForm({ ...form, insight_type: e.target.value })} style={{ width: '100%' }}>
                {['strength','weakness','warning','tip','scenario','relationship'].map(t => <option key={t}>{t}</option>)}
              </select>
              <input className="input" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              <input className="input" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <textarea className="input" placeholder="Content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} style={{ gridColumn: 'span 2', minHeight: 60 }} />
              <input className="input" placeholder="Scenarios (comma-sep)" value={form.scenarios} onChange={e => setForm({ ...form, scenarios: e.target.value })} style={{ gridColumn: 'span 2' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BOM ROUTER
// ═══════════════════════════════════════════════════════════════════════════

function BOMPage() {
  const [projects, setProjects] = useState([]);
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ name: '', product_type: 'robot' });
  const [itemForm, setItemForm] = useState({ name: '', category: 'motor', quantity: 1, unit_cost_usd: 0, part_number: '' });
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(() => { api.fetchBomProjects().then(d => setProjects(d.projects || [])).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (sel) api.fetchBomProject(sel).then(setDetail).catch(() => {}); }, [sel]);

  const addItem = async () => {
    await api.createBomItem({ ...itemForm, project_id: sel, quantity: Number(itemForm.quantity), unit_cost_usd: Number(itemForm.unit_cost_usd) });
    api.fetchBomProject(sel).then(setDetail);
    setItemForm({ name: '', category: 'motor', quantity: 1, unit_cost_usd: 0, part_number: '' });
  };

  const { t } = useI18n();
  return (
    <>
      <h2 className="page-title">{t('bom.title')}</h2>
      <p className="page-sub">{t('bom.sub')}</p>
      <div className="grid-sidebar">
        <div className="panel">
          <div className="panel-header"><span className="panel-title">{t('bom.projects')}</span><button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>+</button></div>
          {showNew && <div style={{ marginBottom: 8 }}><input className="input" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ marginBottom: 6 }} /><button className="btn btn-primary" disabled={!form.name} onClick={async () => { await api.createBomProject(form); setShowNew(false); load(); }}>Create</button></div>}
          {projects.map(p => (
            <div key={p.id} className={`card ${sel === p.id ? 'active' : ''}`} style={{ cursor: 'pointer', marginBottom: 6 }} onClick={() => setSel(p.id)}>
              <strong>{p.name}</strong>
              <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{p.total_parts} parts · ${p.estimated_cost_usd?.toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div className="panel">
          {detail ? (<>
            <h3>{detail.name}</h3>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: '.85rem' }}>
              <span style={{ color: 'var(--accent)' }}>STD: {detail.standard_parts}</span>
              <span style={{ color: 'var(--purple)' }}>Custom: {detail.custom_parts}</span>
              <span style={{ color: 'var(--green)' }}>Cost: ${detail.estimated_cost_usd?.toFixed(2)}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Part #','Name','Category','Type','Qty','Unit $','Route','Status',''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>{(detail.items || []).map(i => (
                <tr key={i.id}>
                  <td className="td">{i.part_number || '—'}</td>
                  <td className="td" style={{ fontWeight: 600 }}>{i.name}</td>
                  <td className="td">{i.category}</td>
                  <td className="td">{i.is_standard ? <span className="badge badge-green">STD</span> : <span className="badge badge-purple">CUSTOM</span>}</td>
                  <td className="td">{i.quantity}</td>
                  <td className="td">${i.unit_cost_usd}</td>
                  <td className="td"><span className={`badge badge-${i.routing_decision === 'auto' ? 'green' : 'yellow'}`}>{i.routing_decision}</span></td>
                  <td className="td"><span className="badge badge-blue">{i.procurement_status}</span></td>
                  <td className="td">{i.is_standard && <button className="btn-sm" onClick={async () => { await api.autoRoute(i.id); api.fetchBomProject(sel).then(setDetail); }}>Route</button>}</td>
                </tr>
              ))}</tbody>
            </table>
            <div style={{ marginTop: 12, padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.85rem' }}>{t('bom.add_part')}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="Part #" value={itemForm.part_number} onChange={e => setItemForm({ ...itemForm, part_number: e.target.value })} style={{ width: 100 }} />
                <input className="input" placeholder="Name *" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} style={{ flex: 1 }} />
                <select className="select" value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })}>
                  {['motor','encoder','driver','bearing','fastener','power_supply','cable','connector','pcb','sensor','housing','structural','custom'].map(c => <option key={c}>{c}</option>)}
                </select>
                <input className="input" type="number" value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })} style={{ width: 60 }} />
                <input className="input" type="number" placeholder="$" value={itemForm.unit_cost_usd} onChange={e => setItemForm({ ...itemForm, unit_cost_usd: e.target.value })} style={{ width: 80 }} />
                <button className="btn btn-primary" disabled={!itemForm.name} onClick={addItem}>Add</button>
              </div>
            </div>
          </>) : <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Select or create a BOM project</div>}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RFQ ENGINE
// ═══════════════════════════════════════════════════════════════════════════

function RFQPage() {
  const [rfqs, setRfqs] = useState([]);
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [comp, setComp] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', quantity: 1, budget_usd: 0 });

  const { t } = useI18n();
  const load = useCallback(() => { api.fetchRfqs().then(d => setRfqs(d.rfqs || [])).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (sel) api.fetchRfq(sel).then(setDetail).catch(() => {}); }, [sel]);

  return (
    <>
      <h2 className="page-title">{t('rfq.title')}</h2>
      <p className="page-sub">{t('rfq.sub')}</p>
      <div className="grid-sidebar">
        <div className="panel">
          <div className="panel-header"><span className="panel-title">RFQs</span><button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>+</button></div>
          {showNew && <div style={{ marginBottom: 8 }}><input className="input" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ marginBottom: 6 }} /><div style={{ display: 'flex', gap: 6, marginBottom: 6 }}><input className="input" type="number" placeholder="Qty" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} /><input className="input" type="number" placeholder="Budget $" value={form.budget_usd} onChange={e => setForm({ ...form, budget_usd: Number(e.target.value) })} /></div><button className="btn btn-primary" disabled={!form.title} onClick={async () => { await api.createRfq(form); setShowNew(false); load(); }}>Create</button></div>}
          {rfqs.map(r => (
            <div key={r.id} className={`card ${sel === r.id ? 'active' : ''}`} style={{ cursor: 'pointer', marginBottom: 6 }} onClick={() => setSel(r.id)}>
              <div style={{ fontWeight: 600 }}>{r.rfq_key}</div>
              <div style={{ fontSize: '.82rem' }}>{r.title}</div>
              <span className={`badge badge-${r.status === 'decided' ? 'green' : 'blue'}`}>{r.status}</span>
            </div>
          ))}
        </div>
        <div className="panel">
          {detail ? (<>
            <div className="panel-header">
              <span className="panel-title">{detail.rfq_key}: {detail.title}</span>
              <button className="btn btn-primary" onClick={async () => setComp(await api.compareQuotes(detail.id))}>{t('rfq.compare')}</button>
            </div>
            {detail.quotes?.length > 0 && <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}><thead><tr>{['Supplier','Ver','Unit $','Total $','MOQ','Lead','Score'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead><tbody>{detail.quotes.map(q => <tr key={q.id}><td className="td">#{q.supplier_id}</td><td className="td">v{q.version}</td><td className="td">${q.unit_price_usd}</td><td className="td">${q.total_price_usd}</td><td className="td">{q.moq}</td><td className="td">{q.lead_time_days}d</td><td className="td" style={{ color: q.ai_score >= 60 ? 'var(--green)' : 'var(--yellow)', fontWeight: 700 }}>{q.ai_score}</td></tr>)}</tbody></table>}
            {comp?.comparison?.length > 0 && <div><h4 style={{ marginBottom: 8 }}>Comparison</h4>{comp.comparison.map(c => <div key={c.supplier_id} className="card" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}><div><strong>{c.supplier_name || `#${c.supplier_id}`}</strong><div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>${c.unit_price_usd}/unit · MOQ: {c.moq} · {c.lead_time_days}d</div></div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: c.ai_score >= 60 ? 'var(--green)' : 'var(--yellow)' }}>{c.ai_score}</div></div>)}</div>}
          </>) : <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Select or create an RFQ</div>}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPPLIERS / RELATIONSHIPS / QUALITY / PROCUREMENT / INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════

function SuppliersPage() {
  const { t } = useI18n();
  const [list, setList] = useState([]);
  useEffect(() => { api.fetchSuppliers().then(d => setList(d.suppliers || [])).catch(() => {}); }, []);
  return (<><h2 className="page-title">{t('supp.title')}</h2><p className="page-sub">{t('supp.sub')}</p><div className="grid-3">{list.map(s => <div key={s.id} className="card"><strong>{s.name}</strong><div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{s.platform} · {s.location}</div><div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: '.78rem' }}><span>Quality: {s.quality_score}/5</span><span>Price: {s.price_score}/5</span><span>Speed: {s.response_speed_score}/5</span></div><div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: 4 }}>{s.total_orders} orders · ${s.total_spend_usd?.toFixed(0)} spent</div></div>)}</div>{!list.length && <div className="panel" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No suppliers yet. Add via Expert Memory or Marketplace.</div>}</>);
}

function RelationshipsPage() {
  const { t } = useI18n();
  const [rels, setRels] = useState([]);
  const [events, setEvents] = useState([]);
  useEffect(() => { api.fetchRelationships().then(d => setRels(d.relationships || [])).catch(() => {}); api.fetchRelEvents().then(d => setEvents(d.events || [])).catch(() => {}); }, []);
  const trustC = { 1: 'var(--red)', 2: 'var(--orange)', 3: 'var(--yellow)', 4: 'var(--green)', 5: '#10b981' };
  return (<><h2 className="page-title">{t('rel.title')}</h2><p className="page-sub">{t('rel.sub')}</p><div className="grid-3">{rels.map(r => <div key={r.id} className="card"><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{r.contact_person || `Supplier #${r.supplier_id}`}</strong><span className="badge badge-blue">{r.relationship_strength}</span></div><div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{r.contact_role} · {r.preferred_channel} · {r.language === 'zh' ? '中文' : 'EN'}</div><div className="stars">{[1,2,3,4,5].map(n => <span key={n} className={`star ${n <= r.trust_level ? 'on' : 'off'}`}>★</span>)}</div>{r.can_delegate_to_ai && <span className="badge badge-green" style={{ marginTop: 4 }}>AI Delegatable</span>}{r.special_notes && <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: 4 }}>{r.special_notes.slice(0, 80)}</div>}</div>)}</div><div className="panel" style={{ marginTop: 16 }}><div className="panel-title">Recent Events</div>{events.slice(0, 15).map(e => <div key={e.id} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.85rem' }}><span style={{ color: 'var(--text3)', width: 80 }}>{e.created_at?.slice(0, 10)}</span><span className={`badge badge-${e.sentiment === 'positive' ? 'green' : e.sentiment === 'negative' ? 'red' : 'blue'}`}>{e.event_type}</span><span>{e.summary}</span></div>)}</div></>);
}

function QualityPage() {
  const { t } = useI18n();
  const [records, setRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  useEffect(() => { api.fetchQuality().then(d => setRecords(d.records || [])).catch(() => {}); api.fetchAlerts().then(d => setAlerts(d.alerts || [])).catch(() => {}); }, []);
  const sc = { minor: 'var(--accent)', medium: 'var(--yellow)', major: 'var(--orange)', critical: 'var(--red)' };
  return (<><h2 className="page-title">{t('qual.title')}</h2><p className="page-sub">{t('qual.sub')}</p><div className="grid-2"><div className="panel"><div className="panel-title">Quality Issues ({records.length})</div>{records.length ? records.map(r => <div key={r.id} className="card" style={{ marginBottom: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{r.record_key}</strong><span className="badge" style={{ background: `${sc[r.severity]}22`, color: sc[r.severity] }}>{r.severity}</span></div><div style={{ fontSize: '.82rem' }}>Supplier #{r.supplier_id} — {r.issue_type}</div><div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{r.description?.slice(0, 100)}</div></div>) : <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No issues</div>}</div><div className="panel"><div className="panel-title">Risk Alerts ({alerts.length})</div>{alerts.length ? alerts.map(a => <div key={a.id} className="card" style={{ marginBottom: 8, borderLeft: `3px solid ${sc[a.severity] || 'var(--text3)'}` }}><strong>{a.title || a.alert_key}</strong><div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{a.risk_type} · {a.entity_type} #{a.entity_id}</div><div style={{ fontSize: '.82rem' }}>{a.description?.slice(0, 120)}</div>{a.recommendation && <div style={{ fontSize: '.82rem', color: 'var(--green)', marginTop: 4 }}>{a.recommendation.slice(0, 80)}</div>}</div>) : <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No alerts</div>}</div></div></>);
}

function ProcurementPage() {
  const { t } = useI18n();
  const [projects, setProjects] = useState([]);
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  useEffect(() => { api.fetchProcProjects().then(d => setProjects(d.projects || [])).catch(() => {}); }, []);
  useEffect(() => { if (sel) api.fetchProcProject(sel).then(setDetail).catch(() => {}); }, [sel]);
  const sc = { planning: 'var(--accent)', in_progress: 'var(--yellow)', completed: 'var(--green)', blocked: 'var(--red)' };
  return (<><h2 className="page-title">{t('proc.title')}</h2><p className="page-sub">{t('proc.sub')}</p><div className="grid-sidebar"><div className="panel"><div className="panel-title">Projects</div>{projects.map(p => <div key={p.id} className={`card ${sel === p.id ? 'active' : ''}`} style={{ cursor: 'pointer', marginBottom: 6 }} onClick={() => setSel(p.id)}><strong>{p.name}</strong><div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{p.total_items} items · {p.total_suppliers} suppliers</div><div className="progress" style={{ marginTop: 4 }}><div className="progress-fill" style={{ width: `${p.overall_progress_pct}%`, background: sc[p.status] || 'var(--accent)' }} /></div></div>)}{!projects.length && <div style={{ padding: 20, color: 'var(--text3)', textAlign: 'center' }}>No projects</div>}</div><div className="panel">{detail ? (<><h3>{detail.name}</h3><div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: '.85rem' }}><span>Budget: ${detail.total_budget_usd}</span><span>Actual: ${detail.actual_spend_usd}</span><span style={{ color: sc[detail.status], fontWeight: 600 }}>{detail.status}</span></div>{detail.lines?.length > 0 && <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['BOM','Supplier','Qty','Total $','Status','Progress'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead><tbody>{detail.lines.map(l => <tr key={l.id}><td className="td">#{l.bom_item_id}</td><td className="td">#{l.supplier_id}</td><td className="td">{l.quantity}</td><td className="td">${l.total_usd}</td><td className="td"><span className={`badge badge-${l.status === 'received' ? 'green' : l.status === 'issue' ? 'red' : 'blue'}`}>{l.status}</span></td><td className="td"><div className="progress"><div className="progress-fill" style={{ width: `${l.progress_pct}%`, background: 'var(--accent)' }} /></div></td></tr>)}</tbody></table>}</>) : <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Select a project</div>}</div></div></>);
}

function IntelligencePage() {
  const { t } = useI18n();
  const [bench, setBench] = useState([]);
  const [rel, setRel] = useState([]);
  useEffect(() => { api.fetchPriceBenchmarks().then(d => setBench(d.benchmarks || [])).catch(() => {}); api.fetchReliability().then(d => setRel(d.reliability || [])).catch(() => {}); }, []);
  return (<><h2 className="page-title">{t('intel.title')}</h2><p className="page-sub">{t('intel.sub')}</p><div className="grid-2"><div className="panel"><div className="panel-title">Price Benchmarks</div>{bench.length ? <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['Category','Avg $','Min','Max','Samples'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead><tbody>{bench.map(b => <tr key={b.id}><td className="td" style={{ fontWeight: 600 }}>{b.part_category}</td><td className="td">${b.avg_price_usd?.toFixed(2)}</td><td className="td" style={{ color: 'var(--green)' }}>${b.min_price_usd?.toFixed(2)}</td><td className="td" style={{ color: 'var(--red)' }}>${b.max_price_usd?.toFixed(2)}</td><td className="td">{b.sample_count}</td></tr>)}</tbody></table> : <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>Accumulates from RFQ quotes</div>}</div><div className="panel"><div className="panel-title">Supplier Reliability</div>{rel.length ? <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['Supplier','Orders','On-time','Delay','Quality','Comm'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead><tbody>{rel.map(r => <tr key={r.id}><td className="td">#{r.supplier_id}</td><td className="td">{r.total_orders}</td><td className="td" style={{ color: r.on_time_rate >= .9 ? 'var(--green)' : 'var(--yellow)' }}>{(r.on_time_rate * 100).toFixed(0)}%</td><td className="td">{r.avg_delay_days}d</td><td className="td" style={{ color: r.quality_pass_rate >= .95 ? 'var(--green)' : 'var(--yellow)' }}>{(r.quality_pass_rate * 100).toFixed(0)}%</td><td className="td">{r.communication_score?.toFixed(1)}/5</td></tr>)}</tbody></table> : <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>Builds from order & quality data</div>}</div></div></>);
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKETPLACE
// ═══════════════════════════════════════════════════════════════════════════

function MarketplacePage() {
  const { t } = useI18n();
  const [role, setRole] = useState('buyer');
  const [chatInput, setChatInput] = useState('');
  const [parsed, setParsed] = useState(null);
  const [requests, setRequests] = useState([]);
  const [listings, setListings] = useState([]);
  const [matches, setMatches] = useState(null);

  useEffect(() => {
    api.fetchBuyerRequests().then(d => setRequests(d.requests || [])).catch(() => {});
    api.fetchListings().then(d => setListings(d.listings || [])).catch(() => {});
  }, []);

  const handleParse = async () => { if (!chatInput.trim()) return; setParsed(await api.aiParse(chatInput)); };
  const handleConfirm = async () => {
    const r = await api.createBuyerRequest({ input_mode: 'chat', raw_input: chatInput });
    setParsed(null); setChatInput('');
    api.fetchBuyerRequests().then(d => setRequests(d.requests || []));
    setMatches(await api.matchListings(r.id));
  };

  return (
    <>
      <h2 className="page-title">{t('mp.title')}</h2>
      <p className="page-sub">{t('mp.sub')}</p>

      <div style={{ display: 'flex', gap: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, width: 'fit-content', marginBottom: 20 }}>
        {['buyer', 'seller'].map(r => <button key={r} onClick={() => setRole(r)} style={{ padding: '10px 28px', border: 'none', background: role === r ? 'var(--accent)' : 'none', color: role === r ? '#fff' : 'var(--text2)', cursor: 'pointer', borderRadius: 10, fontWeight: role === r ? 600 : 400 }}>{r === 'buyer' ? `🛒 ${t('mp.buyer')}` : `🏪 ${t('mp.seller')}`}</button>)}
      </div>

      {role === 'buyer' && (<>
        <div className="ai-bar">
          <input className="ai-input" placeholder={t('mp.placeholder')} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleParse()} />
          <button className="ai-send" onClick={handleParse}>{t('mp.parse')}</button>
        </div>
        {parsed && (
          <div className="parse-preview">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--purple)' }}>Parsed (confidence: {((parsed.ai_parse_confidence || 0) * 100).toFixed(0)}%)</span>
              <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-secondary" onClick={() => setParsed(null)}>{t('mp.discard')}</button><button className="btn btn-primary" onClick={handleConfirm}>{t('mp.confirm')}</button></div>
            </div>
            <div className="parse-grid">
              <div className="parse-field"><div className="parse-label">Title</div><div>{parsed.parsed_title || '—'}</div></div>
              <div className="parse-field"><div className="parse-label">Category</div><div>{parsed.parsed_category}</div></div>
              <div className="parse-field"><div className="parse-label">Quantity</div><div>{parsed.parsed_quantity}</div></div>
              <div className="parse-field"><div className="parse-label">Budget</div><div>{parsed.parsed_budget_usd ? `$${parsed.parsed_budget_usd}` : '—'}</div></div>
            </div>
          </div>
        )}
        {matches?.matches?.length > 0 && <div className="panel"><div className="panel-title">Matched Listings ({matches.matches.length})</div>{matches.matches.map(m => <div key={m.listing_id} className="card" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}><div><strong>{m.title}</strong><div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{m.seller_name} · ${m.unit_price_usd}/unit · MOQ: {m.moq} · {m.lead_time_days}d</div></div><div style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, background: `${m.match_score >= 70 ? 'var(--green)' : 'var(--yellow)'}22`, color: m.match_score >= 70 ? 'var(--green)' : 'var(--yellow)' }}>{m.match_score}</div></div>)}</div>}
        <div className="panel"><div className="panel-title">My Requests ({requests.length})</div>{requests.length ? <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['Title','Mode','Category','Qty','Budget','Confidence','Status'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead><tbody>{requests.map(r => <tr key={r.id}><td className="td" style={{ fontWeight: 600 }}>{r.parsed_title || r.raw_input?.slice(0, 40)}</td><td className="td"><span className="badge badge-blue">{r.input_mode}</span></td><td className="td">{r.parsed_category}</td><td className="td">{r.parsed_quantity}</td><td className="td">{r.parsed_budget_usd ? `$${r.parsed_budget_usd}` : '—'}</td><td className="td" style={{ color: r.ai_parse_confidence >= .8 ? 'var(--green)' : 'var(--yellow)' }}>{(r.ai_parse_confidence * 100).toFixed(0)}%</td><td className="td"><span className="badge badge-blue">{r.status}</span></td></tr>)}</tbody></table> : <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>Use the AI chat above to submit your first request</div>}</div>
      </>)}

      {role === 'seller' && (<div className="panel"><div className="panel-title">Listings ({listings.length})</div><div className="grid-3">{listings.map(l => <div key={l.id} className="card"><strong>{l.title}</strong><div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{l.category} · MOQ: {l.moq} · {l.lead_time_days}d</div><div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--green)', marginTop: 4 }}>${l.unit_price_usd}/unit</div><div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: 4 }}>{l.seller_company || l.seller_name} · {l.location}</div></div>)}</div>{!listings.length && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No listings yet</div>}</div>)}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════════════════════════════════════

const INLINE_PAGES = { dashboard: DashboardPage, expert: ExpertPage, bom: BOMPage, rfq: RFQPage, suppliers: SuppliersPage, relationships: RelationshipsPage, quality: QualityPage, procurement: ProcurementPage, intelligence: IntelligencePage, marketplace: MarketplacePage };
const LAZY_PAGES = { launchpad: LaunchpadPage, quick_start: QuickStartPage, confidence: ConfidencePage, negotiation: NegotiationPage, milestones: MilestonePage, verification: VerificationPage, orders: OrderTrackingPage, browser: BrowserAgentPage, graph: SupplyGraphPage, trust: TrustScorePage, agency: AgencyPage, compliance: CompliancePage, credit: CreditPage, portal: CustomerPortalPage, flywheel: FlywheelPage, fulfillment: FulfillmentPage, payments: PaymentsPage, revenue: RevenuePage, org: OrgManagementPage, roles: RolesPermissionsPage, account: AccountPage, crawler: CrawlerPage, requests: RequestsPage, timeline: TimelinePage, eda_hub: EdaDesignHub, schematic: SchematicEditor, pcb_layout: PcbLayoutEditor, gerber_view: GerberPreview, pcb_order: PcbOrderPage, parts_catalog: PartsCatalogPage, humanoid_atlas: HumanoidAtlasPage, supply_tree: SupplyTreePage, cad_design: CADDesignPage, design_to_quote: DesignToQuotePage, design_templates: DesignTemplatesPage, mes_workbench: MESWorkbenchPage, traceability: TraceabilityPage, ai_analytics: AIAnalyticsPage, logistics: LogisticsPage, auto_neg: AutoNegPage, project_workspace: ProjectWorkspacePage, product_wizard: ProductWizardPage, component_search: ComponentSearchPage, market_intel: MarketIntelligencePage, compliance_guide: ComplianceGuidePage, prototype_bundle: PrototypeBundlePage, platform_intel: PlatformIntelPage, infra_hub: InfraHubPage, revenue_os: RevenueOSPage, geointel: GeoIntelPage, aps_simulation: APSSimulationPage, buyer_schedule: BuyerSchedulePage };

function Loading() { return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Loading...</div>; }

function AppShell() {
  const { user, org, roleMeta, hasAccess, logout } = useAuth();
  const { t, lang, toggleLang } = useI18n();
  const [page, setPage] = useState('launchpad');
  const [agentOpen, setAgentOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    const init = {};
    NAV_DEF.forEach(g => { if (g.collapsed) init[g.groupKey] = true; });
    return init;
  });

  if (!user) return <Suspense fallback={<Loading />}><LoginPage /></Suspense>;

  const toggleGroup = (key) => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const sq = navSearch.toLowerCase();
  const filteredNav = NAV_DEF.map(g => {
    const items = g.items.filter(i => hasAccess(i.id)).map(i => ({ ...i, label: t(i.labelKey) }));
    const filtered = sq ? items.filter(i => i.label.toLowerCase().includes(sq) || i.id.includes(sq)) : items;
    return { groupKey: g.groupKey, group: t(g.groupKey), items: filtered, isCollapsed: sq ? false : !!collapsedGroups[g.groupKey] };
  }).filter(g => g.items.length > 0);

  const handleNav = (id) => { setPage(id); setNavSearch(''); };

  const InlinePage = INLINE_PAGES[page];
  const LazyPage = LAZY_PAGES[page];
  const needsOnNavigate = page === 'launchpad' || page === 'quick_start';

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ cursor: 'pointer' }} onClick={() => setPage('launchpad')}>{t('app.name')}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <NotificationCenter onNavigate={setPage} />
              <button onClick={toggleLang} style={{
                background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
                padding: '2px 8px', fontSize: '.72rem', color: 'var(--accent)', cursor: 'pointer', fontWeight: 700,
              }}>{lang === 'en' ? '中文' : 'EN'}</button>
            </div>
          </div>
          <p>{t('app.sub')}</p>
        </div>
        <div style={{ padding: '0 12px 10px' }}>
          <input value={navSearch} onChange={e => setNavSearch(e.target.value)}
            placeholder={lang === 'zh' ? '搜索功能...' : 'Search...'}
            style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', color: 'var(--text)', fontSize: '.82rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ padding: '0 12px 14px', marginBottom: 6, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 8, background: 'var(--bg)', cursor: 'pointer' }} onClick={() => setPage('account')}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${roleMeta.color}22`, color: roleMeta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.75rem', flexShrink: 0 }}>{user.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: '.68rem', color: roleMeta.color }}>{roleMeta.label}</div>
            </div>
          </div>
          {org && <div style={{ fontSize: '.72rem', color: 'var(--text3)', padding: '4px 8px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.name}</div>}
        </div>
        {filteredNav.map(g => (
          <div key={g.groupKey} className="nav-group">
            <div className="nav-group-label" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }} onClick={() => toggleGroup(g.groupKey)}>
              <span>{g.group}</span>
              <span style={{ fontSize: 10, color: 'var(--text3)', transition: 'transform .2s', transform: g.isCollapsed ? 'rotate(-90deg)' : 'none' }}>▼</span>
            </div>
            {!g.isCollapsed && g.items.map(i => (
              <div key={i.id} className={`nav-item ${page === i.id ? 'active' : ''}`} onClick={() => handleNav(i.id)}>
                <span className="nav-icon">{i.icon}</span> {i.label}
              </div>
            ))}
          </div>
        ))}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <button className="btn btn-secondary" style={{ width: '100%', fontSize: '.8rem' }} onClick={logout}>{t('app.signout')}</button>
        </div>
      </aside>
      <main className="main">
        {InlinePage ? <InlinePage /> : LazyPage ? (
          <Suspense fallback={<Loading />}>
            {needsOnNavigate ? <LazyPage onNavigate={handleNav} /> : <LazyPage />}
          </Suspense>
        ) : <Suspense fallback={<Loading />}><LaunchpadPage onNavigate={handleNav} /></Suspense>}
      </main>
      <AgentBar collapsed={!agentOpen} onToggle={() => setAgentOpen(!agentOpen)} onNavigate={setPage} />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </I18nProvider>
  );
}
