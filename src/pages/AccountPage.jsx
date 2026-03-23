import { useState } from 'react';
import { useAuth, ROLES } from '../auth';
import { useI18n } from '../i18n';

export default function AccountPage() {
  const { lang } = useI18n();
  const { user, org, roleMeta, logout, allOrgs } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '', timezone: 'America/Los_Angeles', language: 'en', notifications: { email: true, browser: true, slack: false } });
  const [showSessions, setShowSessions] = useState(false);

  if (!user) return null;

  const SESSIONS = [
    { device: 'Chrome on macOS', ip: '73.202.xx.xx', location: 'San Jose, CA', time: 'Active now', current: true },
    { device: 'Safari on iPhone', ip: '73.202.xx.xx', location: 'San Jose, CA', time: '2 hours ago', current: false },
    { device: 'Chrome on Windows', ip: '180.101.xx.xx', location: 'Shenzhen, CN', time: '3 days ago', current: false },
  ];

  const AUDIT = [
    { time: '10 min ago', action: 'Viewed Milestone Payments', ip: '73.202.xx.xx' },
    { time: '1 hour ago', action: 'Updated order #ORD-2024-015', ip: '73.202.xx.xx' },
    { time: '3 hours ago', action: 'Logged in via email', ip: '73.202.xx.xx' },
    { time: '1 day ago', action: 'Invited Emily Zhang', ip: '73.202.xx.xx' },
    { time: '2 days ago', action: 'Created RFQ for servo motors', ip: '73.202.xx.xx' },
  ];

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? '账户设置' : 'Account Settings'}</h2>
      <p className="page-sub">{lang === 'zh' ? '管理您的个人资料、安全和偏好设置' : 'Manage your profile, security, and preferences'}</p>

      <div className="grid-2">
        <div>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Profile</div>
              <button className="btn btn-primary" onClick={() => setEditMode(!editMode)}>
                {editMode ? 'Save' : 'Edit'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${roleMeta.color}22`, color: roleMeta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem', flexShrink: 0 }}>{user.avatar}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user.name}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--text2)' }}>{user.email}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <span className="badge" style={{ background: `${roleMeta.color}22`, color: roleMeta.color }}>{roleMeta.label}</span>
                  <span className="badge badge-blue">{org?.name}</span>
                </div>
              </div>
            </div>
            {editMode ? (
              <div>
                <div className="form-grid" style={{ marginBottom: 12 }}>
                  <div><label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Full Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Email</label><input className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div className="form-grid" style={{ marginBottom: 12 }}>
                  <div><label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 123-4567" /></div>
                  <div><label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Timezone</label>
                    <select className="select" style={{ width: '100%' }} value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })}>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="Asia/Shanghai">China Standard (CST)</option>
                      <option value="Asia/Tokyo">Japan (JST)</option>
                      <option value="Europe/Berlin">Central Europe (CET)</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { l: 'User ID', v: user.id },
                  { l: 'Role', v: roleMeta.label },
                  { l: 'Organization', v: org?.name },
                  { l: 'Org Type', v: org?.type },
                  { l: 'Status', v: user.status },
                  { l: 'Plan', v: org?.plan },
                ].map(f => (
                  <div key={f.l} style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 8 }}>
                    <div style={{ fontSize: '.68rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.4px' }}>{f.l}</div>
                    <div style={{ fontWeight: 600, marginTop: 2 }}>{f.v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-title" style={{ marginBottom: 12 }}>Notification Preferences</div>
            {[
              { key: 'email', label: 'Email Notifications', desc: 'Order updates, milestone alerts, inspection reports' },
              { key: 'browser', label: 'Browser Notifications', desc: 'Real-time alerts in browser' },
              { key: 'slack', label: 'Slack Integration', desc: 'Forward notifications to Slack channel' },
            ].map(n => (
              <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div><div style={{ fontWeight: 600, fontSize: '.88rem' }}>{n.label}</div><div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{n.desc}</div></div>
                <div onClick={() => setForm({ ...form, notifications: { ...form.notifications, [n.key]: !form.notifications[n.key] } })}
                  style={{ width: 44, height: 24, borderRadius: 12, background: form.notifications[n.key] ? 'var(--green)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: form.notifications[n.key] ? 22 : 2, transition: 'left .2s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Security</div>
            </div>
            <div className="card" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontWeight: 600 }}>Password</div><div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>Last changed 30 days ago</div></div>
              <button className="btn-sm">Change</button>
            </div>
            <div className="card" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontWeight: 600 }}>Two-Factor Auth</div><div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>TOTP authenticator app</div></div>
              <span className="badge badge-green">Enabled</span>
            </div>
            <div className="card" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontWeight: 600 }}>API Keys</div><div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>2 active keys</div></div>
              <button className="btn-sm">Manage</button>
            </div>
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontWeight: 600 }}>Active Sessions</div><div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{SESSIONS.length} devices</div></div>
              <button className="btn-sm" onClick={() => setShowSessions(!showSessions)}>{showSessions ? 'Hide' : 'View'}</button>
            </div>
            {showSessions && (
              <div style={{ marginTop: 12 }}>
                {SESSIONS.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < SESSIONS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: '.85rem', fontWeight: s.current ? 600 : 400 }}>{s.device} {s.current && <span className="badge badge-green" style={{ marginLeft: 6 }}>Current</span>}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{s.ip} · {s.location} · {s.time}</div>
                    </div>
                    {!s.current && <button className="btn-sm" style={{ color: 'var(--red)' }}>Revoke</button>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-title" style={{ marginBottom: 12 }}>Activity Log</div>
            {AUDIT.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < AUDIT.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: '.78rem', color: 'var(--text3)', minWidth: 80, flexShrink: 0 }}>{a.time}</div>
                <div style={{ fontSize: '.85rem', flex: 1 }}>{a.action}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{a.ip}</div>
              </div>
            ))}
          </div>

          <div className="panel" style={{ borderColor: 'rgba(239,68,68,.3)' }}>
            <div className="panel-title" style={{ color: 'var(--red)', marginBottom: 12 }}>Danger Zone</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontWeight: 600 }}>Sign Out</div><div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>End your current session</div></div>
              <button className="btn btn-primary" style={{ background: 'var(--red)' }} onClick={logout}>Sign Out</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
