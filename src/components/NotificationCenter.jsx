import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const CATEGORY_ICONS = {
  order: '📦', negotiation: '🤝', logistics: '🚚',
  quality: '🔍', payment: '💰', system: '⚙️',
  approval: '✅', alert: '🔔',
};

const PRIORITY_COLORS = {
  low: '#6b7280', normal: '#3b82f6', high: '#f59e0b', urgent: '#ef4444',
};

export default function NotificationCenter({ onNavigate }) {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [prefOpen, setPrefOpen] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const ref = useRef(null);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const params = { limit: 50 };
      if (tab === 'unread') params.unread_only = true;
      else if (tab !== 'all') params.category = tab;
      const res = await api.fetchNotifications(params);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch { /* ignore */ }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    pollRef.current = setInterval(load, 15000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRead = async (id) => {
    await api.markNotifRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleReadAll = async () => {
    await api.markAllNotifRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const loadPrefs = async () => {
    const res = await api.fetchNotifPreferences();
    setPrefs(res);
    setPrefOpen(true);
  };

  const savePrefs = async (field, value) => {
    const update = { user_id: 'default', [field]: value };
    await api.updateNotifPreferences(update);
    setPrefs(prev => ({ ...prev, categories: { ...prev?.categories, ...(typeof value === 'boolean' ? { [field.replace('_enabled', '')]: value } : {}) } }));
  };

  const TABS = [
    { key: 'all', label: lang === 'zh' ? '全部' : 'All' },
    { key: 'unread', label: lang === 'zh' ? '未读' : 'Unread' },
    { key: 'order', label: '📦' },
    { key: 'negotiation', label: '🤝' },
    { key: 'logistics', label: '🚚' },
    { key: 'payment', label: '💰' },
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button onClick={() => setOpen(!open)} style={{
        background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
        fontSize: '1.2rem', padding: '4px 8px', color: 'var(--text2)',
      }}>
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 2, background: '#ef4444',
            color: '#fff', fontSize: '.6rem', fontWeight: 700, borderRadius: 8,
            padding: '1px 5px', minWidth: 14, textAlign: 'center',
          }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, width: 400, maxHeight: 520,
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,.3)', zIndex: 300, display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '.88rem' }}>
              {lang === 'zh' ? '通知中心' : 'Notifications'}
              {unreadCount > 0 && <span style={{ color: '#ef4444', marginLeft: 6 }}>({unreadCount})</span>}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleReadAll} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '.72rem' }}>
                {lang === 'zh' ? '全部已读' : 'Read all'}
              </button>
              <button onClick={loadPrefs} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '.72rem' }}>⚙️</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, padding: '6px 10px', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '3px 8px', borderRadius: 6, border: 'none', fontSize: '.72rem',
                background: tab === t.key ? 'rgba(59,130,246,.15)' : 'transparent',
                color: tab === t.key ? 'var(--accent)' : 'var(--text3)',
                cursor: 'pointer', fontWeight: tab === t.key ? 600 : 400, whiteSpace: 'nowrap',
              }}>{t.label}</button>
            ))}
          </div>

          {/* Preferences panel */}
          {prefOpen && prefs && (
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'rgba(59,130,246,.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: '.8rem' }}>{lang === 'zh' ? '通知设置' : 'Settings'}</span>
                <button onClick={() => setPrefOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>✕</button>
              </div>
              <div style={{ fontSize: '.75rem' }}>
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text3)' }}>{lang === 'zh' ? '分类通知开关' : 'Category toggles'}</div>
                {Object.entries(prefs.categories || {}).map(([k, v]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', cursor: 'pointer' }}>
                    <input type="checkbox" checked={v} onChange={(e) => savePrefs(`${k}_enabled`, e.target.checked)} />
                    <span>{CATEGORY_ICONS[k] || '📋'} {k}</span>
                  </label>
                ))}
                <div style={{ fontWeight: 600, marginTop: 8, marginBottom: 4, color: 'var(--text3)' }}>{lang === 'zh' ? '渠道集成状态' : 'Channel status'}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {['wechat', 'feishu', 'email', 'webhook'].map(ch => (
                    <span key={ch} style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: '.68rem',
                      background: prefs.integrations?.[ch] ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)',
                      color: prefs.integrations?.[ch] ? '#22c55e' : '#ef4444',
                    }}>
                      {ch}: {prefs.integrations?.[ch] ? '✓' : '✗'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notification list */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {notifications.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: '.82rem' }}>
                {lang === 'zh' ? '暂无通知' : 'No notifications'}
              </div>
            )}
            {notifications.map(n => (
              <div key={n.id} onClick={() => !n.read && handleRead(n.id)} style={{
                padding: '10px 14px', borderBottom: '1px solid var(--border)',
                background: n.read ? 'transparent' : 'rgba(59,130,246,.03)',
                cursor: 'pointer', transition: 'background .15s',
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', marginTop: 2 }}>{CATEGORY_ICONS[n.category] || '📋'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: n.read ? 400 : 700, fontSize: '.8rem' }}>{n.title}</span>
                      <span style={{ fontSize: '.64rem', color: 'var(--text3)' }}>
                        {n.created_at?.slice(11, 16)}
                      </span>
                    </div>
                    <div style={{ fontSize: '.74rem', color: 'var(--text2)', marginTop: 2, lineHeight: 1.4 }}>
                      {n.body?.slice(0, 100)}{n.body?.length > 100 ? '...' : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <span style={{
                        padding: '1px 6px', borderRadius: 3, fontSize: '.62rem',
                        background: `${PRIORITY_COLORS[n.priority] || '#6b7280'}15`,
                        color: PRIORITY_COLORS[n.priority] || '#6b7280',
                      }}>{n.priority}</span>
                      {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', marginTop: 3 }} />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
