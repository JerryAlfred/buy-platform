import { useState, useEffect } from 'react';
import * as api from '../api';
import { useI18n } from '../i18n';

const MILESTONES = [
  { key: 'deposit', label: 'Deposit', labelZh: '定金', pct: 30, icon: '💰' },
  { key: 'sample_complete', label: 'Sample Complete', labelZh: '样品完成', pct: 0, icon: '🧪' },
  { key: 'evt', label: 'EVT (Engineering Validation)', labelZh: 'EVT（工程验证）', pct: 0, icon: '⚙️' },
  { key: 'dvt', label: 'DVT (Design Validation)', labelZh: 'DVT（设计验证）', pct: 20, icon: '🔬' },
  { key: 'pvt', label: 'PVT (Production Validation)', labelZh: 'PVT（生产验证）', pct: 20, icon: '🏭' },
  { key: 'pre_shipment', label: 'Pre-Shipment Balance', labelZh: '发货前尾款', pct: 25, icon: '📦' },
  { key: 'delivery_accepted', label: 'Delivery Accepted', labelZh: '验收完成', pct: 5, icon: '✅' },
];

const STATUS_MAP = {
  pending_approval: 0,
  approved: 1,
  in_production: 2,
  shipped: 5,
  delivered: 6,
  completed: 6,
};

export default function MilestonePage() {
  const { lang } = useI18n();
  const [orders, setOrders] = useState([]);
  const [sel, setSel] = useState(null);
  const [toast, setToast] = useState('');
  const [releasing, setReleasing] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    api.fetchOrders().then(d => setOrders(d.orders || [])).catch(() => {
      showToast(lang === 'zh' ? '加载失败' : 'Failed to load orders');
    });
  }, [lang]);

  const selOrder = orders.find(o => o.id === sel);
  const completedIdx = selOrder ? (STATUS_MAP[selOrder.status] ?? 0) : 0;

  const handleVerifyRelease = async (milestoneIdx) => {
    if (!selOrder) return;
    setReleasing(milestoneIdx);
    try {
      if (selOrder.status === 'pending_approval') {
        await api.approveOrder(selOrder.id);
      }
      showToast(lang === 'zh'
        ? `已释放 ${MILESTONES[milestoneIdx].labelZh} 阶段付款`
        : `Released payment for ${MILESTONES[milestoneIdx].label}`
      );
      const d = await api.fetchOrders();
      setOrders(d.orders || []);
    } catch (e) {
      showToast(lang === 'zh' ? '操作失败' : 'Action failed');
    }
    setReleasing(null);
  };

  return (
    <>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000, padding: '12px 24px', background: 'var(--green)', color: '#fff', borderRadius: 10, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>{toast}</div>}

      <h2 className="page-title">{lang === 'zh' ? '里程碑付款' : 'Milestone Payments'}</h2>
      <p className="page-sub">{lang === 'zh' ? '阶段门控付款 — 定金、样品、EVT/DVT/PVT、发货、验收' : 'Stage-gated payment control — deposit, sample, EVT/DVT/PVT, shipment, acceptance'}</p>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-title">{lang === 'zh' ? '付款阶段模板' : 'Payment Stage Template'}</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          {MILESTONES.map((m, i) => (
            <div key={m.key} style={{ flex: m.pct || 1, position: 'relative' }}>
              <div style={{ height: 36, background: i < completedIdx ? 'var(--green)' : i === completedIdx && sel ? 'var(--accent)' : 'var(--border)', borderRadius: i === 0 ? '6px 0 0 6px' : i === MILESTONES.length - 1 ? '0 6px 6px 0' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 600, color: i <= completedIdx && sel ? '#fff' : 'var(--text3)', transition: 'background .3s' }}>
                {m.icon} {m.pct > 0 ? `${m.pct}%` : ''}
              </div>
              <div style={{ textAlign: 'center', fontSize: '.68rem', color: 'var(--text2)', marginTop: 4 }}>{lang === 'zh' ? m.labelZh : m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-sidebar">
        <div className="panel">
          <div className="panel-title">{lang === 'zh' ? '订单' : 'Orders'} ({orders.length})</div>
          {orders.map(o => (
            <div key={o.id} className={`card ${sel === o.id ? 'active' : ''}`} style={{ cursor: 'pointer', marginBottom: 6 }} onClick={() => setSel(o.id)}>
              <strong>{o.po_key}</strong>
              <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>${o.total_usd?.toFixed(2)} · Supplier #{o.supplier_id}</div>
              <span className={`badge badge-${o.status === 'approved' || o.status === 'completed' ? 'green' : o.status === 'pending_approval' ? 'yellow' : 'blue'}`}>{o.status}</span>
            </div>
          ))}
          {!orders.length && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)' }}>{lang === 'zh' ? '暂无订单' : 'No orders yet'}</div>}
        </div>

        <div className="panel">
          {selOrder ? (<>
            <h3>{selOrder.po_key}</h3>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: '.85rem', flexWrap: 'wrap' }}>
              <span>{lang === 'zh' ? '总额' : 'Total'}: <strong>${selOrder.total_usd?.toFixed(2)}</strong></span>
              <span>{lang === 'zh' ? '付款' : 'Payment'}: <span className={`badge badge-${selOrder.payment_status === 'paid' ? 'green' : 'yellow'}`}>{selOrder.payment_status || 'pending'}</span></span>
              <span>{lang === 'zh' ? '物流' : 'Shipping'}: <span className="badge badge-blue">{selOrder.shipping_status || 'pending'}</span></span>
            </div>
            <div className="panel-title" style={{ marginBottom: 12 }}>{lang === 'zh' ? '里程碑时间线' : 'Milestone Timeline'}</div>
            {MILESTONES.map((m, i) => {
              const done = i < completedIdx;
              const current = i === completedIdx;
              return (
                <div key={m.key} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'rgba(34,197,94,.15)' : current ? 'rgba(59,130,246,.15)' : 'var(--bg)', border: `2px solid ${done ? 'var(--green)' : current ? 'var(--accent)' : 'var(--border)'}`, fontSize: '1rem', flexShrink: 0 }}>{done ? '✓' : m.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '.88rem', color: done ? 'var(--green)' : current ? 'var(--accent)' : 'var(--text)' }}>{lang === 'zh' ? m.labelZh : m.label}</div>
                    {m.pct > 0 && <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{lang === 'zh' ? '释放' : 'Release'} {m.pct}% (${(selOrder.total_usd * m.pct / 100).toFixed(2)})</div>}
                    <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>
                      {done ? (lang === 'zh' ? '已完成' : 'Completed') : current ? (lang === 'zh' ? '当前阶段 — 等待验证' : 'Current stage — awaiting verification') : (lang === 'zh' ? '等待前置阶段完成' : 'Awaiting previous stages')}
                    </div>
                  </div>
                  <div>
                    {done ? <span className="badge badge-green">{lang === 'zh' ? '已释放' : 'Released'}</span> : (
                      <button className="btn-sm" disabled={!current || releasing !== null} onClick={() => handleVerifyRelease(i)} style={{ opacity: current ? 1 : 0.4, cursor: current ? 'pointer' : 'not-allowed' }}>
                        {releasing === i ? '...' : (lang === 'zh' ? '验证 & 释放' : 'Verify & Release')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>) : <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>{lang === 'zh' ? '选择一个订单来管理里程碑' : 'Select an order to manage milestones'}</div>}
        </div>
      </div>
    </>
  );
}
