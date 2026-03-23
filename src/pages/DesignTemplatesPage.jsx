import { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const DIFF_COLORS = { beginner: 'badge-green', intermediate: 'badge-blue', advanced: 'badge-yellow' };

export default function DesignTemplatesPage() {
  const { lang } = useI18n();
  const DIFF_LABELS = { beginner: lang === 'zh' ? '入门' : 'Beginner', intermediate: lang === 'zh' ? '进阶' : 'Intermediate', advanced: lang === 'zh' ? '高级' : 'Advanced' };
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [detail, setDetail] = useState(null);
  const [tab, setTab] = useState('browse');
  const [tutorials, setTutorials] = useState([]);
  const [expandedTut, setExpandedTut] = useState(null);

  useEffect(() => {
    api.fetchDesignTemplateCategories().then(r => setCategories(r.categories || [])).catch(() => {});
    api.fetchDesignTemplateFeatured().then(r => setFeatured(r.featured || [])).catch(() => {});
    api.fetchDesignTemplateStats().then(setStats).catch(() => {});
    api.fetchDesignTemplateTutorials().then(r => setTutorials(r.tutorials || [])).catch(() => {});
  }, []);

  useEffect(() => {
    api.fetchDesignTemplates({ category: selectedCat, difficulty, search }).then(r => setTemplates(r.items || [])).catch(() => {});
  }, [selectedCat, difficulty, search]);

  const openDetail = async (id) => {
    const res = await api.fetchDesignTemplateDetail(id);
    setDetail(res);
  };

  const TABS = [
    { id: 'browse', label: 'Browse Templates' },
    { id: 'featured', label: 'Featured' },
    { id: 'tutorials', label: 'Tutorials' },
  ];

  return (
    <div>
      <h2 className="page-title">{lang === 'zh' ? '📐 开源设计模板库' : '📐 Open Source Design Templates'}</h2>
      <p className="page-sub">{lang === 'zh' ? 'EDA 原理图、PCB 版图、3D CAD 模型、机器人设计 — 来自开源社区的设计模板与教程' : 'EDA schematics, PCB layouts, 3D CAD models, robot designs, and step-by-step tutorials from the open source community.'}</p>

      {stats && (
        <div className="kpis" style={{ marginBottom: 16 }}>
          <div className="kpi"><div className="kpi-value">{stats.total_templates}</div><div className="kpi-label">Templates</div></div>
          <div className="kpi"><div className="kpi-value">{stats.tutorials}</div><div className="kpi-label">Tutorials</div></div>
          <div className="kpi"><div className="kpi-value">{stats.robot_designs}</div><div className="kpi-label">Robot Designs</div></div>
          <div className="kpi"><div className="kpi-value">{stats.categories}</div><div className="kpi-label">Categories</div></div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 16px', fontSize: '.85rem', cursor: 'pointer', border: 'none', background: 'none', color: tab === t.id ? 'var(--accent)' : 'var(--text2)', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent', fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</button>
        ))}
      </div>

      {detail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDetail(null)}>
          <div className="panel" style={{ maxWidth: 700, maxHeight: '85vh', overflow: 'auto', padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: '0 0 4px' }}>{detail.name_zh || detail.name}</h3>
                <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{detail.name}</div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setDetail(null)}>x</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span className={`badge ${DIFF_COLORS[detail.difficulty] || ''}`}>{DIFF_LABELS[detail.difficulty] || detail.difficulty}</span>
              <span className="badge">{detail.format}</span>
              <span className="badge">{detail.license}</span>
              {detail.stars > 0 && <span className="badge">{'*'} {detail.stars}</span>}
              {detail.cost_usd && <span className="badge badge-green">${detail.cost_usd}</span>}
            </div>

            <p style={{ fontSize: '.9rem', lineHeight: 1.6, color: 'var(--text2)' }}>{detail.description_zh || detail.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ fontSize: '.82rem' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Source</div>
                <div>{detail.source}</div>
                <a href={detail.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: '.78rem' }}>{detail.source_url}</a>
              </div>
              <div style={{ fontSize: '.82rem' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Files</div>
                {(detail.files || []).map((f, i) => <div key={i} style={{ color: 'var(--text2)' }}>{f}</div>)}
              </div>
            </div>

            {detail.specs && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: 6 }}>Specifications</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {Object.entries(detail.specs).map(([k, v]) => (
                    <div key={k} style={{ padding: '4px 10px', background: 'var(--bg)', borderRadius: 6, fontSize: '.82rem' }}>
                      <span style={{ color: 'var(--text3)' }}>{k}: </span><strong>{v}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.steps && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: 8 }}>Tutorial Steps</div>
                {detail.steps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                    <div><div style={{ fontSize: '.88rem' }}>{s.title_zh || s.title}</div><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{s.title}</div></div>
                  </div>
                ))}
              </div>
            )}

            {(detail.tags || []).length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {detail.tags.map(t => <span key={t} className="badge" style={{ fontSize: '.72rem' }}>{t}</span>)}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              {detail.source_url && <a href={detail.source_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none' }}>View on GitHub</a>}
              {detail.tutorial_url && <a href={detail.tutorial_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Open Tutorial</a>}
              {detail.is_platform_template && <button className="btn btn-primary">Use in CAD Designer</button>}
            </div>

            {detail.related && detail.related.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: 8 }}>Related Templates</div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                  {detail.related.map(r => (
                    <div key={r.id} style={{ minWidth: 180, padding: 8, background: 'var(--bg)', borderRadius: 6, cursor: 'pointer', fontSize: '.82rem' }} onClick={() => openDetail(r.id)}>
                      <strong>{r.name_zh || r.name}</strong>
                      <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{r.source}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'browse' && (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
          <div>
            <div className="panel" style={{ padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.85rem' }}>Categories</div>
              <div style={{ padding: '5px 8px', fontSize: '.78rem', cursor: 'pointer', borderRadius: 5, fontWeight: !selectedCat ? 700 : 400, color: !selectedCat ? 'var(--accent)' : 'var(--text)' }} onClick={() => setSelectedCat('')}>All ({templates.length})</div>
              {categories.map(c => (
                <div key={c.id} style={{ padding: '5px 8px', fontSize: '.78rem', cursor: 'pointer', borderRadius: 5, fontWeight: selectedCat === c.id ? 700 : 400, color: selectedCat === c.id ? 'var(--accent)' : 'var(--text)' }} onClick={() => setSelectedCat(c.id)}>
                  {c.icon} {c.label_zh} ({c.count})
                </div>
              ))}
            </div>
            <div className="panel" style={{ padding: 12, marginTop: 10 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.85rem' }}>Difficulty</div>
              {['', 'beginner', 'intermediate', 'advanced'].map(d => (
                <div key={d} style={{ padding: '4px 8px', fontSize: '.78rem', cursor: 'pointer', borderRadius: 5, fontWeight: difficulty === d ? 700 : 400, color: difficulty === d ? 'var(--accent)' : 'var(--text)' }} onClick={() => setDifficulty(d)}>
                  {d ? DIFF_LABELS[d] : 'All Levels'}
                </div>
              ))}
            </div>
          </div>

          <div>
            <input className="input" placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 14, fontSize: '.88rem' }} />
            <div className="grid-2">
              {templates.map(t => (
                <div key={t.id} className="card" style={{ padding: 14, cursor: 'pointer' }} onClick={() => openDetail(t.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <strong style={{ fontSize: '.9rem' }}>{t.name_zh || t.name}</strong>
                    {t.is_tutorial && <span className="badge badge-blue" style={{ fontSize: '.68rem' }}>Tutorial</span>}
                    {t.is_platform_template && <span className="badge badge-green" style={{ fontSize: '.68rem' }}>Built-in</span>}
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginBottom: 8, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description_zh || t.description}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span className={`badge ${DIFF_COLORS[t.difficulty] || ''}`} style={{ fontSize: '.68rem' }}>{DIFF_LABELS[t.difficulty] || ''}</span>
                    <span className="badge" style={{ fontSize: '.68rem' }}>{t.format}</span>
                    <span className="badge" style={{ fontSize: '.68rem' }}>{t.license}</span>
                  </div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>
                    Source: {t.source}
                    {t.stars > 0 && <span> | {'*'}{t.stars}</span>}
                  </div>
                </div>
              ))}
            </div>
            {templates.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No templates found</div>}
          </div>
        </div>
      )}

      {tab === 'featured' && (
        <div>
          <div style={{ marginBottom: 16, fontSize: '.88rem', color: 'var(--text2)' }}>Handpicked open-source designs for robotics developers</div>
          <div className="grid-2">
            {featured.map(t => (
              <div key={t.id} className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => openDetail(t.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <strong style={{ fontSize: '1rem' }}>{t.name_zh || t.name}</strong>
                    <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{t.name}</div>
                  </div>
                  {t.stars > 0 && <span className="badge" style={{ fontSize: '.75rem' }}>{'*'} {t.stars}</span>}
                </div>
                <p style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.5, marginBottom: 10 }}>{t.description_zh || t.description}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span className={`badge ${DIFF_COLORS[t.difficulty] || ''}`}>{DIFF_LABELS[t.difficulty]}</span>
                  <span className="badge">{t.format}</span>
                  <span className="badge">{t.license}</span>
                  {t.cost_usd && <span className="badge badge-green">${t.cost_usd}</span>}
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>
                  Source: {t.source} | <a href={t.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }} onClick={e => e.stopPropagation()}>View</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'tutorials' && (
        <div>
          <div style={{ marginBottom: 16, fontSize: '.88rem', color: 'var(--text2)' }}>Step-by-step guides from beginner to advanced</div>
          {tutorials.map(t => (
            <div key={t.id} className="panel" style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => setExpandedTut(expandedTut === t.id ? null : t.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '.95rem' }}>{t.name_zh || t.name}</strong>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: 2 }}>{t.description_zh}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${DIFF_COLORS[t.difficulty]}`}>{DIFF_LABELS[t.difficulty]}</span>
                  <span style={{ fontSize: '.82rem', color: 'var(--text3)' }}>{(t.steps || []).length} steps</span>
                  <span style={{ color: 'var(--text3)' }}>{expandedTut === t.id ? '\u25B2' : '\u25BC'}</span>
                </div>
              </div>
              {expandedTut === t.id && t.steps && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  {t.steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < t.steps.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.78rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '.88rem', fontWeight: 500 }}>{s.title_zh || s.title}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{s.title}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    {t.source_url && <a href={t.source_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none', fontSize: '.82rem' }}>Open Resource</a>}
                    {t.tutorial_url && <a href={t.tutorial_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ textDecoration: 'none', fontSize: '.82rem' }}>Start Tutorial</a>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
