import { useState } from 'react';
import { useAuth, ROLES, DEMO_USERS, DEMO_ORGS } from '../auth';
import { useI18n } from '../i18n';

export default function OrgManagementPage() {
  const { lang } = useI18n();
  const { user, org, allUsers, allOrgs } = useAuth();
  const isPlatform = user?.role === 'platform_admin' || user?.role === 'platform_ops';
  const orgs = isPlatform ? allOrgs : allOrgs.filter(o => o.id === user?.org_id);
  const [selectedOrg, setSelectedOrg] = useState(user?.org_id || orgs[0]?.id);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'buyer_member', name: '' });
  const [showTeam, setShowTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', desc: '' });

  const orgMembers = allUsers.filter(u => u.org_id === selectedOrg);
  const currentOrg = allOrgs.find(o => o.id === selectedOrg);

  const TEAMS = [
    { id: 't1', name: 'Engineering', members: 2, lead: 'Mike Wilson' },
    { id: 't2', name: 'Procurement', members: 1, lead: 'Emily Zhang' },
    { id: 't3', name: 'Quality', members: 1, lead: 'Zhang Qiang' },
  ];

  const ACTIVITY = [
    { time: '2 hours ago', action: 'Emily Zhang accepted invite', type: 'join' },
    { time: '1 day ago', action: 'Mike Wilson created team "Procurement"', type: 'team' },
    { time: '3 days ago', action: 'David Li invited by Mike Wilson', type: 'invite' },
    { time: '1 week ago', action: 'Organization created', type: 'create' },
  ];

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? '组织管理' : 'Organization Management'}</h2>
      <p className="page-sub">{lang === 'zh' ? '管理您的团队、成员和组织架构' : 'Manage your teams, members, and organizational structure'}</p>

      {isPlatform && (
        <div className="kpis">
          <div className="kpi"><div className="kpi-label">Organizations</div><div className="kpi-value" style={{ color: 'var(--accent)' }}>{allOrgs.length}</div></div>
          <div className="kpi"><div className="kpi-label">Total Users</div><div className="kpi-value" style={{ color: 'var(--green)' }}>{allUsers.length}</div></div>
          <div className="kpi"><div className="kpi-label">Active</div><div className="kpi-value" style={{ color: 'var(--green)' }}>{allUsers.filter(u => u.status === 'active').length}</div></div>
          <div className="kpi"><div className="kpi-label">Pending Invites</div><div className="kpi-value" style={{ color: 'var(--yellow)' }}>{allUsers.filter(u => u.status === 'invited').length}</div></div>
        </div>
      )}

      {isPlatform && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">All Organizations</div>
          </div>
          <div className="grid-3">
            {orgs.map(o => (
              <div key={o.id} className={`card ${selectedOrg === o.id ? 'active' : ''}`} onClick={() => setSelectedOrg(o.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: o.type === 'platform' ? 'rgba(168,85,247,.15)' : o.type === 'buyer' ? 'rgba(34,197,94,.15)' : 'rgba(249,115,22,.15)', color: o.type === 'platform' ? 'var(--purple)' : o.type === 'buyer' ? 'var(--green)' : 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0 }}>{o.logo}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.92rem' }}>{o.name}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span className={`badge ${o.type === 'platform' ? 'badge-purple' : o.type === 'buyer' ? 'badge-green' : 'badge-yellow'}`}>{o.type}</span>
                      <span className="badge badge-blue">{o.plan}</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '.82rem', color: 'var(--text3)', marginTop: 8 }}>{allUsers.filter(u => u.org_id === o.id).length} members</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentOrg && (
        <div className="grid-2">
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Members — {currentOrg.name}</div>
              <button className="btn btn-primary" onClick={() => setShowInvite(true)}>+ Invite</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Member', 'Role', 'Status', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}
              </tr></thead>
              <tbody>
                {orgMembers.map(m => {
                  const rm = ROLES[m.role];
                  return (
                    <tr key={m.id}>
                      <td className="td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${rm.color}22`, color: rm.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.75rem', flexShrink: 0 }}>{m.avatar}</div>
                          <div><div style={{ fontWeight: 600, fontSize: '.88rem' }}>{m.name}</div><div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{m.email}</div></div>
                        </div>
                      </td>
                      <td className="td"><span className="badge" style={{ background: `${rm.color}22`, color: rm.color }}>{rm.label}</span></td>
                      <td className="td"><span className={`badge ${m.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>{m.status}</span></td>
                      <td className="td">
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-sm">Edit</button>
                          {m.id !== user?.id && <button className="btn-sm" style={{ color: 'var(--red)' }}>Remove</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Teams</div>
                <button className="btn btn-primary" onClick={() => setShowTeam(true)}>+ Team</button>
              </div>
              {TEAMS.map(t => (
                <div key={t.id} className="card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>Lead: {t.lead} · {t.members} members</div>
                  </div>
                  <button className="btn-sm">Manage</button>
                </div>
              ))}
            </div>

            <div className="panel">
              <div className="panel-title" style={{ marginBottom: 12 }}>Recent Activity</div>
              {ACTIVITY.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < ACTIVITY.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.type === 'join' ? 'var(--green)' : a.type === 'invite' ? 'var(--yellow)' : a.type === 'team' ? 'var(--accent)' : 'var(--purple)', marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '.85rem' }}>{a.action}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Invite Team Member</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Full Name</label>
              <input className="input" value={inviteForm.name} onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Email Address</label>
              <input className="input" type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Role</label>
              <select className="select" style={{ width: '100%' }} value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}>
                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label} — {v.desc}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { setShowInvite(false); }}>Send Invite</button>
            </div>
          </div>
        </div>
      )}

      {showTeam && (
        <div className="modal-overlay" onClick={() => setShowTeam(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Create Team</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Team Name</label>
              <input className="input" value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '.78rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Description</label>
              <input className="input" value={teamForm.desc} onChange={e => setTeamForm({ ...teamForm, desc: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowTeam(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { setShowTeam(false); }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
