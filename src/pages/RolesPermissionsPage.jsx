import { useState } from 'react';
import { useAuth, ROLES, PAGE_ACL } from '../auth';
import { useI18n } from '../i18n';

const PAGE_LABELS = {
  flywheel: 'Flywheel & KPIs', dashboard: 'Dashboard', confidence: 'Confidence System',
  marketplace: 'Marketplace', agency: 'Exclusive Agency', rfq: 'RFQ Engine',
  negotiation: 'AI Negotiation', bom: 'BOM Router', procurement: 'Orchestration',
  milestones: 'Milestone Payments', orders: 'Order Tracking', verification: 'Production Verify',
  compliance: 'Cert & Compliance', portal: 'Customer Portal', suppliers: 'Suppliers',
  expert: 'Expert Memory', trust: 'Trust Scores', credit: 'Credit System',
  relationships: 'Relationships', intelligence: 'Intelligence', browser: 'Browser Agent',
  graph: 'Supply Graph', quality: 'Quality & Risk', org: 'Organization Mgmt',
  roles: 'Roles & Permissions', account: 'Account Settings',
};

const PAGE_GROUPS = [
  { label: 'Command Center', pages: ['flywheel', 'dashboard', 'confidence'] },
  { label: 'Transaction', pages: ['marketplace', 'agency', 'rfq', 'negotiation', 'bom', 'procurement'] },
  { label: 'Execution', pages: ['milestones', 'orders', 'verification', 'compliance', 'portal'] },
  { label: 'Supplier Network', pages: ['suppliers', 'expert', 'trust', 'credit', 'relationships', 'intelligence'] },
  { label: 'AI Agents', pages: ['browser', 'graph'] },
  { label: 'Quality', pages: ['quality'] },
  { label: 'System', pages: ['org', 'roles', 'account'] },
];

const roleKeys = Object.keys(ROLES);

export default function RolesPermissionsPage() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? '角色与权限' : 'Roles & Permissions'}</h2>
      <p className="page-sub">{lang === 'zh' ? '为所有平台模块配置基于角色的访问控制' : 'Configure role-based access control for all platform modules'}</p>

      <div className="panel">
        <div className="panel-title" style={{ marginBottom: 16 }}>Role Definitions</div>
        <div className="grid-3">
          {Object.entries(ROLES).map(([key, r]) => (
            <div key={key} className={`card ${selectedRole === key ? 'active' : ''}`}
              style={{ cursor: 'pointer' }} onClick={() => setSelectedRole(selectedRole === key ? null : key)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />
                <div style={{ fontWeight: 700, fontSize: '.92rem' }}>{r.label}</div>
                <span className="badge badge-blue">Tier {r.tier}</span>
              </div>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{r.desc}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: 4 }}>
                {Object.entries(PAGE_ACL).filter(([, roles]) => roles.includes(key)).length} modules accessible
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ overflowX: 'auto' }}>
        <div className="panel-title" style={{ marginBottom: 16 }}>Permission Matrix</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th className="th" style={{ position: 'sticky', left: 0, background: 'var(--card)', zIndex: 2, minWidth: 180 }}>Module</th>
              {roleKeys.map(rk => (
                <th key={rk} className="th" style={{ textAlign: 'center', minWidth: 80 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ROLES[rk].color }} />
                    <span style={{ fontSize: '.65rem', lineHeight: 1.2 }}>{ROLES[rk].label.split(' ').map(w => w[0]).join('')}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PAGE_GROUPS.map(g => (
              <>
                <tr key={`g-${g.label}`}>
                  <td colSpan={roleKeys.length + 1} style={{ padding: '10px', fontSize: '.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border)' }}>
                    {g.label}
                  </td>
                </tr>
                {g.pages.map(pageId => {
                  const acl = PAGE_ACL[pageId] || [];
                  return (
                    <tr key={pageId} style={{ background: selectedRole && acl.includes(selectedRole) ? 'rgba(59,130,246,.04)' : undefined }}>
                      <td className="td" style={{ position: 'sticky', left: 0, background: 'var(--card)', zIndex: 1, fontWeight: 500 }}>
                        {PAGE_LABELS[pageId] || pageId}
                      </td>
                      {roleKeys.map(rk => {
                        const has = acl.includes(rk);
                        return (
                          <td key={rk} className="td" style={{ textAlign: 'center' }}>
                            {has ? (
                              <span style={{ color: 'var(--green)', fontSize: '1.1rem', fontWeight: 700 }}>✓</span>
                            ) : (
                              <span style={{ color: 'var(--text3)', fontSize: '.9rem' }}>—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title" style={{ marginBottom: 12 }}>Role Hierarchy</div>
          <div style={{ padding: 8 }}>
            {Object.entries(ROLES).sort((a, b) => a[1].tier - b[1].tier).map(([key, r], i) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < Object.keys(ROLES).length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${r.color}22`, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.75rem', flexShrink: 0 }}>T{r.tier}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '.88rem', color: r.color }}>{r.label}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{r.desc}</div>
                </div>
                <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
                  {Object.entries(PAGE_ACL).filter(([, roles]) => roles.includes(key)).length} pages
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title" style={{ marginBottom: 12 }}>Permission Policies</div>
          {[
            { name: 'Data Export', desc: 'Export supplier data, order reports, analytics', roles: ['platform_admin', 'platform_ops', 'buyer_admin'] },
            { name: 'Financial Actions', desc: 'Approve payments, release milestones', roles: ['platform_admin', 'buyer_admin'] },
            { name: 'Supplier Modify', desc: 'Edit supplier profiles, update credit scores', roles: ['platform_admin', 'platform_ops'] },
            { name: 'Invite Members', desc: 'Send org invitations', roles: ['platform_admin', 'platform_ops', 'buyer_admin', 'seller_admin'] },
            { name: 'Delete Records', desc: 'Permanently delete orders, suppliers', roles: ['platform_admin'] },
            { name: 'API Access', desc: 'Use REST API with API keys', roles: ['platform_admin', 'platform_ops', 'buyer_admin', 'seller_admin'] },
            { name: 'Inspection Actions', desc: 'Submit inspection reports, mark verifications', roles: ['platform_admin', 'platform_ops', 'inspector'] },
          ].map((p, i) => (
            <div key={i} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{p.name}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{p.desc}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {p.roles.map(r => (
                    <span key={r} className="badge" style={{ background: `${ROLES[r].color}22`, color: ROLES[r].color, fontSize: '.65rem' }}>
                      {ROLES[r].label.split(' ').map(w => w[0]).join('')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
