import { useState } from 'react';
import { useAuth, DEMO_USERS, ROLES } from '../auth';
import { useI18n } from '../i18n';

export default function LoginPage() {
  const { lang } = useI18n();
  const { login, loginAs } = useAuth();
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [regForm, setRegForm] = useState({ name: '', email: '', company: '', type: 'buyer', password: '' });

  const handleLogin = (e) => {
    e.preventDefault();
    const result = login(email, password);
    if (!result.ok) setError(result.error);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('Registration submitted — pending approval');
  };

  const grouped = {};
  DEMO_USERS.forEach(u => {
    const r = ROLES[u.role];
    if (!grouped[u.role]) grouped[u.role] = { meta: r, users: [] };
    grouped[u.role].users.push(u);
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: 480, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg,#3b82f6,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            RobotBuy OS
          </h1>
          <p style={{ color: 'var(--text3)', marginTop: 4 }}>{lang === 'zh' ? '机器人供应链操作系统' : 'Robot Supply Chain Operating System'}</p>
        </div>

        <div className="panel">
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
            {['login', 'register', 'demo'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', color: tab === t ? 'var(--accent)' : 'var(--text3)', fontWeight: 600, cursor: 'pointer', fontSize: '.88rem', textTransform: 'capitalize' }}>
                {t === 'demo' ? 'Quick Demo' : t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {error && <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, color: 'var(--red)', fontSize: '.85rem', marginBottom: 16 }}>{error}</div>}

          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Email</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Password</label>
                <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
              </div>
              <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '12px' }}>Sign In</button>
              <p style={{ textAlign: 'center', marginTop: 12, fontSize: '.82rem', color: 'var(--text3)' }}>
                Demo mode — use any demo email, any password
              </p>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="form-grid" style={{ marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Full Name</label>
                  <input className="input" value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Email</label>
                  <input className="input" type="email" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} required />
                </div>
              </div>
              <div className="form-grid" style={{ marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Company</label>
                  <input className="input" value={regForm.company} onChange={e => setRegForm({ ...regForm, company: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>I am a</label>
                  <select className="select" style={{ width: '100%' }} value={regForm.type} onChange={e => setRegForm({ ...regForm, type: e.target.value })}>
                    <option value="buyer">Buyer — Purchasing Parts / Robots</option>
                    <option value="seller">Seller — Supplier / Factory</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Password</label>
                <input className="input" type="password" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} required />
              </div>
              <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '12px' }}>Create Account</button>
            </form>
          )}

          {tab === 'demo' && (
            <div>
              <p style={{ fontSize: '.85rem', color: 'var(--text2)', marginBottom: 16 }}>Click any user to log in instantly and see their role-specific view:</p>
              {Object.entries(grouped).map(([role, { meta, users }]) => (
                <div key={role} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="badge" style={{ background: `${meta.color}22`, color: meta.color }}>{meta.label}</span>
                    <span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{meta.desc}</span>
                  </div>
                  {users.map(u => (
                    <div key={u.id} onClick={() => loginAs(u.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', marginBottom: 6, transition: 'border-color .15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,.5)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${meta.color}22`, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.82rem', flexShrink: 0 }}>{u.avatar}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{u.name}</div>
                        <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{u.email}</div>
                      </div>
                      <div style={{ fontSize: '.78rem', color: u.status === 'active' ? 'var(--green)' : 'var(--yellow)' }}>{u.status}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '.78rem', color: 'var(--text3)', marginTop: 16 }}>
          Silicon Valley Robotics Center &copy; 2026
        </p>
      </div>
    </div>
  );
}
