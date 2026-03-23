import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const STATUS_COLORS = {
  pending: '#6b7280', created: '#3b82f6', in_transit: '#f59e0b',
  customs: '#a855f7', delivered: '#22c55e', delayed: '#ef4444',
  exception: '#ef4444', cancelled: '#6b7280',
};

const STATUS_LABELS = {
  zh: { pending: '待发货', created: '已创建', in_transit: '运输中', customs: '清关中', delivered: '已到货', delayed: '延迟', exception: '异常', cancelled: '已取消' },
  en: { pending: 'Pending', created: 'Created', in_transit: 'In Transit', customs: 'Customs', delivered: 'Delivered', delayed: 'Delayed', exception: 'Exception', cancelled: 'Cancelled' },
};

export default function LogisticsPage() {
  const { lang } = useI18n();
  const [tracking, setTracking] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ order_id: '', carrier: '', tracking_number: '', origin: '', destination: '', estimated_days: 30 });

  const load = useCallback(async () => {
    const [t, d] = await Promise.all([api.fetchLogistics(), api.fetchLogisticsDashboard()]);
    setTracking(t.tracking || []);
    setDashboard(d);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    await api.createLogistics({ ...form, order_id: parseInt(form.order_id) || 0 });
    setShowCreate(false);
    setForm({ order_id: '', carrier: '', tracking_number: '', origin: '', destination: '', estimated_days: 30 });
    load();
  };

  const handleUpdate = async (id, status, detail) => {
    await api.updateLogistics(id, { status, detail });
    load();
  };

  const selected = tracking.find(t => t.id === selectedId);
  const labels = STATUS_LABELS[lang] || STATUS_LABELS.en;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>🚚 {lang === 'zh' ? '物流跟踪中心' : 'Logistics Tracking Center'}</h2>
        <button onClick={() => setShowCreate(!showCreate)} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: 'linear-gradient(135deg,#3b82f6,#a855f7)', color: '#fff',
          fontWeight: 600, cursor: 'pointer',
        }}>+ {lang === 'zh' ? '新建物流单' : 'New Tracking'}</button>
      </div>

      {/* Dashboard cards */}
      {dashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: lang === 'zh' ? '总计' : 'Total', val: dashboard.total, color: '#3b82f6' },
            { label: lang === 'zh' ? '进行中' : 'Active', val: dashboard.active, color: '#f59e0b' },
            { label: lang === 'zh' ? '延迟' : 'Delayed', val: dashboard.delayed, color: '#ef4444' },
            { label: lang === 'zh' ? '已到货' : 'Delivered', val: dashboard.by_status?.delivered || 0, color: '#22c55e' },
          ].map((c, i) => (
            <div key={i} style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{c.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: c.color }}>{c.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div style={{ padding: 16, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { key: 'order_id', label: lang === 'zh' ? '订单ID' : 'Order ID', type: 'number' },
              { key: 'carrier', label: lang === 'zh' ? '物流公司' : 'Carrier' },
              { key: 'tracking_number', label: lang === 'zh' ? '运单号' : 'Tracking #' },
              { key: 'origin', label: lang === 'zh' ? '发货地' : 'Origin' },
              { key: 'destination', label: lang === 'zh' ? '目的地' : 'Destination' },
              { key: 'estimated_days', label: lang === 'zh' ? '预计天数' : 'Est. Days', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  type={f.type || 'text'} style={{
                    width: '100%', padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 6, color: 'var(--text)', fontSize: '.82rem', marginTop: 3,
                  }} />
              </div>
            ))}
          </div>
          <button onClick={handleCreate} style={{
            marginTop: 10, padding: '8px 20px', borderRadius: 8, border: 'none',
            background: '#22c55e', color: '#fff', fontWeight: 600, cursor: 'pointer',
          }}>{lang === 'zh' ? '创建' : 'Create'}</button>
        </div>
      )}

      {/* Tracking list + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div>
          {tracking.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', background: 'var(--card)', borderRadius: 10, border: '1px solid var(--border)' }}>
              {lang === 'zh' ? '暂无物流记录' : 'No tracking records'}
            </div>
          )}
          {tracking.map(t => (
            <div key={t.id} onClick={() => setSelectedId(t.id === selectedId ? null : t.id)} style={{
              padding: '12px 16px', background: 'var(--card)', border: `1px solid ${t.id === selectedId ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 10, marginBottom: 8, cursor: 'pointer', transition: 'border-color .15s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '.88rem' }}>#{t.order_id}</span>
                  <span style={{ color: 'var(--text3)', marginLeft: 8, fontSize: '.76rem' }}>{t.carrier} {t.tracking_number}</span>
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: '.68rem', fontWeight: 600,
                  background: `${STATUS_COLORS[t.status] || '#6b7280'}15`,
                  color: STATUS_COLORS[t.status] || '#6b7280',
                }}>{labels[t.status] || t.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--text3)', marginTop: 6 }}>
                <span>{t.origin} → {t.destination}</span>
                <span>{t.estimated_arrival ? `ETA: ${t.estimated_arrival.slice(0, 10)}` : ''}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ padding: 16, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <h3 style={{ margin: '0 0 12px' }}>📦 {lang === 'zh' ? '物流详情' : 'Tracking Detail'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '.8rem', marginBottom: 16 }}>
              <div><span style={{ color: 'var(--text3)' }}>{lang === 'zh' ? '运单号：' : 'Tracking: '}</span><b>{selected.tracking_number || '—'}</b></div>
              <div><span style={{ color: 'var(--text3)' }}>{lang === 'zh' ? '物流公司：' : 'Carrier: '}</span><b>{selected.carrier || '—'}</b></div>
              <div><span style={{ color: 'var(--text3)' }}>{lang === 'zh' ? '发货地：' : 'From: '}</span>{selected.origin}</div>
              <div><span style={{ color: 'var(--text3)' }}>{lang === 'zh' ? '目的地：' : 'To: '}</span>{selected.destination}</div>
              <div><span style={{ color: 'var(--text3)' }}>ETA: </span>{selected.estimated_arrival?.slice(0, 10) || '—'}</div>
              <div><span style={{ color: 'var(--text3)' }}>{lang === 'zh' ? '实际到货：' : 'Actual: '}</span>{selected.actual_arrival?.slice(0, 10) || '—'}</div>
            </div>

            {/* Quick status update */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {['in_transit', 'customs', 'delivered', 'delayed', 'exception'].map(s => (
                <button key={s} onClick={() => handleUpdate(selected.id, s, `Status updated to ${s}`)} style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
                  background: selected.status === s ? `${STATUS_COLORS[s]}15` : 'var(--bg)',
                  color: STATUS_COLORS[s] || 'var(--text2)', cursor: 'pointer', fontSize: '.72rem', fontWeight: 600,
                }}>{labels[s] || s}</button>
              ))}
            </div>

            {/* Events timeline */}
            <div style={{ fontWeight: 600, fontSize: '.8rem', marginBottom: 8 }}>
              {lang === 'zh' ? '📋 事件时间线' : '📋 Event Timeline'}
            </div>
            {(selected.events || []).map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? 'var(--accent)' : 'var(--border)' }} />
                  {i < (selected.events?.length || 0) - 1 && <div style={{ width: 1, flex: 1, background: 'var(--border)' }} />}
                </div>
                <div style={{ flex: 1, fontSize: '.76rem' }}>
                  <div style={{ fontWeight: 600 }}>{e.status}</div>
                  <div style={{ color: 'var(--text3)' }}>{e.detail}</div>
                  <div style={{ color: 'var(--text3)', fontSize: '.66rem' }}>{e.time?.slice(0, 19).replace('T', ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
