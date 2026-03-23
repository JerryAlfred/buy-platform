import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const STATUS_COLORS = { planned: '#3b82f6', in_progress: '#f59e0b', completed: '#22c55e', idle: '#6b7280', maintenance: '#ef4444', active: '#22c55e' };
const PRIORITY_COLORS = { urgent: '#ef4444', high: '#f59e0b', normal: '#3b82f6', low: '#6b7280' };

export default function MESWorkbenchPage() {
  const { lang } = useI18n();
  const [tab, setTab] = useState('dashboard');
  const [dash, setDash] = useState(null);
  const [factories, setFactories] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [quality, setQuality] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(0);
  const [showModal, setShowModal] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    const fp = selectedFactory ? { factory_id: selectedFactory } : {};
    try { setDash(await api.fetchMesDashboard(fp)); } catch {}
    try { setFactories(await api.fetchMesFactories()); } catch {}
    try { setWorkOrders(await api.fetchMesWorkOrders(fp)); } catch {}
    try { setInventory(await api.fetchMesInventory(fp)); } catch {}
    try { setQuality(await api.fetchMesQuality(fp)); } catch {}
    try { setSchedules(await api.fetchMesSchedules(fp)); } catch {}
    try { setEvents(await api.fetchMesEvents(fp)); } catch {}
  }, [selectedFactory]);

  useEffect(() => { load(); }, [load]);

  const submit = async (type) => {
    try {
      if (type === 'factory') await api.createMesFactory(form);
      if (type === 'work_order') await api.createMesWorkOrder({ ...form, factory_id: selectedFactory || form.factory_id });
      if (type === 'inventory') await api.createMesInventory({ ...form, factory_id: selectedFactory || form.factory_id });
      if (type === 'quality') await api.createMesQuality({ ...form, factory_id: selectedFactory || form.factory_id });
      setShowModal(null); setForm({}); load();
    } catch {}
  };

  const TABS = [
    { id: 'dashboard', label: lang === 'zh' ? '📊 总览' : '📊 Dashboard' },
    { id: 'work_orders', label: lang === 'zh' ? '🔧 工单' : '🔧 Work Orders' },
    { id: 'inventory', label: lang === 'zh' ? '📦 库存' : '📦 Inventory' },
    { id: 'quality', label: lang === 'zh' ? '✅ 质检' : '✅ Quality' },
    { id: 'schedule', label: lang === 'zh' ? '📅 排产' : '📅 Schedule' },
    { id: 'events', label: lang === 'zh' ? '📜 事件流' : '📜 Events' },
  ];

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? '☁️ 云 MES 工作台' : '☁️ Cloud MES Workbench'}</h2>
      <p className="page-sub">{lang === 'zh' ? '供应商生产管理 · 排产 · 库存 · 质检 · 全流程追溯' : 'Supplier production management · Scheduling · Inventory · Quality · Full traceability'}</p>

      {/* Factory Selector */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={selectedFactory} onChange={e => setSelectedFactory(+e.target.value)} style={{ padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '.85rem' }}>
          <option value={0}>{lang === 'zh' ? '全部工厂' : 'All Factories'}</option>
          {factories.map(f => <option key={f.id} value={f.id}>{f.name} ({f.factory_key})</option>)}
        </select>
        <button onClick={() => { setShowModal('factory'); setForm({}); }} className="btn-accent" style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '.82rem' }}>
          {lang === 'zh' ? '+ 注册工厂' : '+ Register Factory'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '7px 14px', borderRadius: 8, border: tab === t.id ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: tab === t.id ? 'rgba(59,130,246,.1)' : 'var(--bg)', color: tab === t.id ? 'var(--accent)' : 'var(--text3)',
            cursor: 'pointer', fontSize: '.82rem', fontWeight: tab === t.id ? 600 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && dash && (
        <div className="kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { l: lang === 'zh' ? '工厂' : 'Factories', v: dash.factories, c: 'var(--accent)' },
            { l: lang === 'zh' ? '活跃工单' : 'Active WO', v: dash.work_orders?.active || 0, c: 'var(--yellow)' },
            { l: lang === 'zh' ? '完成工单' : 'Completed WO', v: dash.work_orders?.completed || 0, c: 'var(--green)' },
            { l: lang === 'zh' ? '库存品类' : 'Inventory Items', v: dash.inventory?.total_items || 0, c: 'var(--purple)' },
            { l: lang === 'zh' ? '低库存预警' : 'Low Stock Alerts', v: dash.inventory?.low_stock_alerts || 0, c: '#ef4444' },
            { l: lang === 'zh' ? '良率' : 'Pass Rate', v: `${dash.quality?.pass_rate || 0}%`, c: 'var(--green)' },
            { l: lang === 'zh' ? '产能利用率' : 'Avg Utilization', v: `${dash.production_lines?.avg_utilization || 0}%`, c: 'var(--accent)' },
            { l: lang === 'zh' ? '产线' : 'Lines', v: dash.production_lines?.total || 0, c: 'var(--text2)' },
          ].map(k => (
            <div key={k.l} style={{ padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: 4 }}>{k.l}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: k.c }}>{k.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Work Orders */}
      {tab === 'work_orders' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>{lang === 'zh' ? '工单列表' : 'Work Orders'}</span>
            <button onClick={() => { setShowModal('work_order'); setForm({ factory_id: selectedFactory }); }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '.8rem' }}>
              {lang === 'zh' ? '+ 新工单' : '+ New Work Order'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {workOrders.map(wo => (
              <div key={wo.id} style={{ padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{wo.wo_key}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 12, background: `${STATUS_COLORS[wo.status] || '#6b7280'}22`, color: STATUS_COLORS[wo.status], fontSize: '.72rem', fontWeight: 600 }}>{wo.status}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 12, background: `${PRIORITY_COLORS[wo.priority] || '#6b7280'}22`, color: PRIORITY_COLORS[wo.priority], fontSize: '.72rem' }}>{wo.priority}</span>
                  </div>
                  <span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{wo.created_at?.slice(0, 10)}</span>
                </div>
                <div style={{ fontSize: '.85rem', marginBottom: 6 }}>{wo.product}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${wo.progress}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width .3s' }} />
                  </div>
                  <span style={{ fontSize: '.78rem', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                    {wo.qty_completed}/{wo.qty_ordered} ({wo.progress}%)
                  </span>
                </div>
                {wo.stage && <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: 4 }}>{lang === 'zh' ? '阶段' : 'Stage'}: {wo.stage}</div>}
              </div>
            ))}
            {workOrders.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 24, fontSize: '.85rem' }}>{lang === 'zh' ? '暂无工单' : 'No work orders yet'}</div>}
          </div>
        </div>
      )}

      {/* Inventory */}
      {tab === 'inventory' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>{lang === 'zh' ? '库存管理' : 'Inventory'}</span>
            <button onClick={() => { setShowModal('inventory'); setForm({ factory_id: selectedFactory }); }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '.8rem' }}>
              {lang === 'zh' ? '+ 新物料' : '+ Add Item'}
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[lang === 'zh' ? 'SKU' : 'SKU', lang === 'zh' ? '名称' : 'Name', lang === 'zh' ? '类型' : 'Category', lang === 'zh' ? '数量' : 'Qty', lang === 'zh' ? '最低库存' : 'Min', lang === 'zh' ? '单价' : 'Unit Cost', lang === 'zh' ? '总价值' : 'Value', lang === 'zh' ? '状态' : 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: 'var(--text3)', fontWeight: 500, fontSize: '.75rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventory.map(i => (
                <tr key={i.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 6px', fontWeight: 600 }}>{i.sku}</td>
                  <td style={{ padding: '8px 6px' }}>{i.name}</td>
                  <td style={{ padding: '8px 6px' }}><span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,.08)', fontSize: '.72rem' }}>{i.category}</span></td>
                  <td style={{ padding: '8px 6px', fontWeight: 600, color: i.is_low ? '#ef4444' : 'var(--text)' }}>{i.quantity} {i.unit}</td>
                  <td style={{ padding: '8px 6px', color: 'var(--text3)' }}>{i.min_stock}</td>
                  <td style={{ padding: '8px 6px' }}>${i.unit_cost}</td>
                  <td style={{ padding: '8px 6px', fontWeight: 600 }}>${i.total_value}</td>
                  <td style={{ padding: '8px 6px' }}>
                    {i.is_low && <span style={{ color: '#ef4444', fontSize: '.75rem', fontWeight: 600 }}>⚠️ {lang === 'zh' ? '低库存' : 'Low'}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {inventory.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 24, fontSize: '.85rem' }}>{lang === 'zh' ? '暂无库存数据' : 'No inventory data'}</div>}
        </div>
      )}

      {/* Quality */}
      {tab === 'quality' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>{lang === 'zh' ? '质检记录' : 'Quality Inspections'}</span>
            <button onClick={() => { setShowModal('quality'); setForm({ factory_id: selectedFactory }); }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '.8rem' }}>
              {lang === 'zh' ? '+ 新质检' : '+ New Inspection'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quality.map(q => (
              <div key={q.id} style={{ padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '.85rem' }}>{q.inspection_key}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 12, background: q.result === 'pass' ? 'rgba(34,197,94,.1)' : q.result === 'fail' ? 'rgba(239,68,68,.1)' : 'rgba(245,158,11,.1)', color: q.result === 'pass' ? '#22c55e' : q.result === 'fail' ? '#ef4444' : '#f59e0b', fontSize: '.72rem', fontWeight: 600 }}>{q.result}</span>
                    <span style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{q.type}</span>
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>
                    {lang === 'zh' ? '抽样' : 'Sample'}: {q.sample_size} | {lang === 'zh' ? '通过' : 'Pass'}: {q.pass_count} | {lang === 'zh' ? '不合格' : 'Fail'}: {q.fail_count}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: q.result === 'pass' ? '#22c55e' : '#ef4444' }}>
                    {q.sample_size ? Math.round(q.pass_count / q.sample_size * 100) : 0}%
                  </div>
                  <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{q.created_at?.slice(0, 10)}</div>
                </div>
              </div>
            ))}
            {quality.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 24, fontSize: '.85rem' }}>{lang === 'zh' ? '暂无质检记录' : 'No inspections yet'}</div>}
          </div>
        </div>
      )}

      {/* Schedule */}
      {tab === 'schedule' && (
        <div>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: 12 }}>{lang === 'zh' ? '排产计划 (APS)' : 'Production Schedule (APS)'}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {schedules.map(s => (
              <div key={s.id} style={{ padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.82rem' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{s.date}</span>
                  <span style={{ color: 'var(--text3)', marginLeft: 8 }}>{s.shift}</span>
                  {s.work_order_id > 0 && <span style={{ color: 'var(--accent)', marginLeft: 8 }}>WO #{s.work_order_id}</span>}
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span>{lang === 'zh' ? '计划' : 'Plan'}: {s.planned_qty}</span>
                  <span>{lang === 'zh' ? '实际' : 'Actual'}: {s.actual_qty}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 12, background: `${STATUS_COLORS[s.status] || '#6b7280'}22`, color: STATUS_COLORS[s.status], fontSize: '.72rem' }}>{s.status}</span>
                </div>
              </div>
            ))}
            {schedules.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 24, fontSize: '.85rem' }}>{lang === 'zh' ? '暂无排产数据' : 'No schedules yet'}</div>}
          </div>
        </div>
      )}

      {/* Events */}
      {tab === 'events' && (
        <div>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: 12 }}>{lang === 'zh' ? '事件流（全追溯）' : 'Event Stream (Full Traceability)'}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {events.map(e => (
              <div key={e.id} style={{ padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.82rem', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>[{e.type}]</span>
                  <span style={{ marginLeft: 8 }}>{e.summary}</span>
                </div>
                <span style={{ color: 'var(--text3)', fontSize: '.72rem', whiteSpace: 'nowrap' }}>{e.created_at?.slice(0, 16).replace('T', ' ')}</span>
              </div>
            ))}
            {events.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 24, fontSize: '.85rem' }}>{lang === 'zh' ? '暂无事件' : 'No events yet'}</div>}
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(null)}>
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, width: 420, maxWidth: '90vw', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>
              {showModal === 'factory' ? (lang === 'zh' ? '注册工厂' : 'Register Factory') :
               showModal === 'work_order' ? (lang === 'zh' ? '创建工单' : 'Create Work Order') :
               showModal === 'inventory' ? (lang === 'zh' ? '添加物料' : 'Add Inventory') :
               (lang === 'zh' ? '新增质检' : 'New Inspection')}
            </h3>
            {showModal === 'factory' && <>
              <input placeholder={lang === 'zh' ? '工厂名称' : 'Factory name'} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
              <input placeholder={lang === 'zh' ? '地址' : 'Location'} value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
              <input placeholder={lang === 'zh' ? '联系人' : 'Contact'} value={form.contact_name || ''} onChange={e => setForm({ ...form, contact_name: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
            </>}
            {showModal === 'work_order' && <>
              <input placeholder={lang === 'zh' ? '产品名称' : 'Product name'} value={form.product_name || ''} onChange={e => setForm({ ...form, product_name: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
              <input type="number" placeholder={lang === 'zh' ? '订单数量' : 'Quantity'} value={form.quantity_ordered || ''} onChange={e => setForm({ ...form, quantity_ordered: +e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
              <select value={form.priority || 'normal'} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }}>
                <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </>}
            {showModal === 'inventory' && <>
              <input placeholder="SKU" value={form.sku || ''} onChange={e => setForm({ ...form, sku: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
              <input placeholder={lang === 'zh' ? '名称' : 'Name'} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
              <input type="number" placeholder={lang === 'zh' ? '数量' : 'Quantity'} value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: +e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
              <input type="number" placeholder={lang === 'zh' ? '最低库存' : 'Min stock'} value={form.min_stock || ''} onChange={e => setForm({ ...form, min_stock: +e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
              <input type="number" step="0.01" placeholder={lang === 'zh' ? '单价($)' : 'Unit cost ($)'} value={form.unit_cost || ''} onChange={e => setForm({ ...form, unit_cost: +e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
            </>}
            {showModal === 'quality' && <>
              <input type="number" placeholder={lang === 'zh' ? '工单 ID' : 'Work Order ID'} value={form.work_order_id || ''} onChange={e => setForm({ ...form, work_order_id: +e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
              <input placeholder={lang === 'zh' ? '检验员' : 'Inspector'} value={form.inspector || ''} onChange={e => setForm({ ...form, inspector: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
              <input type="number" placeholder={lang === 'zh' ? '抽样数' : 'Sample size'} value={form.sample_size || ''} onChange={e => setForm({ ...form, sample_size: +e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
              <input type="number" placeholder={lang === 'zh' ? '合格数' : 'Pass count'} value={form.pass_count || ''} onChange={e => setForm({ ...form, pass_count: +e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
              <input type="number" placeholder={lang === 'zh' ? '不合格数' : 'Fail count'} value={form.fail_count || ''} onChange={e => setForm({ ...form, fail_count: +e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
            </>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text3)', cursor: 'pointer' }}>{lang === 'zh' ? '取消' : 'Cancel'}</button>
              <button onClick={() => submit(showModal)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>{lang === 'zh' ? '确认' : 'Submit'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
