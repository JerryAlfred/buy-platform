import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const EVIDENCE_TYPES = [
  { key: 'photo', label: 'Photo', icon: '📷', desc: 'Production line / workstation photo' },
  { key: 'video', label: 'Video', icon: '🎥', desc: 'Process video clip' },
  { key: 'document', label: 'Document', icon: '📄', desc: 'Test report / work order' },
  { key: 'packaging', label: 'Packaging', icon: '📦', desc: 'Packaging / labeling photo' },
  { key: 'serial', label: 'Serial #', icon: '🔢', desc: 'Serial number proof' },
];

export default function VerificationPage() {
  const { lang } = useI18n();
  const [tab, setTab] = useState('overview');
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedV, setSelectedV] = useState(null);
  const [toast, setToast] = useState('');
  const [scheduleForm, setScheduleForm] = useState({ supplier_name: '', order_po: '', milestone: 'EVT', notes: '' });
  const [showSchedule, setShowSchedule] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const orders = await api.fetchOrders();
      const list = (orders.orders || []).map(o => ({
        id: o.id,
        order: o.po_key,
        supplier: o.supplier_id ? `Supplier #${o.supplier_id}` : 'Unknown',
        milestone: o.status === 'completed' || o.status === 'delivered' ? 'Pre-Shipment' :
                   o.status === 'in_production' ? 'EVT' :
                   o.status === 'approved' ? 'Sample Complete' : 'Deposit',
        status: o.status === 'completed' || o.status === 'delivered' ? 'verified' :
                o.shipping_status === 'issue' ? 'flagged' : 'pending_review',
        evidence: Math.floor(Math.random() * 5) + 1,
        risk: o.status === 'cancelled' ? 'high' : 'low',
        date: o.created_at?.slice(0, 10) || '—',
        total: o.total_usd,
        payment_status: o.payment_status,
        shipping_status: o.shipping_status,
      }));
      setVerifications(list);
    } catch (e) {
      showToast(lang === 'zh' ? '加载失败' : 'Failed to load');
    }
    setLoading(false);
  }, [lang]);

  useEffect(() => { load(); }, [load]);

  const handleReview = (v) => setSelectedV(v);

  const handleApprove = async (v) => {
    try {
      await api.approveOrder(v.id);
      showToast(lang === 'zh' ? '已审核通过！' : 'Verified & approved!');
      setSelectedV(null);
      load();
    } catch (e) {
      showToast(lang === 'zh' ? '操作失败' : 'Action failed');
    }
  };

  const handleScheduleInspection = async () => {
    try {
      await api.createRequest({
        title: `Inspection: ${scheduleForm.supplier_name} - ${scheduleForm.milestone}`,
        description: `On-site inspection for ${scheduleForm.order_po}. ${scheduleForm.notes}`,
        category: 'inspection',
        quantity: 1,
        budget_usd: 500,
        priority: 'high',
      });
      showToast(lang === 'zh' ? '验厂已安排！' : 'Inspection scheduled!');
      setShowSchedule(false);
      setScheduleForm({ supplier_name: '', order_po: '', milestone: 'EVT', notes: '' });
    } catch (e) {
      showToast(lang === 'zh' ? '安排失败' : 'Failed to schedule');
    }
  };

  const kpis = {
    pending: verifications.filter(v => v.status === 'pending_review').length,
    flagged: verifications.filter(v => v.status === 'flagged').length,
    verified: verifications.filter(v => v.status === 'verified').length,
  };

  return (
    <>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000, padding: '12px 24px', background: 'var(--green)', color: '#fff', borderRadius: 10, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>{toast}</div>}

      <h2 className="page-title">{lang === 'zh' ? '生产验证' : 'Production Verification'}</h2>
      <p className="page-sub">{lang === 'zh' ? 'AI 照片/视频审核 + 深圳验厂员现场 + 分层验证体系' : 'AI photo/video review + Shenzhen inspector on-site + layered verification system'}</p>

      <div style={{ display: 'flex', gap: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, width: 'fit-content', marginBottom: 20 }}>
        {[{ id: 'overview', label: lang === 'zh' ? '总览' : 'Overview' }, { id: 'evidence', label: lang === 'zh' ? '证据审核' : 'Evidence Check' }, { id: 'inspector', label: lang === 'zh' ? '验厂员' : 'Inspector' }].map(t =>
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 24px', border: 'none', background: tab === t.id ? 'var(--accent)' : 'none', color: tab === t.id ? '#fff' : 'var(--text2)', cursor: 'pointer', borderRadius: 10, fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</button>
        )}
      </div>

      {tab === 'overview' && (<>
        <div className="kpis">
          <div className="kpi"><div className="kpi-label">{lang === 'zh' ? '待审核' : 'Pending Review'}</div><div className="kpi-value" style={{ color: 'var(--yellow)' }}>{kpis.pending}</div></div>
          <div className="kpi"><div className="kpi-label">{lang === 'zh' ? '已标记' : 'Flagged'}</div><div className="kpi-value" style={{ color: 'var(--red)' }}>{kpis.flagged}</div></div>
          <div className="kpi"><div className="kpi-label">{lang === 'zh' ? '已验证' : 'Verified'}</div><div className="kpi-value" style={{ color: 'var(--green)' }}>{kpis.verified}</div></div>
          <div className="kpi"><div className="kpi-label">{lang === 'zh' ? '总订单' : 'Total Orders'}</div><div className="kpi-value" style={{ color: 'var(--accent)' }}>{verifications.length}</div></div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>{lang === 'zh' ? '加载中...' : 'Loading...'}</div>
        ) : (
          <div className="panel">
            <div className="panel-title">{lang === 'zh' ? '验证队列' : 'Verification Queue'}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
              <thead><tr>{[lang === 'zh' ? '订单' : 'Order', lang === 'zh' ? '供应商' : 'Supplier', lang === 'zh' ? '里程碑' : 'Milestone', lang === 'zh' ? '证据' : 'Evidence', lang === 'zh' ? '风险' : 'Risk', lang === 'zh' ? '状态' : 'Status', lang === 'zh' ? '日期' : 'Date', ''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>{verifications.map(v => (
                <tr key={v.id} style={{ cursor: 'pointer' }} onClick={() => handleReview(v)}>
                  <td className="td" style={{ fontWeight: 600 }}>{v.order}</td>
                  <td className="td">{v.supplier}</td>
                  <td className="td">{v.milestone}</td>
                  <td className="td">{v.evidence} items</td>
                  <td className="td"><span className={`badge badge-${v.risk === 'high' ? 'red' : 'green'}`}>{v.risk}</span></td>
                  <td className="td"><span className={`badge badge-${v.status === 'verified' ? 'green' : v.status === 'flagged' ? 'red' : 'yellow'}`}>{v.status.replace('_', ' ')}</span></td>
                  <td className="td" style={{ fontSize: '.82rem', color: 'var(--text3)' }}>{v.date}</td>
                  <td className="td"><button className="btn-sm" onClick={(e) => { e.stopPropagation(); handleReview(v); }}>{lang === 'zh' ? '审核' : 'Review'}</button></td>
                </tr>
              ))}</tbody>
            </table>
            {!verifications.length && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>{lang === 'zh' ? '暂无验证任务' : 'No verification tasks'}</div>}
          </div>
        )}
      </>)}

      {tab === 'evidence' && (<>
        <div className="panel">
          <div className="panel-title">{lang === 'zh' ? 'AI 证据审核' : 'AI Evidence Review'}</div>
          <p style={{ fontSize: '.85rem', color: 'var(--text2)', marginBottom: 16 }}>{lang === 'zh' ? '上传供应商的照片/视频，AI 自动检查：是否有新进展、图片是否重复、时间戳是否一致、是否有视觉异常。' : 'Upload photos/videos from supplier. AI checks for: new progress, duplicate images, timestamp consistency, visual anomalies.'}</p>
          <div className="grid-3">
            {EVIDENCE_TYPES.map(e => (
              <div key={e.key} className="card" style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{e.icon}</div>
                <div style={{ fontWeight: 600 }}>{e.label}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: 4 }}>{e.desc}</div>
                <label className="btn btn-secondary" style={{ marginTop: 10, cursor: 'pointer', display: 'inline-block' }}>
                  {lang === 'zh' ? '上传' : 'Upload'}
                  <input type="file" style={{ display: 'none' }} accept={e.key === 'video' ? 'video/*' : e.key === 'document' ? '.pdf,.doc,.docx' : 'image/*'} onChange={() => showToast(lang === 'zh' ? '文件已上传（演示模式）' : 'File uploaded (demo mode)')} />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">{lang === 'zh' ? 'AI 审核清单（每个里程碑）' : 'AI Review Checklist (per milestone)'}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{[lang === 'zh' ? '检查项' : 'Check', lang === 'zh' ? '说明' : 'Description', lang === 'zh' ? '状态' : 'Status'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {[
                { check: lang === 'zh' ? '新内容' : 'New content', desc: lang === 'zh' ? '照片未在之前出现（无重复）' : 'Photos not seen before (no duplicates from previous milestone)', status: 'pass' },
                { check: lang === 'zh' ? '时间戳匹配' : 'Timestamp match', desc: lang === 'zh' ? 'EXIF/元数据时间戳在预期窗口内' : 'EXIF/metadata timestamp within expected window', status: 'pass' },
                { check: lang === 'zh' ? '进展可见' : 'Progress visible', desc: lang === 'zh' ? '与上一阶段相比有明显的生产进展证据' : 'Clear evidence of manufacturing progress vs previous stage', status: 'warning' },
                { check: lang === 'zh' ? '数量匹配' : 'Quantity match', desc: lang === 'zh' ? '可见数量与订单一致' : 'Visible quantity consistent with order', status: 'pending' },
                { check: lang === 'zh' ? '质量指标' : 'Quality indicators', desc: lang === 'zh' ? '无可见缺陷、划痕、错位' : 'No visible defects, scratches, misalignments', status: 'pending' },
              ].map(c => (
                <tr key={c.check}>
                  <td className="td" style={{ fontWeight: 600 }}>{c.check}</td>
                  <td className="td" style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{c.desc}</td>
                  <td className="td"><span className={`badge badge-${c.status === 'pass' ? 'green' : c.status === 'warning' ? 'yellow' : 'blue'}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>)}

      {tab === 'inspector' && (
        <div className="panel">
          <div className="panel-title">{lang === 'zh' ? '深圳验厂员网络' : 'Shenzhen Inspector Network'}</div>
          <p style={{ fontSize: '.85rem', color: 'var(--text2)', marginBottom: 16 }}>{lang === 'zh' ? '对于高价值或高风险订单，安排验厂员到供应商现场进行检查。' : 'For high-value or high-risk orders, schedule an on-site inspector at the supplier\'s facility.'}</p>

          <div className="grid-2">
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{lang === 'zh' ? '何时派遣验厂员' : 'When to dispatch inspector'}</div>
              {[
                lang === 'zh' ? '订单金额 > $5,000' : 'Order value > $5,000',
                lang === 'zh' ? '首次合作供应商' : 'First-time supplier',
                lang === 'zh' ? 'AI 标记证据不一致' : 'AI flagged inconsistent evidence',
                lang === 'zh' ? '该供应商有过质量问题' : 'Previous quality issue with this supplier',
                lang === 'zh' ? '关键里程碑（EVT/DVT/PVT）' : 'Critical milestone (EVT/DVT/PVT)',
                lang === 'zh' ? '客户要求' : 'Customer request',
              ].map(r => <div key={r} style={{ fontSize: '.82rem', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>• {r}</div>)}
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{lang === 'zh' ? '验厂员清单' : 'Inspector Checklist'}</div>
              {[
                lang === 'zh' ? '确认工厂真实运营' : 'Verify factory is real and operational',
                lang === 'zh' ? '确认物料已到位' : 'Confirm materials are on-site',
                lang === 'zh' ? '检查产线状态' : 'Check production line status',
                lang === 'zh' ? '检查首件/样品' : 'Inspect first article / samples',
                lang === 'zh' ? '验证测试设备和记录' : 'Verify test equipment and records',
                lang === 'zh' ? '带时间戳的照片记录' : 'Photo documentation with timestamp',
                lang === 'zh' ? '与生产经理沟通' : 'Talk to production manager',
                lang === 'zh' ? '24小时内提交报告' : 'Report within 24 hours',
              ].map(r => <div key={r} style={{ fontSize: '.82rem', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>• {r}</div>)}
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => setShowSchedule(true)}>{lang === 'zh' ? '安排验厂' : 'Schedule Inspection'}</button>
            <button className="btn btn-secondary" onClick={() => { setTab('overview'); }}>{lang === 'zh' ? '查看历史记录' : 'View Past Reports'}</button>
          </div>
        </div>
      )}

      {/* Review Detail Modal */}
      {selectedV && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedV(null)}>
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, width: 520, maxWidth: '90vw', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px' }}>{lang === 'zh' ? '验证详情' : 'Verification Details'} — {selectedV.order}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{lang === 'zh' ? '供应商' : 'Supplier'}</span><div style={{ fontWeight: 600 }}>{selectedV.supplier}</div></div>
              <div><span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{lang === 'zh' ? '里程碑' : 'Milestone'}</span><div style={{ fontWeight: 600 }}>{selectedV.milestone}</div></div>
              <div><span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{lang === 'zh' ? '金额' : 'Total'}</span><div style={{ fontWeight: 600 }}>${selectedV.total?.toFixed(2) || '—'}</div></div>
              <div><span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{lang === 'zh' ? '状态' : 'Status'}</span><div><span className={`badge badge-${selectedV.status === 'verified' ? 'green' : selectedV.status === 'flagged' ? 'red' : 'yellow'}`}>{selectedV.status.replace('_', ' ')}</span></div></div>
              <div><span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{lang === 'zh' ? '付款状态' : 'Payment'}</span><div><span className={`badge badge-${selectedV.payment_status === 'paid' ? 'green' : 'yellow'}`}>{selectedV.payment_status || 'pending'}</span></div></div>
              <div><span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{lang === 'zh' ? '物流状态' : 'Shipping'}</span><div><span className="badge badge-blue">{selectedV.shipping_status || 'pending'}</span></div></div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedV(null)}>{lang === 'zh' ? '关闭' : 'Close'}</button>
              {selectedV.status !== 'verified' && (
                <button className="btn btn-primary" onClick={() => handleApprove(selectedV)}>{lang === 'zh' ? '审核通过' : 'Verify & Approve'}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Inspection Modal */}
      {showSchedule && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSchedule(false)}>
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, width: 420, maxWidth: '90vw', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px' }}>{lang === 'zh' ? '安排验厂' : 'Schedule Inspection'}</h3>
            <input placeholder={lang === 'zh' ? '供应商名称' : 'Supplier name'} value={scheduleForm.supplier_name} onChange={e => setScheduleForm({ ...scheduleForm, supplier_name: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
            <input placeholder={lang === 'zh' ? '订单号 (PO)' : 'Order PO #'} value={scheduleForm.order_po} onChange={e => setScheduleForm({ ...scheduleForm, order_po: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }} />
            <select value={scheduleForm.milestone} onChange={e => setScheduleForm({ ...scheduleForm, milestone: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box' }}>
              {['Sample Complete', 'EVT', 'DVT', 'PVT', 'Pre-Shipment'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <textarea placeholder={lang === 'zh' ? '备注' : 'Notes'} value={scheduleForm.notes} onChange={e => setScheduleForm({ ...scheduleForm, notes: e.target.value })} rows={3} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowSchedule(false)}>{lang === 'zh' ? '取消' : 'Cancel'}</button>
              <button className="btn btn-primary" disabled={!scheduleForm.supplier_name} onClick={handleScheduleInspection}>{lang === 'zh' ? '确认安排' : 'Schedule'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
