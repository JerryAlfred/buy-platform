import { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from './i18n';
import { useAuth } from './auth';
import * as api from './api';

const EXAMPLES = {
  en: [
    'I want to buy 10 Unitree G1 humanoid robots',
    'Find servo motor suppliers in Shenzhen under $15/unit',
    'Create an RFQ for 200 brushless DC motors',
    'Show me all orders',
    'Schedule pre-shipment inspection for order #7',
    'Create a work order: 500 servo motors, high priority, factory #1',
    'Check inventory for factory #1',
    'Trace production status for PO #1',
    'Predict quote for 300 grippers',
    'Show me AI production analytics',
    'Auto-schedule all pending orders for factory #1',
    'Show buyer schedule for PO #3',
  ],
  zh: [
    '我想买10台 Unitree G1 人形机器人',
    '帮我找深圳的伺服电机供应商，单价15美金以内',
    '创建询价：200个无刷直流电机',
    '显示所有订单',
    '安排订单 #7 的出货前检验',
    '创建工单：500个伺服电机，高优先级，工厂 #1',
    '查一下工厂 #1 的库存',
    '追踪采购订单 #1 的生产状态',
    '帮我预测 300 个夹爪的报价',
    '展示 AI 生产分析数据',
    '一键排产工厂 #1 所有待排工单',
    '查看买家排产看板 PO #3',
  ],
};

const ACTION_LABELS = {
  en: {
    create_rfq: 'RFQ created', add_insight: 'Insight added', start_negotiation: 'Negotiation started',
    approve_milestone: 'Milestone approved', schedule_inspection: 'Inspection scheduled',
    create_order: 'Order created', create_quality_report: 'Quality report', navigate: 'Navigate',
    search_suppliers: 'Suppliers found', present_quotes: 'Quotes ready', order_summary: 'Order summary',
    mes_create_work_order: 'Work order created', mes_check_inventory: 'Inventory checked',
    mes_create_inspection: 'QC inspection created', mes_trace_order: 'Order traced',
    aps_auto_schedule: 'Auto-scheduled', aps_buyer_view: 'Buyer schedule loaded',
  },
  zh: {
    create_rfq: '询价已创建', add_insight: '洞察已添加', start_negotiation: '议价已发起',
    approve_milestone: '里程碑已审批', schedule_inspection: '验厂已安排',
    create_order: '订单已创建', create_quality_report: '质量报告', navigate: '跳转',
    search_suppliers: '供应商已搜索', present_quotes: '报价已就绪', order_summary: '订单确认',
    mes_create_work_order: '工单已创建', mes_check_inventory: '库存已查询',
    mes_create_inspection: '质检记录已创建', mes_trace_order: '订单已追溯',
    aps_auto_schedule: '已自动排产', aps_buyer_view: '买家排产已加载',
  },
};

const STAGE_LABELS = {
  en: { gathering: '📋 Collecting Requirements', searching: '🔍 Searching Suppliers', quoting: '💰 Comparing Quotes', confirming: '✅ Confirm Order', ordered: '🎉 Order Placed' },
  zh: { gathering: '📋 收集需求', searching: '🔍 搜索供应商中', quoting: '💰 报价对比', confirming: '✅ 确认下单', ordered: '🎉 下单成功' },
};

const css = {
  card: { padding: '10px 12px', background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: 10, marginTop: 8 },
  btn: (primary) => ({
    padding: '6px 14px', borderRadius: 7, border: primary ? 'none' : '1px solid var(--border)',
    background: primary ? 'linear-gradient(135deg,#3b82f6,#a855f7)' : 'var(--bg)',
    color: primary ? '#fff' : 'var(--text2)', fontWeight: 600, cursor: 'pointer', fontSize: '.78rem',
    transition: 'all .15s',
  }),
  tag: (color) => ({
    display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: '.68rem',
    background: `${color}15`, color, fontWeight: 600,
  }),
};

function GatheringCard({ flow, lang }) {
  const collected = flow?.collected || {};
  const needs = flow?.needs || [];
  const fields = { product: lang === 'zh' ? '产品' : 'Product', quantity: lang === 'zh' ? '数量' : 'Qty', budget: lang === 'zh' ? '预算' : 'Budget', specs: lang === 'zh' ? '规格' : 'Specs', timeline: lang === 'zh' ? '交期' : 'Timeline', location: lang === 'zh' ? '地区偏好' : 'Location' };
  return (
    <div style={css.card}>
      <div style={{ fontWeight: 700, fontSize: '.8rem', marginBottom: 6 }}>
        {lang === 'zh' ? '📋 需求清单' : '📋 Requirement Checklist'}
      </div>
      {Object.entries(fields).map(([k, label]) => {
        const val = collected[k];
        const missing = needs.includes(k);
        return (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: '.78rem' }}>
            <span style={{ width: 16, textAlign: 'center' }}>{val ? '✅' : missing ? '⬜' : '➖'}</span>
            <span style={{ color: 'var(--text3)', minWidth: 52 }}>{label}</span>
            <span style={{ color: val ? 'var(--text)' : 'var(--text3)', fontWeight: val ? 600 : 400 }}>
              {val || (missing ? (lang === 'zh' ? '待确认' : 'Needed') : '—')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function QuoteCard({ quotes, lang, onSelect }) {
  if (!quotes?.length) return null;
  return (
    <div style={css.card}>
      <div style={{ fontWeight: 700, fontSize: '.8rem', marginBottom: 6 }}>
        {lang === 'zh' ? '💰 供应商报价对比' : '💰 Supplier Quote Comparison'}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.76rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
              <th style={{ textAlign: 'left', padding: '5px 6px' }}>#</th>
              <th style={{ textAlign: 'left', padding: '5px 6px' }}>{lang === 'zh' ? '供应商' : 'Supplier'}</th>
              <th style={{ textAlign: 'right', padding: '5px 6px' }}>{lang === 'zh' ? '单价' : 'Price'}</th>
              <th style={{ textAlign: 'right', padding: '5px 6px' }}>MOQ</th>
              <th style={{ textAlign: 'right', padding: '5px 6px' }}>{lang === 'zh' ? '交期' : 'Lead'}</th>
              <th style={{ textAlign: 'center', padding: '5px 6px' }}>{lang === 'zh' ? '评分' : 'Rating'}</th>
              <th style={{ padding: '5px 6px' }}></th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '6px', fontWeight: 700, color: 'var(--accent)' }}>{i + 1}</td>
                <td style={{ padding: '6px' }}>
                  <div style={{ fontWeight: 600 }}>{q.supplier}</div>
                  <div style={{ fontSize: '.68rem', color: 'var(--text3)' }}>{q.location}</div>
                </td>
                <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700, color: '#22c55e' }}>${q.price}</td>
                <td style={{ padding: '6px', textAlign: 'right' }}>{q.moq}</td>
                <td style={{ padding: '6px', textAlign: 'right' }}>{q.lead_days}{lang === 'zh' ? '天' : 'd'}</td>
                <td style={{ padding: '6px', textAlign: 'center' }}>{'⭐'.repeat(Math.min(Math.round(q.rating || 0), 5))}</td>
                <td style={{ padding: '6px' }}>
                  <button onClick={() => onSelect(q, i)} style={css.btn(i === 0)}>
                    {lang === 'zh' ? '选择' : 'Select'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderSummaryCard({ summary, lang, onConfirm, onCancel }) {
  if (!summary) return null;
  return (
    <div style={{ ...css.card, border: '1px solid rgba(34,197,94,.3)', background: 'rgba(34,197,94,.04)' }}>
      <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>📦</span>
        {lang === 'zh' ? '订单确认' : 'Order Confirmation'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '.78rem', marginBottom: 10 }}>
        <div><span style={{ color: 'var(--text3)' }}>{lang === 'zh' ? '供应商：' : 'Supplier: '}</span><b>{summary.supplier}</b></div>
        <div><span style={{ color: 'var(--text3)' }}>{lang === 'zh' ? '产品：' : 'Product: '}</span><b>{summary.product}</b></div>
        <div><span style={{ color: 'var(--text3)' }}>{lang === 'zh' ? '数量：' : 'Qty: '}</span><b>{summary.quantity}</b></div>
        <div><span style={{ color: 'var(--text3)' }}>{lang === 'zh' ? '单价：' : 'Unit: '}</span><b style={{ color: '#22c55e' }}>${summary.unit_price}</b></div>
        <div><span style={{ color: 'var(--text3)' }}>{lang === 'zh' ? '总价：' : 'Total: '}</span><b style={{ color: '#22c55e', fontSize: '.9rem' }}>${summary.total}</b></div>
        <div><span style={{ color: 'var(--text3)' }}>{lang === 'zh' ? '交期：' : 'Lead: '}</span><b>{summary.lead_days}{lang === 'zh' ? '天' : ' days'}</b></div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onConfirm} style={css.btn(true)}>
          {lang === 'zh' ? '✅ 确认下单' : '✅ Confirm Order'}
        </button>
        <button onClick={onCancel} style={css.btn(false)}>
          {lang === 'zh' ? '❌ 取消' : '❌ Cancel'}
        </button>
      </div>
    </div>
  );
}

function SupplierSearchCard({ suppliers, lang }) {
  if (!suppliers?.length) return null;
  return (
    <div style={css.card}>
      <div style={{ fontWeight: 700, fontSize: '.8rem', marginBottom: 6 }}>
        {lang === 'zh' ? `🔍 找到 ${suppliers.length} 家供应商` : `🔍 Found ${suppliers.length} suppliers`}
      </div>
      {suppliers.slice(0, 5).map((s, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < Math.min(suppliers.length, 5) - 1 ? '1px solid var(--border)' : 'none', fontSize: '.76rem' }}>
          <div>
            <span style={{ fontWeight: 600 }}>{s.name}</span>
            <span style={{ color: 'var(--text3)', marginLeft: 6 }}>{s.location || s.platform}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {s.quality_score != null && <span style={css.tag('#3b82f6')}>Q:{s.quality_score}</span>}
            {s.price_score != null && <span style={css.tag('#22c55e')}>P:{s.price_score}</span>}
            {s.total_orders != null && <span style={css.tag('#a855f7')}>{s.total_orders} orders</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderCreatedCard({ results, lang }) {
  const oc = results?.order_created;
  const rc = results?.rfq_created;
  if (!oc && !rc) return null;
  return (
    <div style={{ ...css.card, border: '1px solid rgba(34,197,94,.3)', background: 'rgba(34,197,94,.06)' }}>
      <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#22c55e', marginBottom: 6 }}>
        🎉 {lang === 'zh' ? '下单成功！' : 'Order Placed!'}
      </div>
      {oc && <div style={{ fontSize: '.78rem' }}>{lang === 'zh' ? '订单编号：' : 'Order ID: '}<b>#{oc.id}</b></div>}
      {rc && <div style={{ fontSize: '.78rem' }}>{lang === 'zh' ? '询价编号：' : 'RFQ: '}<b>{rc.key}</b></div>}
      <div style={{ marginTop: 6, fontSize: '.72rem', color: 'var(--text3)' }}>
        {lang === 'zh' ? '您可以随时在订单页面查看进度' : 'Track progress in the Orders page anytime'}
      </div>
    </div>
  );
}

function StageIndicator({ stage, lang }) {
  if (!stage) return null;
  const labels = STAGE_LABELS[lang] || STAGE_LABELS.en;
  const stages = ['gathering', 'searching', 'quoting', 'confirming', 'ordered'];
  const idx = stages.indexOf(stage);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, fontSize: '.7rem' }}>
      {stages.map((s, i) => (
        <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{
            width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.62rem', fontWeight: 700,
            background: i <= idx ? 'var(--accent)' : 'var(--border)', color: i <= idx ? '#fff' : 'var(--text3)',
          }}>{i < idx ? '✓' : i + 1}</span>
          {i < stages.length - 1 && <span style={{ width: 12, height: 1, background: i < idx ? 'var(--accent)' : 'var(--border)' }} />}
        </span>
      ))}
      <span style={{ marginLeft: 6, fontWeight: 600, color: 'var(--accent)' }}>{labels[stage] || stage}</span>
    </div>
  );
}

export default function AgentBar({ onNavigate, collapsed, onToggle }) {
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [tab, setTab] = useState('chat');
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [currentFlow, setCurrentFlow] = useState(null);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await api.fetchAgentAudit({ limit: 30, session_id: sessionId || '' });
      setAuditLogs(res.logs || []);
    } catch { setAuditLogs([]); }
    setAuditLoading(false);
  }, [sessionId]);

  useEffect(() => { if (tab === 'audit') loadAudit(); }, [tab, loadAudit]);

  const doSend = useCallback(async (text) => {
    if (!text?.trim() || thinking) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: text.trim() }]);
    setThinking(true);

    const history = messages.slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.text || m.reply || '' }));

    try {
      const resp = await api.agentChat(text.trim(), lang, { user_id: user?.id, user_role: user?.role }, history, sessionId);
      if (resp.session_id && !sessionId) setSessionId(resp.session_id);

      const flow = resp.flow || {};
      if (flow.stage) setCurrentFlow(flow);
      if (flow.stage === 'ordered') setTimeout(() => setCurrentFlow(null), 5000);

      const navAction = (resp.actions || []).find(a => a.type === 'navigate');
      const executed = resp.results?.executed || [];
      const hasExec = executed.some(e => e.success);

      const meta = [];
      if (resp.llm_provider && resp.llm_provider !== 'none') meta.push(`🧠 ${resp.llm_provider}`);
      if (resp.execution_ms) meta.push(`⚡ ${resp.execution_ms}ms`);

      setMessages(prev => [...prev, {
        role: 'agent', text: resp.reply, intent: resp.intent, hasExec, meta: meta.join(' · '),
        flow, results: resp.results || {}, actions: resp.actions || [],
        action: navAction ? `navigate:${navAction.page}` : null,
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'agent', text: lang === 'zh' ? `后端暂不可用 (${e.message})` : `Backend unavailable (${e.message})`, intent: 'error',
      }]);
    } finally {
      setThinking(false);
    }
  }, [thinking, lang, user, messages, sessionId]);

  const handleSend = useCallback(() => doSend(input), [doSend, input]);

  const handleQuoteSelect = (quote, idx) => {
    const text = lang === 'zh'
      ? `我选择第 ${idx + 1} 个供应商 ${quote.supplier}，单价 $${quote.price}`
      : `I'll go with supplier #${idx + 1} ${quote.supplier} at $${quote.price}`;
    doSend(text);
  };

  const handleOrderConfirm = () => {
    doSend(lang === 'zh' ? '确认下单' : 'Yes, confirm the order');
  };
  const handleOrderCancel = () => {
    doSend(lang === 'zh' ? '先不下单了，让我再考虑一下' : "Let me reconsider, don't place the order yet");
  };

  const handleExample = (ex) => { setInput(ex); setTimeout(() => inputRef.current?.focus(), 50); };
  const clearSession = () => { setMessages([]); setSessionId(''); setCurrentFlow(null); };

  if (collapsed) {
    return (
      <div onClick={onToggle} style={{
        position: 'fixed', bottom: 20, right: 20, width: 56, height: 56, borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6, #a855f7)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 24px rgba(59,130,246,.4)',
        zIndex: 200, fontSize: '1.4rem', color: '#fff', fontWeight: 800, transition: 'transform .2s',
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        AI
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, width: 520, maxWidth: 'calc(100vw - 280px)',
      height: 680, maxHeight: 'calc(100vh - 60px)',
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
      display: 'flex', flexDirection: 'column', zIndex: 200,
      boxShadow: '0 8px 48px rgba(0,0,0,.4)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(59,130,246,.08), rgba(168,85,247,.08))',
        borderRadius: '16px 16px 0 0',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '.92rem' }}>
            {lang === 'zh' ? 'AI 采购助手 · GPT-4' : 'AI Procurement Agent · GPT-4'}
          </div>
          <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>
            {lang === 'zh' ? '对话式下单 · 全流程自动化 · 一键购买' : 'Conversational ordering · End-to-end · One-click purchase'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '.7rem', color: 'var(--green)' }}>Live</span>
          <button onClick={onToggle} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.1rem', padding: '2px 6px' }}>✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', fontSize: '.8rem' }}>
        {['chat', 'audit'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '8px 0', background: 'none', border: 'none',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t ? 'var(--accent)' : 'var(--text3)', cursor: 'pointer', fontWeight: tab === t ? 600 : 400,
          }}>
            {t === 'chat' ? (lang === 'zh' ? '💬 对话' : '💬 Chat') : (lang === 'zh' ? '📋 审计日志' : '📋 Audit Log')}
          </button>
        ))}
      </div>

      {/* Chat Tab */}
      {tab === 'chat' && (
        <>
          <div ref={chatRef} style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>
            {messages.length === 0 && (
              <div>
                <div style={{ padding: '10px 14px', background: 'rgba(59,130,246,.06)', borderRadius: 12, marginBottom: 10, fontSize: '.85rem', lineHeight: 1.6 }}>
                  {lang === 'zh'
                    ? '👋 你好！我是 AI 采购助手。告诉我你想买什么，我来帮你完成全流程——从需求确认、供应商搜索、报价对比到一键下单，全部在这里完成！'
                    : '👋 Hi! I\'m your AI Procurement Agent. Tell me what you need and I\'ll handle everything — from requirements, supplier search, quote comparison to order placement, all right here!'}
                </div>
                <div style={{ fontSize: '.76rem', color: 'var(--text3)', marginBottom: 6 }}>
                  {lang === 'zh' ? '试试这些：' : 'Try these:'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {(EXAMPLES[lang] || EXAMPLES.en).map((ex, i) => (
                    <div key={i} onClick={() => handleExample(ex)} style={{
                      padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 7, cursor: 'pointer', fontSize: '.78rem', color: 'var(--text2)', transition: 'border-color .15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,.5)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      {ex}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 8,
              }}>
                <div style={{
                  maxWidth: '92%', padding: '9px 13px', borderRadius: 12,
                  background: m.role === 'user' ? 'var(--accent)' : 'var(--bg)',
                  color: m.role === 'user' ? '#fff' : 'var(--text)',
                  fontSize: '.85rem', lineHeight: 1.5,
                  border: m.role === 'agent' ? '1px solid var(--border)' : 'none',
                  whiteSpace: 'pre-line', width: m.results ? '92%' : undefined,
                }}>
                  {/* Stage indicator for flow messages */}
                  {m.flow?.stage && <StageIndicator stage={m.flow.stage} lang={lang} />}

                  {m.text}

                  {/* Gathering checklist card */}
                  {m.flow?.stage === 'gathering' && <GatheringCard flow={m.flow} lang={lang} />}

                  {/* Supplier search results */}
                  {m.results?.supplier_search?.length > 0 && (
                    <SupplierSearchCard suppliers={m.results.supplier_search} lang={lang} />
                  )}

                  {/* Quote comparison table */}
                  {m.results?.quotes?.length > 0 && (
                    <QuoteCard quotes={m.results.quotes} lang={lang} onSelect={handleQuoteSelect} />
                  )}

                  {/* Order summary confirmation card */}
                  {m.results?.order_summary && m.flow?.stage === 'confirming' && (
                    <OrderSummaryCard summary={m.results.order_summary} lang={lang}
                      onConfirm={handleOrderConfirm} onCancel={handleOrderCancel} />
                  )}

                  {/* Order created success card */}
                  {(m.results?.order_created || (m.flow?.stage === 'ordered' && m.results?.rfq_created)) && (
                    <OrderCreatedCard results={m.results} lang={lang} />
                  )}

                  {/* Generic execution results */}
                  {m.hasExec && !m.results?.order_created && (
                    <div style={{ marginTop: 5, padding: '3px 8px', background: 'rgba(34,197,94,.08)', borderRadius: 6, fontSize: '.74rem', color: 'var(--green)' }}>
                      {lang === 'zh' ? '✅ 操作已执行' : '✅ Actions executed'}
                    </div>
                  )}
                  {m.meta && (
                    <div style={{ marginTop: 4, fontSize: '.68rem', color: 'var(--text3)', opacity: 0.7 }}>
                      {m.meta}
                    </div>
                  )}
                  {m.action?.startsWith('navigate:') && (
                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${m.role === 'user' ? 'rgba(255,255,255,.2)' : 'var(--border)'}` }}>
                      <button onClick={() => onNavigate?.(m.action.split(':')[1])} style={css.btn(false)}>
                        {lang === 'zh' ? '→ 跳转查看' : '→ Go to page'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
                <div style={{ padding: '9px 13px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '.85rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[0, 1, 2].map(n => (
                      <div key={n} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: `pulse 1.4s ${n * 0.2}s ease-in-out infinite` }} />
                    ))}
                  </div>
                  <span>{lang === 'zh' ? 'GPT-4 分析中...' : 'GPT-4 analyzing...'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Flow progress bar */}
          {currentFlow?.stage && currentFlow.stage !== 'ordered' && (
            <div style={{ padding: '6px 14px', borderTop: '1px solid var(--border)', background: 'rgba(59,130,246,.03)' }}>
              <StageIndicator stage={currentFlow.stage} lang={lang} />
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
            {messages.length > 0 && (
              <button onClick={clearSession} title={lang === 'zh' ? '新对话' : 'New session'} style={{
                padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text3)', cursor: 'pointer', fontSize: '.82rem',
              }}>🔄</button>
            )}
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={lang === 'zh' ? '告诉我你想买什么...' : 'Tell me what you need...'}
              style={{
                flex: 1, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text)', fontSize: '.85rem', outline: 'none',
              }} />
            <button onClick={handleSend} disabled={thinking || !input.trim()} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: thinking ? 'var(--border)' : 'linear-gradient(135deg, #3b82f6, #a855f7)',
              color: '#fff', fontWeight: 600, cursor: thinking ? 'default' : 'pointer', fontSize: '.85rem',
            }}>
              {lang === 'zh' ? '发送' : 'Send'}
            </button>
          </div>
        </>
      )}

      {/* Audit Tab */}
      {tab === 'audit' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '.82rem', fontWeight: 600 }}>{lang === 'zh' ? '操作审计记录' : 'Agent Audit Trail'}</span>
            <button onClick={loadAudit} style={{
              padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--bg)', color: 'var(--text3)', cursor: 'pointer', fontSize: '.74rem',
            }}>{auditLoading ? '...' : '↻'}</button>
          </div>
          {auditLogs.length === 0 && !auditLoading && (
            <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '.82rem', padding: 24 }}>
              {lang === 'zh' ? '暂无审计记录' : 'No audit logs yet'}
            </div>
          )}
          {auditLogs.map(log => (
            <div key={log.id} style={{
              marginBottom: 8, padding: '8px 10px', background: 'var(--bg)',
              border: '1px solid var(--border)', borderRadius: 8, fontSize: '.78rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>[{log.intent}]</span>
                <span style={{ color: 'var(--text3)', fontSize: '.7rem' }}>{log.created_at?.slice(0, 19).replace('T', ' ')}</span>
              </div>
              <div style={{ color: 'var(--text2)', marginBottom: 3 }}>📝 {log.message?.slice(0, 80)}{log.message?.length > 80 ? '...' : ''}</div>
              <div style={{ color: 'var(--text3)', fontSize: '.72rem' }}>↪ {log.reply?.slice(0, 80)}{log.reply?.length > 80 ? '...' : ''}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: '.68rem', color: 'var(--text3)' }}>
                {log.llm_provider && log.llm_provider !== 'none' && <span>🧠 {log.llm_provider}/{log.llm_model}</span>}
                {log.llm_tokens > 0 && <span>🔢 {log.llm_tokens} tokens</span>}
                {log.execution_ms > 0 && <span>⚡ {log.execution_ms}ms</span>}
                <span style={{ color: log.status === 'success' ? 'var(--green)' : '#ef4444' }}>
                  {log.status === 'success' ? '✓' : '✗'} {log.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
