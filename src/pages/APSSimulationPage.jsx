import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n';
import * as api from '../api';

const OBJ_LABELS = { on_time: 'On-Time Delivery', min_cost: 'Minimize Cost', max_throughput: 'Max Throughput', balanced: 'Balanced' };
const OBJ_LABELS_ZH = { on_time: '准时交付', min_cost: '最低成本', max_throughput: '最大产能', balanced: '均衡模式' };
const STATUS_COLORS = { draft: '#6b7280', running: '#3b82f6', completed: '#22c55e', failed: '#ef4444' };
const PRIO_COLORS = { urgent: '#ef4444', high: '#f59e0b', normal: '#3b82f6', low: '#6b7280' };
const LINE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#f97316', '#84cc16'];

export default function APSSimulationPage() {
  const { lang } = useI18n();
  const zh = lang === 'zh';
  const [tab, setTab] = useState('scenarios');
  const [factories, setFactories] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(0);
  const [activeScenario, setActiveScenario] = useState(null);
  const [ganttData, setGanttData] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', horizon_days: 14, objective: 'on_time' });
  const [autoResult, setAutoResult] = useState(null);

  useEffect(() => { api.fetchMesFactories().then(setFactories).catch(() => {}); }, []);
  useEffect(() => {
    const p = selectedFactory ? { factory_id: selectedFactory } : {};
    api.fetchApsScenarios(p).then(setScenarios).catch(() => {});
  }, [selectedFactory]);

  const createScenario = useCallback(async () => {
    if (!selectedFactory) return;
    setLoading(p => ({ ...p, create: true }));
    try {
      const res = await api.createApsScenario({ factory_id: selectedFactory, ...form });
      setScenarios(prev => [{ ...res, name: form.name, objective: form.objective, horizon_days: form.horizon_days, factory_id: selectedFactory, created_at: new Date().toISOString() }, ...prev]);
      setShowCreate(false);
    } catch {}
    setLoading(p => ({ ...p, create: false }));
  }, [selectedFactory, form]);

  const runSim = useCallback(async (sid) => {
    setLoading(p => ({ ...p, [`run_${sid}`]: true }));
    try {
      const res = await api.runApsSimulation(sid);
      setScenarios(prev => prev.map(s => s.id === sid ? { ...s, status: 'completed' } : s));
      const full = await api.fetchApsScenario(sid);
      setActiveScenario(full);
      if (full.result) setGanttData({ gantt: full.result.gantt, kpi: full.result.kpi });
      setTab('gantt');
    } catch {}
    setLoading(p => ({ ...p, [`run_${sid}`]: false }));
  }, []);

  const loadGantt = useCallback(async (sid) => {
    try {
      const full = await api.fetchApsScenario(sid);
      setActiveScenario(full);
      if (full.result) { setGanttData({ gantt: full.result.gantt, kpi: full.result.kpi }); setTab('gantt'); }
    } catch {}
  }, []);

  const autoSchedule = useCallback(async () => {
    if (!selectedFactory) return;
    setLoading(p => ({ ...p, auto: true }));
    try {
      const res = await api.apsAutoSchedule(selectedFactory, form.horizon_days, form.objective);
      setAutoResult(res);
      const p = selectedFactory ? { factory_id: selectedFactory } : {};
      api.fetchApsScenarios(p).then(setScenarios).catch(() => {});
    } catch {}
    setLoading(p => ({ ...p, auto: false }));
  }, [selectedFactory, form]);

  const whatIf = useCallback(async () => {
    if (!activeScenario) return;
    setLoading(p => ({ ...p, whatif: true }));
    try {
      const res = await api.apsWhatIf({ base_scenario_id: activeScenario.id, changes: { label: 'capacity+20', add_line_capacity: 20, objective: 'max_throughput' } });
      setComparison(res);
      setTab('compare');
    } catch {}
    setLoading(p => ({ ...p, whatif: false }));
  }, [activeScenario]);

  const TABS = [
    { id: 'scenarios', label: zh ? '仿真场景' : 'Scenarios', icon: '🧪' },
    { id: 'gantt', label: zh ? '甘特图' : 'Gantt Chart', icon: '📊' },
    { id: 'compare', label: zh ? '场景对比' : 'Compare', icon: '⚖️' },
    { id: 'auto', label: zh ? '一键排产' : 'Auto Schedule', icon: '🚀' },
  ];

  const ganttMinDate = ganttData?.gantt?.length ? new Date(Math.min(...ganttData.gantt.map(g => new Date(g.start).getTime()))) : new Date();
  const ganttMaxDate = ganttData?.gantt?.length ? new Date(Math.max(...ganttData.gantt.map(g => new Date(g.end).getTime()))) : new Date();
  const ganttTotalMs = ganttMaxDate - ganttMinDate || 1;

  return (
    <div>
      <h2 className="page-title">{zh ? 'APS 高级排产仿真' : 'APS Scheduling Simulation'}</h2>
      <p className="page-sub">{zh ? '仿真排产优化 · 甘特图可视化 · What-If 分析 · 美国买家实时看板' : 'Simulation-based scheduling · Gantt visualization · What-if analysis · Real-time buyer dashboard'}</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={selectedFactory} onChange={e => setSelectedFactory(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
          <option value={0}>{zh ? '全部工厂' : 'All Factories'}</option>
          {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: 6, border: tab === t.id ? '2px solid var(--accent)' : '1px solid var(--border)', background: tab === t.id ? 'var(--accent)' : 'var(--card)', color: tab === t.id ? '#fff' : 'var(--text)', cursor: 'pointer', fontWeight: tab === t.id ? 600 : 400 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Scenarios Tab ────────────────────────────────── */}
      {tab === 'scenarios' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={() => setShowCreate(!showCreate)} style={{ padding: '8px 16px', borderRadius: 6, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
              {zh ? '+ 新建仿真场景' : '+ New Scenario'}
            </button>
          </div>

          {showCreate && (
            <div style={{ background: 'var(--card)', borderRadius: 10, padding: 20, marginBottom: 16, border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)' }}>{zh ? '场景名称' : 'Name'}</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={zh ? '仿真场景名称' : 'Scenario name'} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', marginTop: 4 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)' }}>{zh ? '排产天数' : 'Horizon (days)'}</label>
                  <input type="number" value={form.horizon_days} onChange={e => setForm({ ...form, horizon_days: +e.target.value })} min={1} max={90} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', marginTop: 4 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)' }}>{zh ? '优化目标' : 'Objective'}</label>
                  <select value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', marginTop: 4 }}>
                    {Object.entries(zh ? OBJ_LABELS_ZH : OBJ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={createScenario} disabled={loading.create || !selectedFactory} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 6, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                {loading.create ? '...' : zh ? '创建场景' : 'Create'}
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gap: 10 }}>
            {scenarios.map(s => (
              <div key={s.id} style={{ background: 'var(--card)', borderRadius: 10, padding: 16, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.name || s.scenario_key}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    <span style={{ background: STATUS_COLORS[s.status], color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{s.status}</span>
                    {' '}{(zh ? OBJ_LABELS_ZH : OBJ_LABELS)[s.objective] || s.objective} · {s.horizon_days}{zh ? '天' : 'd'}
                    {s.created_by && ` · ${s.created_by}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {s.status === 'draft' && (
                    <button onClick={() => runSim(s.id)} disabled={loading[`run_${s.id}`]} style={{ padding: '6px 14px', borderRadius: 6, background: '#22c55e', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                      {loading[`run_${s.id}`] ? '...' : zh ? '▶ 运行仿真' : '▶ Run'}
                    </button>
                  )}
                  {s.status === 'completed' && (
                    <button onClick={() => loadGantt(s.id)} style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                      {zh ? '📊 查看结果' : '📊 View'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!scenarios.length && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>{zh ? '暂无仿真场景，点击上方创建' : 'No scenarios yet. Create one above.'}</div>}
          </div>
        </div>
      )}

      {/* ── Gantt Chart Tab ────────────────────────────── */}
      {tab === 'gantt' && ganttData && (
        <div>
          {activeScenario && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>{activeScenario.name || activeScenario.scenario_key}</h3>
              <button onClick={whatIf} disabled={loading.whatif} style={{ padding: '6px 14px', borderRadius: 6, background: '#8b5cf6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                {loading.whatif ? '...' : zh ? '🔀 What-If 分析' : '🔀 What-If'}
              </button>
            </div>
          )}

          {ganttData.kpi && (
            <div className="kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
              {[
                { label: zh ? '准时率' : 'On-Time %', value: `${ganttData.kpi.on_time_rate}%`, color: ganttData.kpi.on_time_rate >= 80 ? '#22c55e' : '#f59e0b' },
                { label: zh ? '产线利用率' : 'Utilization', value: `${ganttData.kpi.utilization_avg}%`, color: '#3b82f6' },
                { label: zh ? '工单数' : 'Work Orders', value: ganttData.kpi.total_work_orders, color: '#8b5cf6' },
                { label: zh ? '瓶颈' : 'Bottlenecks', value: ganttData.kpi.bottleneck_count, color: ganttData.kpi.bottleneck_count > 0 ? '#ef4444' : '#22c55e' },
                { label: zh ? '预估成本' : 'Est. Cost', value: `$${ganttData.kpi.estimated_cost?.toLocaleString()}`, color: '#f59e0b' },
              ].map((k, i) => (
                <div key={i} style={{ background: 'var(--card)', borderRadius: 8, padding: 14, border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: k.color, marginTop: 4 }}>{k.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Interactive Gantt */}
          <div style={{ background: 'var(--card)', borderRadius: 10, padding: 16, border: '1px solid var(--border)', overflowX: 'auto' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{zh ? '排产甘特图' : 'Production Gantt Chart'}</div>
            <div style={{ minWidth: 800 }}>
              {/* Header: date ticks */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 8 }}>
                <div style={{ width: 200, flexShrink: 0, fontSize: 11, color: 'var(--muted)' }}>{zh ? '工单 / 产线' : 'WO / Line'}</div>
                <div style={{ flex: 1, position: 'relative', height: 18 }}>
                  {Array.from({ length: Math.min(15, Math.ceil((ganttMaxDate - ganttMinDate) / 86400000) + 1) }, (_, i) => {
                    const d = new Date(ganttMinDate.getTime() + i * 86400000);
                    const pct = ((d - ganttMinDate) / ganttTotalMs) * 100;
                    return <span key={i} style={{ position: 'absolute', left: `${pct}%`, fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{d.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>;
                  })}
                </div>
              </div>

              {/* Gantt bars */}
              {ganttData.gantt.map((g, idx) => {
                const start = new Date(g.start);
                const end = new Date(g.end);
                const left = ((start - ganttMinDate) / ganttTotalMs) * 100;
                const width = Math.max(2, ((end - start) / ganttTotalMs) * 100);
                const lineIdx = ganttData.lines?.indexOf(g.line_name) || 0;
                const barColor = g.on_time ? LINE_COLORS[lineIdx % LINE_COLORS.length] : '#ef4444';
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4, minHeight: 28 }}>
                    <div style={{ width: 200, flexShrink: 0, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 500 }}>{g.wo_key}</span>
                      <span style={{ color: 'var(--muted)', marginLeft: 4, fontSize: 11 }}>{g.line_name}</span>
                    </div>
                    <div style={{ flex: 1, position: 'relative', height: 22 }}>
                      <div title={`${g.product}\n${g.days}d · qty ${g.quantity}\n${g.start.slice(0, 10)} → ${g.end.slice(0, 10)}${g.delay_days ? `\n⚠ ${g.delay_days}d late` : ''}`} style={{ position: 'absolute', left: `${left}%`, width: `${width}%`, height: 20, background: barColor, borderRadius: 4, opacity: 0.85, display: 'flex', alignItems: 'center', paddingLeft: 4, fontSize: 10, color: '#fff', overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                        {g.product?.slice(0, 20)} ({g.quantity})
                        {g.delay_days > 0 && <span style={{ marginLeft: 4, background: '#ef444488', padding: '0 4px', borderRadius: 3 }}>⚠{g.delay_days}d</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!ganttData.gantt.length && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>{zh ? '无排产数据' : 'No scheduling data'}</div>}
            </div>
          </div>

          {/* Bottlenecks */}
          {activeScenario?.result?.bottlenecks?.length > 0 && (
            <div style={{ background: 'var(--card)', borderRadius: 10, padding: 16, border: '1px solid var(--border)', marginTop: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>⚠ {zh ? '瓶颈与风险' : 'Bottlenecks & Risks'}</div>
              {activeScenario.result.bottlenecks.map((b, i) => (
                <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ background: b.severity === 'critical' ? '#ef4444' : b.severity === 'high' ? '#f59e0b' : '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{b.severity}</span>
                  <span style={{ fontWeight: 500 }}>{b.work_order}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>{b.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {tab === 'gantt' && !ganttData && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 60 }}>{zh ? '请先在"仿真场景"选项卡中创建并运行一个场景' : 'Create and run a scenario from the Scenarios tab first'}</div>
      )}

      {/* ── Compare Tab ───────────────────────────────── */}
      {tab === 'compare' && (
        <div>
          {comparison ? (
            <div style={{ background: 'var(--card)', borderRadius: 10, padding: 20, border: '1px solid var(--border)' }}>
              <h3 style={{ marginTop: 0 }}>{zh ? 'What-If 对比结果' : 'What-If Comparison'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {Object.entries(comparison.kpi_comparison || {}).map(([key, val]) => (
                  <div key={key} style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{zh ? '基线' : 'Base'}</div><div style={{ fontSize: 18, fontWeight: 600 }}>{val.base}</div></div>
                      <div style={{ fontSize: 20, color: val.change > 0 ? '#22c55e' : val.change < 0 ? '#ef4444' : 'var(--muted)', fontWeight: 700, alignSelf: 'center' }}>{val.change > 0 ? '↑' : val.change < 0 ? '↓' : '='}</div>
                      <div style={{ textAlign: 'right' }}><div style={{ fontSize: 11, color: 'var(--muted)' }}>{zh ? '新方案' : 'New'}</div><div style={{ fontSize: 18, fontWeight: 600 }}>{val.new}</div></div>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: 13, color: val.change > 0 ? '#22c55e' : val.change < 0 ? '#ef4444' : 'var(--muted)', marginTop: 4 }}>
                      {val.change > 0 ? '+' : ''}{val.change}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 60 }}>{zh ? '运行 What-If 分析后查看对比' : 'Run a What-If analysis from the Gantt tab to see comparisons'}</div>
          )}
        </div>
      )}

      {/* ── Auto Schedule Tab ────────────────────────── */}
      {tab === 'auto' && (
        <div>
          <div style={{ background: 'var(--card)', borderRadius: 10, padding: 20, border: '1px solid var(--border)', marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>{zh ? '一键智能排产' : 'One-Click Auto Schedule'}</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>{zh ? 'AI 自动分析所有待排工单，按优化目标生成最优排产方案，并直接写入排产计划' : 'AI automatically analyzes all pending work orders, generates optimal schedule by objective, and writes directly to schedule entries'}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)' }}>{zh ? '排产天数' : 'Horizon'}</label>
                <input type="number" value={form.horizon_days} onChange={e => setForm({ ...form, horizon_days: +e.target.value })} min={1} max={90} style={{ display: 'block', padding: 8, borderRadius: 6, border: '1px solid var(--border)', width: 80, marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)' }}>{zh ? '目标' : 'Objective'}</label>
                <select value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} style={{ display: 'block', padding: 8, borderRadius: 6, border: '1px solid var(--border)', marginTop: 4 }}>
                  {Object.entries(zh ? OBJ_LABELS_ZH : OBJ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <button onClick={autoSchedule} disabled={loading.auto || !selectedFactory} style={{ padding: '8px 24px', borderRadius: 6, background: '#22c55e', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                {loading.auto ? '⏳ ...' : zh ? '🚀 一键排产' : '🚀 Auto Schedule'}
              </button>
            </div>
            {!selectedFactory && <p style={{ color: '#f59e0b', fontSize: 13, marginTop: 8 }}>{zh ? '请先选择工厂' : 'Select a factory first'}</p>}
          </div>

          {autoResult && (
            <div style={{ background: 'var(--card)', borderRadius: 10, padding: 20, border: '2px solid #22c55e' }}>
              <h3 style={{ marginTop: 0, color: '#22c55e' }}>✅ {zh ? '排产完成' : 'Schedule Generated'}</h3>
              <div className="kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 12, color: 'var(--muted)' }}>{zh ? '排产条目' : 'Entries'}</div><div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{autoResult.schedules_created}</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 12, color: 'var(--muted)' }}>{zh ? '工单数' : 'Work Orders'}</div><div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>{autoResult.gantt_count}</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 12, color: 'var(--muted)' }}>{zh ? '准时率' : 'OTP'}</div><div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{autoResult.kpi?.on_time_rate}%</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 12, color: 'var(--muted)' }}>{zh ? '利用率' : 'Util'}</div><div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{autoResult.kpi?.utilization_avg}%</div></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
