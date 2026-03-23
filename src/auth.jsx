import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiLogin, apiMe, setTokens, clearTokens, getAccessToken } from './api';

const ROLES = {
  platform_admin: {
    label: 'Platform Admin',
    desc: 'SVRC internal — full system access',
    color: 'var(--purple)',
    tier: 0,
  },
  platform_ops: {
    label: 'Platform Ops',
    desc: 'SVRC operations — day-to-day management',
    color: 'var(--accent)',
    tier: 1,
  },
  buyer_admin: {
    label: 'Buyer Admin',
    desc: 'Buyer organization owner',
    color: 'var(--green)',
    tier: 2,
  },
  buyer_member: {
    label: 'Buyer Member',
    desc: 'Buyer team member',
    color: 'var(--green)',
    tier: 3,
  },
  seller_admin: {
    label: 'Seller Admin',
    desc: 'Supplier / factory owner',
    color: 'var(--orange)',
    tier: 2,
  },
  seller_member: {
    label: 'Seller Member',
    desc: 'Supplier team member',
    color: 'var(--orange)',
    tier: 3,
  },
  inspector: {
    label: 'Inspector',
    desc: 'On-site verification & QC',
    color: 'var(--yellow)',
    tier: 3,
  },
};

const PAGE_ACL = {
  flywheel:     ['platform_admin', 'platform_ops'],
  dashboard:    ['platform_admin', 'platform_ops', 'buyer_admin', 'buyer_member', 'seller_admin', 'seller_member'],
  confidence:   ['platform_admin', 'platform_ops'],
  marketplace:  ['platform_admin', 'platform_ops', 'buyer_admin', 'buyer_member', 'seller_admin', 'seller_member'],
  agency:       ['platform_admin', 'platform_ops', 'seller_admin'],
  rfq:          ['platform_admin', 'platform_ops', 'buyer_admin', 'buyer_member'],
  negotiation:  ['platform_admin', 'platform_ops', 'buyer_admin'],
  bom:          ['platform_admin', 'platform_ops', 'buyer_admin', 'buyer_member'],
  procurement:  ['platform_admin', 'platform_ops'],
  milestones:   ['platform_admin', 'platform_ops', 'buyer_admin', 'buyer_member'],
  orders:       ['platform_admin', 'platform_ops', 'buyer_admin', 'buyer_member', 'seller_admin', 'seller_member'],
  verification: ['platform_admin', 'platform_ops', 'inspector', 'buyer_admin'],
  compliance:   ['platform_admin', 'platform_ops', 'buyer_admin'],
  portal:       ['buyer_admin', 'buyer_member'],
  suppliers:    ['platform_admin', 'platform_ops'],
  expert:       ['platform_admin', 'platform_ops'],
  trust:        ['platform_admin', 'platform_ops', 'buyer_admin'],
  credit:       ['platform_admin', 'platform_ops'],
  relationships:['platform_admin', 'platform_ops'],
  intelligence: ['platform_admin', 'platform_ops'],
  browser:      ['platform_admin', 'platform_ops'],
  graph:        ['platform_admin', 'platform_ops'],
  quality:      ['platform_admin', 'platform_ops', 'inspector'],
  org:          ['platform_admin', 'platform_ops', 'buyer_admin', 'seller_admin'],
  roles:        ['platform_admin'],
  account:      ['platform_admin', 'platform_ops', 'buyer_admin', 'buyer_member', 'seller_admin', 'seller_member', 'inspector'],
};

const DEMO_ORGS = [
  { id: 'org_svrc', name: 'Silicon Valley Robotics Center', type: 'platform', plan: 'enterprise', logo: 'S' },
  { id: 'org_acme', name: 'Acme Robotics Inc.', type: 'buyer', plan: 'pro', logo: 'A' },
  { id: 'org_shenzhen', name: 'Shenzhen MechParts Co.', type: 'seller', plan: 'standard', logo: '深' },
];

const DEMO_USERS = [
  { id: 'u1', name: 'Jerry Huang', email: 'jerry@roboticscenter.ai', role: 'platform_admin', org_id: 'org_svrc', avatar: 'JH', status: 'active' },
  { id: 'u2', name: 'Sarah Chen', email: 'sarah@roboticscenter.ai', role: 'platform_ops', org_id: 'org_svrc', avatar: 'SC', status: 'active' },
  { id: 'u3', name: 'Mike Wilson', email: 'mike@acmerobotics.com', role: 'buyer_admin', org_id: 'org_acme', avatar: 'MW', status: 'active' },
  { id: 'u4', name: 'Emily Zhang', email: 'emily@acmerobotics.com', role: 'buyer_member', org_id: 'org_acme', avatar: 'EZ', status: 'active' },
  { id: 'u5', name: 'David Li', email: 'david@acmerobotics.com', role: 'buyer_member', org_id: 'org_acme', avatar: 'DL', status: 'invited' },
  { id: 'u6', name: 'Wang Wei', email: 'wangwei@mechparts.cn', role: 'seller_admin', org_id: 'org_shenzhen', avatar: 'WW', status: 'active' },
  { id: 'u7', name: 'Liu Fang', email: 'liufang@mechparts.cn', role: 'seller_member', org_id: 'org_shenzhen', avatar: 'LF', status: 'active' },
  { id: 'u8', name: 'Zhang Qiang', email: 'zhangq@inspect.cn', role: 'inspector', org_id: 'org_svrc', avatar: 'ZQ', status: 'active' },
];

const STORAGE_KEY = 'robotbuy_session';

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveSession(session) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const s = loadSession();
    if (!s) return null;
    if (s.mode === 'backend' && s.backendUser) return s.backendUser;
    return DEMO_USERS.find(u => u.id === s.userId) || null;
  });
  const [allUsers] = useState(DEMO_USERS);
  const [allOrgs] = useState(DEMO_ORGS);

  const login = useCallback(async (email, password) => {
    const demo = DEMO_USERS.find(u => u.email === email);
    if (demo) {
      setUser(demo);
      saveSession({ userId: demo.id, mode: 'demo' });
      return { ok: true };
    }
    try {
      const res = await apiLogin(email, password);
      if (res.token) {
        setTokens(res.token, res.refresh_token);
        const backendUser = {
          id: `backend_${res.user.id}`,
          name: res.user.username,
          email: res.user.email,
          role: 'buyer_admin',
          org_id: 'org_acme',
          avatar: (res.user.username || 'U').slice(0, 2).toUpperCase(),
          status: 'active',
          _backend: true,
        };
        setUser(backendUser);
        saveSession({ userId: backendUser.id, mode: 'backend', backendUser });
        return { ok: true };
      }
      return { ok: false, error: 'Login failed' };
    } catch (e) {
      return { ok: false, error: e.message || 'Login failed' };
    }
  }, []);

  const loginAs = useCallback((userId) => {
    const found = DEMO_USERS.find(u => u.id === userId);
    if (found) { setUser(found); saveSession({ userId: found.id }); }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveSession(null);
    clearTokens();
  }, []);

  const hasAccess = useCallback((pageId) => {
    if (!user) return false;
    const acl = PAGE_ACL[pageId];
    if (!acl) return true;
    return acl.includes(user.role);
  }, [user]);

  const org = user ? DEMO_ORGS.find(o => o.id === user.org_id) : null;
  const roleMeta = user ? ROLES[user.role] : null;

  return (
    <AuthContext.Provider value={{ user, org, roleMeta, allUsers, allOrgs, login, loginAs, logout, hasAccess, ROLES, PAGE_ACL }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export { ROLES, PAGE_ACL, DEMO_USERS, DEMO_ORGS };
