import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

const FLOW_STEPS = [
  { num: 1, label: 'Schematic' },
  { num: 2, label: 'PCB Layout' },
  { num: 3, label: 'DRC Check' },
  { num: 4, label: 'Export Gerber' },
  { num: 5, label: 'Order PCB' },
];

export default function EdaDesignHub() {
  const [tab, setTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', format: 'tscircuit' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, tRes, sRes] = await Promise.all([
        api.fetchEdaProjects(search ? { q: search } : {}),
        api.fetchEdaTemplates(),
        api.fetchEdaStats(),
      ]);
      setProjects(pRes.items || []);
      setTemplates(tRes.items || []);
      setStats(sRes || {});
    } catch (e) { console.error('EDA load error', e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await api.createEdaProject(form);
    setShowCreate(false);
    setForm({ name: '', description: '', format: 'tscircuit' });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    await api.deleteEdaProject(id);
    load();
  };

  const handleTemplate = async (tpl) => {
    await api.createEdaProject({ name: tpl.name, description: tpl.description, format: 'tscircuit', tags: [tpl.category] });
    setTab('projects');
    load();
  };

  return (
    <div>
      <h2 className="page-title">EDA Design Hub</h2>
      <p className="page-sub">Design PCBs online, export Gerber files, and order from JLCPCB — all in one place.</p>

      <div className="panel" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,.08), rgba(168,85,247,.08))', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginBottom: 20 }}>
        {FLOW_STEPS.map((s, i) => (
          <span key={s.num} style={{ display: 'contents' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem', color: 'var(--text2)' }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.78rem', fontWeight: 700 }}>{s.num}</span>
              {s.label}
            </span>
            {i < FLOW_STEPS.length - 1 && <span style={{ color: 'var(--text3)' }}>&rarr;</span>}
          </span>
        ))}
      </div>

      <div className="kpis">
        <div className="kpi"><div className="kpi-label">Total Projects</div><div className="kpi-value">{stats.total_projects ?? 0}</div></div>
        <div className="kpi"><div className="kpi-label">Drafts</div><div className="kpi-value">{stats.drafts ?? 0}</div></div>
        <div className="kpi"><div className="kpi-label">Ordered</div><div className="kpi-value">{stats.ordered ?? 0}</div></div>
        <div className="kpi"><div className="kpi-label">Templates</div><div className="kpi-value">{templates.length}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {[{ id: 'projects', label: '📁 My Projects' }, { id: 'templates', label: '📋 Templates' }, { id: 'import', label: '📥 Import' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 18px', fontSize: '.88rem', cursor: 'pointer', border: 'none', background: 'none', color: tab === t.id ? 'var(--accent)' : 'var(--text2)', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent', fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</button>
        ))}
      </div>

      {tab === 'projects' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <input className="input" style={{ flex: 1, minWidth: 200 }} placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Project</button>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Loading...</div>}

          {!loading && projects.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 14 }}>🔌</div>
              <div style={{ fontSize: '1rem', marginBottom: 8 }}>No projects yet</div>
              <div style={{ fontSize: '.82rem', color: 'var(--text3)' }}>Create a new project or start from a template</div>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>+ Create Project</button>
            </div>
          )}

          <div className="grid-3">
            {projects.map(p => (
              <div key={p.id} className="card" style={{ cursor: 'pointer', padding: 18, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <strong style={{ fontSize: '1rem' }}>{p.name}</strong>
                  <span className={`badge badge-${p.status === 'draft' ? 'blue' : p.status === 'ordered' ? 'green' : 'yellow'}`}>{p.status}</span>
                </div>
                <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: 10, lineHeight: 1.5 }}>{p.description || 'No description'}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: '.75rem', color: 'var(--text3)', marginBottom: 12 }}>
                  <span className="badge badge-blue" style={{ textTransform: 'uppercase' }}>{p.format}</span>
                  <span>Updated {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-sm" style={{ background: 'rgba(59,130,246,.15)', color: 'var(--accent)' }}>Schematic</button>
                  <button className="btn-sm" style={{ background: 'rgba(59,130,246,.15)', color: 'var(--accent)' }}>PCB</button>
                  <button className="btn-sm" style={{ background: 'rgba(34,197,94,.15)', color: 'var(--green)' }}>Order</button>
                  <button className="btn-sm" style={{ background: 'rgba(239,68,68,.15)', color: 'var(--red)' }} onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}>Del</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'templates' && (
        <div className="grid-3">
          {templates.map(t => (
            <div key={t.id} className="card" style={{ cursor: 'pointer', padding: 16 }} onClick={() => handleTemplate(t)}>
              <strong>{t.name_zh || t.name}</strong>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)', margin: '6px 0' }}>{t.description}</div>
              <div style={{ display: 'flex', gap: 10, fontSize: '.72rem', color: 'var(--text3)' }}>
                <span>{t.layers} layers</span>
                <span>{t.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'import' && (
        <div className="panel">
          <div className="panel-title" style={{ marginBottom: 14 }}>Import Existing Design</div>
          <p style={{ color: 'var(--text2)', fontSize: '.88rem', marginBottom: 16 }}>Upload KiCad (.kicad_pcb, .kicad_sch) or Gerber files to create a project.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              Upload KiCad Files
              <input type="file" accept=".kicad_pcb,.kicad_sch,.kicad_pro" style={{ display: 'none' }} onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const res = await api.createEdaProject({ name: f.name.replace(/\.\w+$/, ''), description: `Imported from ${f.name}`, format: 'kicad' });
                if (res.id) { await api.uploadEdaKicad(res.id, f); load(); setTab('projects'); }
              }} />
            </label>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              Upload Gerber ZIP
              <input type="file" accept=".zip,.rar" style={{ display: 'none' }} onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const res = await api.createEdaProject({ name: f.name.replace(/\.\w+$/, ''), description: `Imported Gerber: ${f.name}`, format: 'gerber' });
                if (res.id) { await api.uploadEdaGerber(res.id, f); load(); setTab('projects'); }
              }} />
            </label>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 18 }}>New EDA Project</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '.8rem', color: 'var(--text2)', marginBottom: 4, display: 'block' }}>Project Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My PCB Design" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '.8rem', color: 'var(--text2)', marginBottom: 4, display: 'block' }}>Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '.8rem', color: 'var(--text2)', marginBottom: 4, display: 'block' }}>Format</label>
              <select className="select" value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}>
                <option value="tscircuit">tscircuit (React-based)</option>
                <option value="kicad">KiCad (import)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
