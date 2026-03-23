import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { useI18n } from '../i18n';

const money = (n) => n == null ? '—' : `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (n) => n == null ? '—' : typeof n === 'number' ? n.toLocaleString() : n;

function SellerConnectPanel() {
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [onboardLoading, setOnboardLoading] = useState(false);

  const lookup = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const p = await api.fetchSellerProfile(email);
      setProfile(p);
      if (p.onboarding_status === 'active') {
        const b = await api.fetchSellerBalance(email);
        setBalance(b);
      }
    } catch { setProfile(null); setBalance(null); }
    setLoading(false);
  };

  const startOnboarding = async () => {
    if (!email) return;
    setOnboardLoading(true);
    try {
      const result = await api.sellerOnboard({ seller_email: email, seller_name: '', seller_company: '' });
      if (result.onboarding_url) window.open(result.onboarding_url, '_blank');
      setProfile(result.profile);
    } catch (err) { alert('Onboarding failed: ' + err.message); }
    setOnboardLoading(false);
  };

  const openDashboard = async () => {
    try {
      const result = await api.sellerDashboardLink(email);
      if (result.dashboard_url) window.open(result.dashboard_url, '_blank');
    } catch (err) { alert('Could not open dashboard: ' + err.message); }
  };

  const STATUS_BADGE = {
    active: 'badge-green', pending: 'badge-yellow', onboarding: 'badge-blue',
    restricted: 'badge-red', disabled: 'badge-red',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="input" placeholder="Seller email" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1, maxWidth: 320 }} />
        <button className="btn btn-primary" onClick={lookup} disabled={loading}>{loading ? 'Loading…' : 'Look Up'}</button>
        <button className="btn btn-secondary" onClick={startOnboarding} disabled={onboardLoading}>{onboardLoading ? 'Starting…' : '+ Onboard New Seller'}</button>
      </div>

      {profile && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{profile.seller_email}</strong>
              {profile.seller_company && <span style={{ color: 'var(--text2)', marginLeft: 8 }}>({profile.seller_company})</span>}
            </div>
            <span className={`badge ${STATUS_BADGE[profile.onboarding_status] || 'badge-yellow'}`}>{profile.onboarding_status}</span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: '.85rem', color: 'var(--text2)' }}>
            <span>Charges: {profile.charges_enabled ? '✅' : '❌'}</span>
            <span>Payouts: {profile.payouts_enabled ? '✅' : '❌'}</span>
            <span>Fee: {profile.platform_fee_percent}%</span>
            <span>Country: {profile.country}</span>
          </div>
          {profile.onboarding_status === 'active' && (
            <button className="btn btn-secondary" onClick={openDashboard} style={{ alignSelf: 'flex-start' }}>Open Stripe Dashboard ↗</button>
          )}
        </div>
      )}

      {balance && (
        <div style={{ display: 'flex', gap: 16 }}>
          <div className="card" style={{ flex: 1 }}>
            <div style={{ fontSize: '.8rem', color: 'var(--text3)', marginBottom: 4 }}>Available Balance</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--green)' }}>
              {balance.available?.map(a => money(a.amount)).join(', ') || '$0.00'}
            </div>
          </div>
          <div className="card" style={{ flex: 1 }}>
            <div style={{ fontSize: '.8rem', color: 'var(--text3)', marginBottom: 4 }}>Pending</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--yellow)' }}>
              {balance.pending?.map(p => money(p.amount)).join(', ') || '$0.00'}
            </div>
          </div>
        </div>
      )}

      {balance?.recent_paid_orders?.length > 0 && (
        <>
          <h4 style={{ fontSize: '.9rem', fontWeight: 600, marginTop: 8 }}>Recent Payouts</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Order', 'Total', 'Fee', 'Payout', 'Date'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {balance.recent_paid_orders.map(o => (
                <tr key={o.order_key}>
                  <td className="td" style={{ fontWeight: 600 }}>{o.order_key}</td>
                  <td className="td">{money(o.total_usd)}</td>
                  <td className="td" style={{ color: 'var(--text3)' }}>{money(o.platform_fee_usd)}</td>
                  <td className="td" style={{ color: 'var(--green)', fontWeight: 600 }}>{money(o.seller_payout_usd)}</td>
                  <td className="td" style={{ fontSize: '.82rem' }}>{o.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {!profile && !loading && (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>
          Enter a seller email to view their Stripe Connect profile, or click "Onboard New Seller" to start.
        </div>
      )}
    </div>
  );
}

const INV_BADGE = {
  draft: 'badge-yellow', submitted: 'badge-blue', approved: 'badge-green',
  paid: 'badge-green', overdue: 'badge-red', rejected: 'badge-red',
  pending: 'badge-yellow', pending_approval: 'badge-yellow',
};

export default function PaymentsPage() {
  const { lang } = useI18n();
  const [dash, setDash] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [payables, setPayables] = useState([]);
  const [view, setView] = useState('invoices');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ po_number: '', supplier_name: '', amount: '', tax: '', due_date: '', notes: '' });

  const reload = useCallback(() => {
    api.fetchPaymentsDash().then(d => setDash(d)).catch(() => {});
    api.fetchInvoices().then(d => setInvoices(d.invoices || [])).catch(() => {});
    api.fetchPendingApprovals().then(d => setApprovals(d.approvals || [])).catch(() => {});
    api.fetchAccountsPayable().then(d => setPayables(d.accounts || [])).catch(() => {});
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleCreateInvoice = async () => {
    const data = { ...form, amount: parseFloat(form.amount) || 0, tax: parseFloat(form.tax) || 0 };
    await api.createInvoice(data);
    setShowModal(false);
    setForm({ po_number: '', supplier_name: '', amount: '', tax: '', due_date: '', notes: '' });
    reload();
  };

  const handleApproveInvoice = async (id) => {
    await api.approveInvoice(id, { status: 'approved' });
    reload();
  };

  const handleMarkPaid = async (id) => {
    await api.approveInvoice(id, { status: 'paid' });
    reload();
  };

  const handleDecision = async (id, decision) => {
    await api.decideApproval(id, { decision });
    reload();
  };

  const kpis = [
    { label: 'Total Outstanding', value: money(dash.total_outstanding), color: 'var(--yellow)' },
    { label: 'Paid MTD', value: money(dash.total_paid_mtd), color: 'var(--green)' },
    { label: 'Total Overdue', value: money(dash.total_overdue), color: dash.total_overdue > 0 ? 'var(--red)' : 'var(--green)' },
    { label: 'Avg Days to Pay', value: dash.avg_days_to_pay != null ? `${dash.avg_days_to_pay}d` : '—' },
    { label: 'Pending Approval', value: fmt(dash.invoices_pending_approval), color: dash.invoices_pending_approval > 0 ? 'var(--yellow)' : undefined },
  ];

  return (
    <>
      <h2 className="page-title">{lang === 'zh' ? '支付与财务' : 'Payments & Finance'}</h2>
      <p className="page-sub">{lang === 'zh' ? '发票管理、审批流程和应付账款' : 'Invoice management, approval workflows, and accounts payable'}</p>

      <div className="kpis">
        {kpis.map(k => (
          <div className="kpi" key={k.label}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={k.color ? { color: k.color } : undefined}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-header">
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-sm" style={view === 'invoices' ? { background: 'var(--accent)', color: '#fff' } : {}} onClick={() => setView('invoices')}>🧾 Invoices</button>
            <button className="btn-sm" style={view === 'approvals' ? { background: 'var(--accent)', color: '#fff' } : {}} onClick={() => setView('approvals')}>⏳ Approvals</button>
            <button className="btn-sm" style={view === 'payables' ? { background: 'var(--accent)', color: '#fff' } : {}} onClick={() => setView('payables')}>💰 Payables</button>
            <button className="btn-sm" style={view === 'connect' ? { background: 'var(--accent)', color: '#fff' } : {}} onClick={() => setView('connect')}>🔗 Seller Connect</button>
          </div>
          {view === 'invoices' && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Invoice</button>
          )}
        </div>

        {view === 'invoices' && (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Invoice #', 'PO', 'Supplier', 'Amount', 'Tax', 'Total', 'Status', 'Due Date', 'Paid Date', ''].map(h => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const total = (inv.amount || 0) + (inv.tax || 0);
                  return (
                    <tr key={inv.id}>
                      <td className="td" style={{ fontWeight: 600 }}>INV-{String(inv.id).padStart(4, '0')}</td>
                      <td className="td">{inv.po_number || '—'}</td>
                      <td className="td">{inv.supplier_name || '—'}</td>
                      <td className="td">{money(inv.amount)}</td>
                      <td className="td" style={{ color: 'var(--text2)' }}>{money(inv.tax)}</td>
                      <td className="td" style={{ fontWeight: 600 }}>{money(total)}</td>
                      <td className="td"><span className={`badge ${INV_BADGE[inv.status] || 'badge-blue'}`}>{inv.status}</span></td>
                      <td className="td" style={{ fontSize: '.82rem' }}>{inv.due_date?.slice(0, 10) || '—'}</td>
                      <td className="td" style={{ fontSize: '.82rem' }}>{inv.paid_date?.slice(0, 10) || '—'}</td>
                      <td className="td">
                        <div style={{ display: 'flex', gap: 4 }}>
                          {(inv.status === 'draft' || inv.status === 'submitted') && (
                            <button className="btn-sm" onClick={() => handleApproveInvoice(inv.id)}>Submit for Approval</button>
                          )}
                          {inv.status === 'approved' && (
                            <button className="btn-sm" style={{ background: 'var(--green)', color: '#fff' }} onClick={() => handleMarkPaid(inv.id)}>Mark Paid</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!invoices.length && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No invoices yet</div>}
          </>
        )}

        {view === 'approvals' && (
          <>
            {approvals.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No pending approvals</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {approvals.map(a => (
                <div key={a.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4 }}>
                      <strong>INV-{String(a.invoice_id || a.id).padStart(4, '0')}</strong>
                      <span className="badge badge-yellow">Pending</span>
                    </div>
                    <div style={{ fontSize: '.85rem', color: 'var(--text2)' }}>
                      {a.supplier_name || 'Supplier'} · {money(a.amount)} · {a.requester || 'System'}
                    </div>
                    {a.reason && <div style={{ fontSize: '.82rem', color: 'var(--text3)', marginTop: 4 }}>{a.reason}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" style={{ background: 'var(--green)' }} onClick={() => handleDecision(a.id, 'approve')}>✅ Approve</button>
                    <button className="btn btn-secondary" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => handleDecision(a.id, 'reject')}>❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {view === 'connect' && <SellerConnectPanel />}

        {view === 'payables' && (
          <>
            {payables.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No accounts payable data</div>}
            <div className="grid-3">
              {payables.map(p => {
                const total = (p.outstanding || 0) + (p.paid || 0) + (p.overdue || 0);
                const paidPct = total ? (p.paid / total) * 100 : 0;
                const outPct = total ? (p.outstanding / total) * 100 : 0;
                const ovdPct = total ? (p.overdue / total) * 100 : 0;
                return (
                  <div key={p.supplier_name || p.id} className="card">
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>{p.supplier_name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                      <span>Outstanding</span><span style={{ color: 'var(--yellow)', fontWeight: 600 }}>{money(p.outstanding)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                      <span>Paid</span><span style={{ color: 'var(--green)', fontWeight: 600 }}>{money(p.paid)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                      <span>Overdue</span><span style={{ color: 'var(--red)', fontWeight: 600 }}>{money(p.overdue)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 8 }}>
                      <span>Invoices</span><span style={{ fontWeight: 600 }}>{p.invoice_count || 0}</span>
                    </div>
                    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--border)' }}>
                      {paidPct > 0 && <div style={{ width: `${paidPct}%`, background: 'var(--green)' }} />}
                      {outPct > 0 && <div style={{ width: `${outPct}%`, background: 'var(--yellow)' }} />}
                      {ovdPct > 0 && <div style={{ width: `${ovdPct}%`, background: 'var(--red)' }} />}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: '.7rem', color: 'var(--text3)' }}>
                      <span>🟢 Paid</span><span>🟡 Outstanding</span><span>🔴 Overdue</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>New Invoice</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '.82rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>PO Number</label>
                <input className="input" value={form.po_number} onChange={e => setForm(p => ({ ...p, po_number: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '.82rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Supplier Name</label>
                <input className="input" value={form.supplier_name} onChange={e => setForm(p => ({ ...p, supplier_name: e.target.value }))} />
              </div>
              <div className="grid-2">
                <div>
                  <label style={{ fontSize: '.82rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Amount ($)</label>
                  <input className="input" type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '.82rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Tax ($)</label>
                  <input className="input" type="number" step="0.01" value={form.tax} onChange={e => setForm(p => ({ ...p, tax: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '.82rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Due Date</label>
                <input className="input" type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '.82rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Notes</label>
                <input className="input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreateInvoice}>Create Invoice</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
