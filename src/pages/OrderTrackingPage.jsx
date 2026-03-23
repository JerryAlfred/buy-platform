import { useState, useEffect } from 'react';
import * as api from '../api';
import { useI18n } from '../i18n';

export default function OrderTrackingPage() {
  const { lang } = useI18n();
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    api.fetchOrders().then(d => setOrders(d.orders || [])).catch(() => showToast(lang === 'zh' ? '加载失败' : 'Failed to load'));
    api.fetchEvents({ entity_type: 'order', limit: 30 }).then(d => setEvents(d.events || [])).catch(() => {});
  }, [lang]);

  const statusIcon = { pending_approval: '⏳', approved: '✅', in_production: '🏭', shipped: '🚢', delivered: '📦', completed: '🎉', cancelled: '❌' };
  const overdue = orders.filter(o => o.expected_delivery && new Date(o.expected_delivery) < new Date() && o.status !== 'completed' && o.status !== 'delivered');

  const handleReminder = async (order) => {
    try {
      await api.createRequest({
        title: `Follow-up: ${order.po_key}`,
        description: `Overdue order follow-up. Expected: ${order.expected_delivery?.slice(0, 10)}. Supplier #${order.supplier_id}`,
        category: 'follow_up',
        quantity: 1,
        budget_usd: 0,
        priority: 'high',
      });
      showToast(lang === 'zh' ? '催单提醒已发送！' : 'Reminder sent!');
    } catch (e) {
      showToast(lang === 'zh' ? '发送失败' : 'Failed to send');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.approveOrder(id);
      showToast(lang === 'zh' ? '已批准' : 'Approved');
      const d = await api.fetchOrders();
      setOrders(d.orders || []);
    } catch (e) {
      showToast(lang === 'zh' ? '操作失败' : 'Action failed');
    }
  };

  return (
    <>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000, padding: '12px 24px', background: 'var(--green)', color: '#fff', borderRadius: 10, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>{toast}</div>}

      <h2 className="page-title">{lang === 'zh' ? '订单跟踪' : 'Order Tracking'}</h2>
      <p className="page-sub">{lang === 'zh' ? '物流追踪、延期预警、自动跟进提醒' : 'Shipment tracking, delay alerts, auto follow-up reminders'}</p>

      <div className="kpis">
        <div className="kpi"><div className="kpi-label">{lang === 'zh' ? '总订单' : 'Total Orders'}</div><div className="kpi-value">{orders.length}</div></div>
        <div className="kpi"><div className="kpi-label">{lang === 'zh' ? '待审批' : 'Pending Approval'}</div><div className="kpi-value" style={{ color: 'var(--yellow)' }}>{orders.filter(o => o.status === 'pending_approval').length}</div></div>
        <div className="kpi"><div className="kpi-label">{lang === 'zh' ? '生产中' : 'In Production'}</div><div className="kpi-value" style={{ color: 'var(--accent)' }}>{orders.filter(o => o.status === 'in_production' || o.status === 'approved').length}</div></div>
        <div className="kpi"><div className="kpi-label">{lang === 'zh' ? '已发货' : 'Shipped'}</div><div className="kpi-value" style={{ color: 'var(--purple)' }}>{orders.filter(o => o.status === 'shipped').length}</div></div>
        <div className="kpi"><div className="kpi-label">{lang === 'zh' ? '逾期' : 'Overdue'}</div><div className="kpi-value" style={{ color: 'var(--red)' }}>{overdue.length}</div></div>
      </div>

      {overdue.length > 0 && (
        <div className="panel" style={{ borderLeft: '4px solid var(--red)' }}>
          <div className="panel-title" style={{ color: 'var(--red)' }}>{lang === 'zh' ? '逾期订单 — 自动跟进已触发' : 'Overdue Orders — Auto Follow-up Triggered'}</div>
          {overdue.map(o => (
            <div key={o.id} className="card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>{o.po_key}</strong> · Supplier #{o.supplier_id} · Expected: {o.expected_delivery?.slice(0, 10)}</div>
              <button className="btn-sm" style={{ background: 'var(--red)', color: '#fff' }} onClick={() => handleReminder(o)}>{lang === 'zh' ? '发送催单' : 'Send Reminder'}</button>
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <div className="panel-title">{lang === 'zh' ? '所有订单' : 'All Orders'}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead><tr>{[lang === 'zh' ? 'PO #' : 'PO #', lang === 'zh' ? '供应商' : 'Supplier', lang === 'zh' ? '总额' : 'Total', lang === 'zh' ? '状态' : 'Status', lang === 'zh' ? '付款' : 'Payment', lang === 'zh' ? '物流' : 'Shipping', lang === 'zh' ? '运单号' : 'Tracking', lang === 'zh' ? '预计交付' : 'Expected', ''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>{orders.map(o => (<>
            <tr key={o.id} style={{ cursor: 'pointer', background: expanded === o.id ? 'rgba(59,130,246,.05)' : 'transparent' }} onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
              <td className="td" style={{ fontWeight: 600 }}>{o.po_key}</td>
              <td className="td">#{o.supplier_id}</td>
              <td className="td">${o.total_usd?.toFixed(2)}</td>
              <td className="td"><span style={{ fontSize: '1rem' }}>{statusIcon[o.status] || '❓'}</span> <span className="badge badge-blue">{o.status}</span></td>
              <td className="td"><span className={`badge badge-${o.payment_status === 'paid' ? 'green' : 'yellow'}`}>{o.payment_status || 'pending'}</span></td>
              <td className="td"><span className={`badge badge-${o.shipping_status === 'shipped' ? 'green' : 'blue'}`}>{o.shipping_status || 'pending'}</span></td>
              <td className="td" style={{ fontSize: '.82rem' }}>{o.tracking_number || '—'}</td>
              <td className="td" style={{ fontSize: '.82rem' }}>{o.expected_delivery?.slice(0, 10) || '—'}</td>
              <td className="td" style={{ display: 'flex', gap: 4 }}>
                {o.status === 'pending_approval' && <button className="btn-sm" onClick={(e) => { e.stopPropagation(); handleApprove(o.id); }}>{lang === 'zh' ? '批准' : 'Approve'}</button>}
                <span style={{ fontSize: '.72rem', color: 'var(--text3)', cursor: 'pointer' }}>{expanded === o.id ? '▲' : '▼'}</span>
              </td>
            </tr>
            {expanded === o.id && (
              <tr key={`${o.id}-detail`}>
                <td colSpan={9} className="td" style={{ background: 'rgba(59,130,246,.03)', padding: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: '.85rem' }}>
                    <div><span style={{ color: 'var(--text3)', fontSize: '.75rem' }}>{lang === 'zh' ? '创建时间' : 'Created'}</span><div>{o.created_at?.slice(0, 10) || '—'}</div></div>
                    <div><span style={{ color: 'var(--text3)', fontSize: '.75rem' }}>{lang === 'zh' ? '运单号' : 'Tracking'}</span><div>{o.tracking_number || '—'}</div></div>
                    <div><span style={{ color: 'var(--text3)', fontSize: '.75rem' }}>{lang === 'zh' ? '备注' : 'Notes'}</span><div>{o.notes || '—'}</div></div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                      <button className="btn-sm" onClick={(e) => { e.stopPropagation(); handleReminder(o); }}>{lang === 'zh' ? '发送催单' : 'Send Reminder'}</button>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </>))}</tbody>
        </table>
        {!orders.length && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>{lang === 'zh' ? '暂无订单' : 'No orders yet'}</div>}
      </div>

      <div className="panel">
        <div className="panel-title">{lang === 'zh' ? '自动跟进规则' : 'Auto Follow-up Rules'}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{[lang === 'zh' ? '触发条件' : 'Trigger', lang === 'zh' ? '动作' : 'Action', lang === 'zh' ? '渠道' : 'Channel'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {[
              { trigger: lang === 'zh' ? '询价3天未回复' : '3 days no reply after inquiry', action: lang === 'zh' ? '发送温和提醒' : 'Send gentle reminder', channel: 'Email / WeChat' },
              { trigger: lang === 'zh' ? '交货日期已过' : 'Delivery date passed', action: lang === 'zh' ? '询问发货更新 + 新 ETA' : 'Ask for shipping update + new ETA', channel: 'Email + Platform' },
              { trigger: lang === 'zh' ? '逾期7天' : '7 days overdue', action: lang === 'zh' ? '升级 — 标记风险预警' : 'Escalate — flag risk alert', channel: lang === 'zh' ? '全渠道' : 'All channels' },
              { trigger: lang === 'zh' ? '收到运单号' : 'Tracking number received', action: lang === 'zh' ? '自动更新物流状态' : 'Auto-update shipping status', channel: lang === 'zh' ? '系统' : 'System' },
              { trigger: lang === 'zh' ? '确认收货' : 'Delivery confirmed', action: lang === 'zh' ? '请求验收/质检' : 'Request inspection / quality check', channel: 'Platform' },
            ].map(r => (
              <tr key={r.trigger}>
                <td className="td" style={{ fontWeight: 600 }}>{r.trigger}</td>
                <td className="td">{r.action}</td>
                <td className="td"><span className="badge badge-blue">{r.channel}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {events.length > 0 && (
        <div className="panel">
          <div className="panel-title">{lang === 'zh' ? '最近订单事件' : 'Recent Order Events'}</div>
          {events.slice(0, 15).map(e => (
            <div key={e.id} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.85rem' }}>
              <span style={{ color: 'var(--text3)', minWidth: 80 }}>{e.created_at?.slice(0, 10)}</span>
              <span className="badge badge-blue">{e.type}</span>
              <span>{e.summary}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
