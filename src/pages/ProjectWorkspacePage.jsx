import { useState, useEffect, useRef } from 'react';
import * as api from '../api';

const STAGE_COLORS = {
  idea: '#a78bfa', research: '#60a5fa', design: '#34d399',
  prototype: '#fbbf24', testing: '#f97316', production: '#ef4444', shipped: '#10b981',
};

function KanbanColumn({ stage, projects, onSelect }) {
  return (
    <div style={{ minWidth: 200, background: '#1a1a2e', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: STAGE_COLORS[stage.id] || '#666' }} />
        <span style={{ fontWeight: 600 }}>{stage.label}</span>
        <span style={{ fontSize: 12, color: '#888', marginLeft: 'auto' }}>{projects.length}</span>
      </div>
      {projects.map(p => (
        <div key={p.id} onClick={() => onSelect(p)} style={{ background: '#16213e', borderRadius: 6, padding: 10, cursor: 'pointer', borderLeft: `3px solid ${STAGE_COLORS[stage.id]}` }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{p.description?.slice(0, 60)}…</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {(p.tags || []).slice(0, 3).map(t => <span key={t} style={{ background: '#2a2a4a', padding: '1px 6px', borderRadius: 4, fontSize: 10, color: '#ccc' }}>{t}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function CostChart({ costs, budget }) {
  const total = Object.values(costs || {}).reduce((a, b) => a + b, 0);
  const pct = budget > 0 ? Math.min(total / budget * 100, 100) : 0;
  const entries = Object.entries(costs || {}).sort((a, b) => b[1] - a[1]);
  const colors = ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f97316', '#ef4444', '#ec4899'];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, background: '#333', borderRadius: 4, height: 16, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pct > 90 ? '#ef4444' : '#34d399', transition: 'width .3s' }} />
        </div>
        <span style={{ fontSize: 13 }}>${total.toLocaleString()} / ${budget.toLocaleString()}</span>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {entries.map(([k, v], i) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#ccc' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: colors[i % colors.length] }} />
            {k}: ${v.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  );
}

function StageProgress({ stage, stages }) {
  const idx = stages.findIndex(s => s.id === stage);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, margin: '8px 0' }}>
      {stages.map((s, i) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600,
            background: i <= idx ? STAGE_COLORS[s.id] : '#333', color: i <= idx ? '#fff' : '#888',
          }}>{i + 1}</div>
          {i < stages.length - 1 && <div style={{ width: 20, height: 2, background: i < idx ? STAGE_COLORS[s.id] : '#333' }} />}
        </div>
      ))}
    </div>
  );
}

function ProjectDetail({ project, stages, onClose, onRefresh }) {
  if (!project) return null;
  const [adding, setAdding] = useState(false);
  const [costCat, setCostCat] = useState('');
  const [costAmt, setCostAmt] = useState('');

  const advance = async () => {
    await api.advanceProjectStage(project.id);
    onRefresh();
  };

  const addCost = async () => {
    if (!costCat || !costAmt) return;
    await api.addProjectCost(project.id, costCat, parseFloat(costAmt));
    setCostCat(''); setCostAmt(''); setAdding(false);
    onRefresh();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a2e', borderRadius: 12, padding: 24, width: 700, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h2 style={{ margin: 0 }}>{project.name}</h2>
            <p style={{ color: '#aaa', margin: '4px 0', fontSize: 14 }}>{project.description}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <StageProgress stage={project.stage} stages={stages} />

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <span style={{ background: STAGE_COLORS[project.stage], padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{project.stage?.toUpperCase()}</span>
          <button onClick={advance} style={{ background: '#2563eb', border: 'none', borderRadius: 4, color: '#fff', padding: '2px 10px', fontSize: 12, cursor: 'pointer' }}>Advance Stage {'→'}</button>
        </div>

        <h4 style={{ marginBottom: 6 }}>Cost Tracking</h4>
        <CostChart costs={project.costs} budget={project.budget_usd || 0} />
        {adding ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input value={costCat} onChange={e => setCostCat(e.target.value)} placeholder="Category" style={{ background: '#111', border: '1px solid #333', borderRadius: 4, padding: '4px 8px', color: '#fff', flex: 1 }} />
            <input type="number" value={costAmt} onChange={e => setCostAmt(e.target.value)} placeholder="Amount" style={{ background: '#111', border: '1px solid #333', borderRadius: 4, padding: '4px 8px', color: '#fff', width: 100 }} />
            <button onClick={addCost} style={{ background: '#34d399', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>Add</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ marginTop: 8, background: 'none', border: '1px dashed #555', borderRadius: 4, color: '#aaa', padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>+ Add Cost</button>
        )}

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Milestones</h4>
        {(project.milestones || []).map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>{m.done ? '✅' : '⬜'}</span>
            <span style={{ flex: 1 }}>{m.name}</span>
            <span style={{ fontSize: 11, color: '#888' }}>{m.done ? m.date : m.target}</span>
          </div>
        ))}

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Versions</h4>
        {(project.versions || []).map((v, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: '#60a5fa' }}>{v.v}</span>
            <span style={{ color: '#888' }}>{v.date}</span>
            <span>{v.note}</span>
          </div>
        ))}

        <h4 style={{ marginTop: 16, marginBottom: 6 }}>Team</h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(project.team || []).map((t, i) => (
            <div key={i} style={{ background: '#16213e', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{t.name}</span> <span style={{ color: '#888' }}>({t.role})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProjectWorkspacePage() {
  const [projects, setProjects] = useState([]);
  const [stages, setStages] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('kanban');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('consumer_electronics');
  const [newBudget, setNewBudget] = useState('');
  const [productTypes, setProductTypes] = useState([]);

  const load = () => {
    api.fetchProjects().then(r => setProjects(r.items || [])).catch(() => {});
    api.fetchProjectStages().then(r => setStages(r.stages || [])).catch(() => {});
    api.fetchProjectDashboard().then(r => setDashboard(r)).catch(() => {});
    api.fetchProductTypes().then(r => setProductTypes(r.types || [])).catch(() => {});
  };

  const loadDetail = async (p) => {
    try {
      const d = await api.fetchProject(p.id);
      setSelected(d);
    } catch { setSelected(p); }
  };

  useEffect(() => { load(); }, []);

  const createProject = async () => {
    if (!newName) return;
    await api.createProject({ name: newName, description: newDesc, product_type: newType, budget_usd: parseFloat(newBudget) || 0 });
    setShowCreate(false); setNewName(''); setNewDesc(''); setNewBudget('');
    load();
  };

  const S = { page: { padding: 24 }, hdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, btn: { background: '#2563eb', border: 'none', borderRadius: 6, color: '#fff', padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }, tab: (a) => ({ background: a ? '#2563eb' : 'transparent', border: a ? 'none' : '1px solid #444', borderRadius: 6, color: '#fff', padding: '4px 12px', cursor: 'pointer', fontSize: 13 }) };

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <h2 style={{ margin: 0 }}>Project Workspace</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.tab(view === 'kanban')} onClick={() => setView('kanban')}>Kanban</button>
          <button style={S.tab(view === 'dashboard')} onClick={() => setView('dashboard')}>Dashboard</button>
          <button style={S.btn} onClick={() => setShowCreate(true)}>+ New Project</button>
        </div>
      </div>

      {showCreate && (
        <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16, marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: '#aaa' }}>Project Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} style={{ background: '#111', border: '1px solid #333', borderRadius: 4, padding: '6px 10px', color: '#fff', width: 200 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: '#aaa' }}>Description</label>
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ background: '#111', border: '1px solid #333', borderRadius: 4, padding: '6px 10px', color: '#fff', width: 300 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: '#aaa' }}>Type</label>
            <select value={newType} onChange={e => setNewType(e.target.value)} style={{ background: '#111', border: '1px solid #333', borderRadius: 4, padding: '6px 10px', color: '#fff' }}>
              {productTypes.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: '#aaa' }}>Budget ($)</label>
            <input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} style={{ background: '#111', border: '1px solid #333', borderRadius: 4, padding: '6px 10px', color: '#fff', width: 120 }} />
          </div>
          <button onClick={createProject} style={S.btn}>Create</button>
          <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: '1px solid #555', borderRadius: 6, color: '#aaa', padding: '8px 12px', cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      {view === 'kanban' && (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
          {stages.map(s => (
            <KanbanColumn key={s.id} stage={s} projects={projects.filter(p => p.stage === s.id)} onSelect={loadDetail} />
          ))}
        </div>
      )}

      {view === 'dashboard' && dashboard && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{dashboard.total_projects}</div>
              <div style={{ color: '#aaa', fontSize: 13 }}>Total Projects</div>
            </div>
            <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#34d399' }}>${dashboard.total_spent_usd?.toLocaleString()}</div>
              <div style={{ color: '#aaa', fontSize: 13 }}>Total Spent</div>
            </div>
            <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#60a5fa' }}>${dashboard.total_budget_usd?.toLocaleString()}</div>
              <div style={{ color: '#aaa', fontSize: 13 }}>Total Budget</div>
            </div>
            <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>{dashboard.by_stage?.prototype || 0}</div>
              <div style={{ color: '#aaa', fontSize: 13 }}>In Prototype</div>
            </div>
          </div>
          <h3>Stage Distribution</h3>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {stages.map(s => {
              const count = dashboard.by_stage?.[s.id] || 0;
              return (
                <div key={s.id} style={{ flex: 1, background: '#1a1a2e', borderRadius: 6, padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: STAGE_COLORS[s.id] }}>{count}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{s.label}</div>
                </div>
              );
            })}
          </div>
          <h3>Recent Projects</h3>
          {(dashboard.recent || []).map(p => (
            <div key={p.id} onClick={() => loadDetail(p)} style={{ background: '#1a1a2e', borderRadius: 6, padding: 12, marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                <span style={{ marginLeft: 8, background: STAGE_COLORS[p.stage], padding: '1px 8px', borderRadius: 4, fontSize: 11 }}>{p.stage}</span>
              </div>
              <span style={{ color: '#888', fontSize: 12 }}>{p.updated_at?.slice(0, 10)}</span>
            </div>
          ))}
        </div>
      )}

      {selected && <ProjectDetail project={selected} stages={stages} onClose={() => setSelected(null)} onRefresh={() => { load(); api.fetchProject(selected.id).then(setSelected).catch(() => {}); }} />}
    </div>
  );
}
