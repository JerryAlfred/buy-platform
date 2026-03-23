import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

export default function CrawlerPage() {
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ preset: 'both', platform: '1688', target_count: 200 });
  const [importing, setImporting] = useState(null);

  const load = useCallback(() => {
    api.fetchCrawlerJobs().then(d => setJobs(d.jobs || [])).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!activeJob || !['running', 'queued'].includes(activeJob.status)) return;
    const iv = setInterval(() => {
      api.getCrawlerJob(activeJob.job_id).then(d => {
        setActiveJob(d);
        if (d.status !== 'running' && d.status !== 'queued') { clearInterval(iv); load(); }
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(iv);
  }, [activeJob, load]);

  const handleStart = async () => {
    const job = await api.startCrawler(form);
    setActiveJob(job);
    setShowCreate(false);
    load();
  };

  const handleImport = async (jobId) => {
    setImporting(jobId);
    try {
      const result = await api.importCrawler(jobId);
      alert(`Imported: ${result.imported_suppliers} suppliers, ${result.imported_listings} listings (skipped ${result.skipped})`);
      load();
    } catch (e) { alert('Import failed: ' + e.message); }
    setImporting(null);
  };

  const PRESETS = [
    { value: 'robotics', label: 'Robotics Only' },
    { value: 'consumer_electronics', label: 'Consumer Electronics Only' },
    { value: 'both', label: 'Both (Robotics + Electronics)' },
  ];
  const PLATFORMS = [
    { value: '1688', label: '1688 (Chinese)' },
    { value: 'alibaba', label: 'Alibaba (International)' },
    { value: 'both', label: 'Both Platforms' },
  ];

  const Badge = ({ status }) => {
    const c = { completed: 'var(--green)', running: 'var(--purple)', queued: 'var(--yellow)', failed: 'var(--red)' };
    return <span className={`badge badge-${status === 'completed' ? 'green' : status === 'running' ? 'purple' : status === 'failed' ? 'red' : 'yellow'}`}>{status}</span>;
  };

  return (
    <>
      <h2 className="page-title">Batch Supplier Crawler</h2>
      <p className="page-sub">Automatically crawl 100–1000 suppliers from 1688 and Alibaba with pre-configured keyword sets</p>

      <div className="kpis">
        {[
          { l: 'Total Jobs', v: jobs.length, c: 'var(--accent)' },
          { l: 'Suppliers Crawled', v: jobs.reduce((s, j) => s + (j.suppliers_found || 0), 0), c: 'var(--green)' },
          { l: 'Products Found', v: jobs.reduce((s, j) => s + (j.products_found || 0), 0), c: 'var(--purple)' },
          { l: 'Running', v: jobs.filter(j => j.status === 'running').length, c: 'var(--yellow)' },
        ].map(k => <div key={k.l} className="kpi"><div className="kpi-label">{k.l}</div><div className="kpi-value" style={{ color: k.c }}>{k.v}</div></div>)}
      </div>

      {activeJob && ['running', 'queued'].includes(activeJob.status) && (
        <div className="panel" style={{ borderColor: 'rgba(168,85,247,.4)' }}>
          <div className="panel-header">
            <span className="panel-title" style={{ color: 'var(--purple)' }}>Crawling in Progress...</span>
            <Badge status={activeJob.status} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', marginBottom: 6 }}>
              <span>Keyword: <strong>{activeJob.current_keyword || '—'}</strong></span>
              <span>{activeJob.keywords_done} / {activeJob.keywords_total} keywords</span>
            </div>
            <div className="progress"><div className="progress-fill" style={{ width: `${(activeJob.progress || 0) * 100}%`, background: 'linear-gradient(90deg, #a855f7, #3b82f6)' }} /></div>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: '.88rem' }}>
            <span>Suppliers: <strong style={{ color: 'var(--green)' }}>{activeJob.suppliers_found}</strong> / {activeJob.target_count}</span>
            <span>Products: <strong>{activeJob.products_found}</strong></span>
          </div>
          {activeJob.errors?.length > 0 && (
            <div style={{ marginTop: 10, fontSize: '.78rem', color: 'var(--red)' }}>
              Last error: {activeJob.errors[activeJob.errors.length - 1]}
            </div>
          )}
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Start New Crawl</span>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>🕷️ Start Crawl</button>
        </div>
        <div style={{ fontSize: '.88rem', color: 'var(--text2)', lineHeight: 1.6 }}>
          Pre-configured keyword sets cover:
          <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
            <div><strong>Robotics:</strong> grippers, servo motors, reducers, encoders, AGV chassis, ROS boards, depth cameras...</div>
            <div><strong>Consumer Electronics:</strong> PCBs, batteries, LCDs, touch screens, BT/WiFi modules, connectors, enclosures...</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Crawl History ({jobs.length})</span>
          <button className="btn btn-secondary" onClick={load}>Refresh</button>
        </div>
        {jobs.length ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Job ID', 'Preset', 'Platform', 'Target', 'Found', 'Products', 'Status', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.job_id}>
                  <td className="td" style={{ fontFamily: 'monospace', fontSize: '.8rem' }}>{j.job_id}</td>
                  <td className="td">{j.preset}</td>
                  <td className="td">{j.platform}</td>
                  <td className="td">{j.target_count}</td>
                  <td className="td" style={{ fontWeight: 600, color: 'var(--green)' }}>{j.suppliers_found}</td>
                  <td className="td">{j.products_found}</td>
                  <td className="td"><Badge status={j.status} /></td>
                  <td className="td">
                    <div style={{ display: 'flex', gap: 6 }}>
                      {j.status === 'completed' && <button className="btn btn-primary" style={{ padding: '3px 10px', fontSize: '.78rem' }} onClick={() => handleImport(j.job_id)} disabled={importing === j.job_id}>{importing === j.job_id ? 'Importing...' : 'Import'}</button>}
                      {j.status === 'completed' && <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '.78rem' }} onClick={() => setActiveJob(j)}>View</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🕷️</div>
            <div>No crawl jobs yet — start your first batch crawl!</div>
          </div>
        )}
      </div>

      {activeJob?.suppliers?.length > 0 && activeJob.status === 'completed' && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Crawled Suppliers Preview ({activeJob.suppliers_found})</span>
            <button className="btn btn-secondary" onClick={() => setActiveJob(null)}>Close</button>
          </div>
          <div style={{ maxHeight: 500, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Supplier', 'Platform', 'Location', 'Products', 'Top Product'].map(h => <th key={h} className="th" style={{ position: 'sticky', top: 0, background: 'var(--card)' }}>{h}</th>)}</tr></thead>
              <tbody>
                {activeJob.suppliers.map((s, i) => (
                  <tr key={i}>
                    <td className="td" style={{ fontWeight: 600 }}>{s.name}</td>
                    <td className="td">{s.platform}</td>
                    <td className="td">{s.location}</td>
                    <td className="td">{s.product_count}</td>
                    <td className="td" style={{ fontSize: '.82rem' }}>{s.top_product || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>New Crawl Job</h3>
            <label style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Industry Preset</label>
            <select className="select" value={form.preset} onChange={e => setForm({ ...form, preset: e.target.value })} style={{ width: '100%', marginBottom: 12 }}>
              {PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <label style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Platform</label>
            <select className="select" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} style={{ width: '100%', marginBottom: 12 }}>
              {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <label style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Target Suppliers</label>
            <input className="input" type="number" min={50} max={1000} value={form.target_count} onChange={e => setForm({ ...form, target_count: Number(e.target.value) })} style={{ width: '100%', marginBottom: 16 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStart}>Start Crawl</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
