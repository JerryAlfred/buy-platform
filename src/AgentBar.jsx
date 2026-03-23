import { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from './i18n';
import { useAuth } from './auth';
import * as api from './api';

const EXAMPLES = {
  en: [
    'Find servo motor suppliers in Shenzhen under $15/unit',
    'Create an RFQ for 200 brushless DC motors, 48V, budget $3000',
    'What is the trust score for supplier #1?',
    'Show me all orders',
    'Start negotiation with supplier #5 for gripper, target $12',
    'Approve milestone for order #3',
    'Schedule pre-shipment inspection for supplier #2, order #7',
    'Create quality report: supplier #4 sent wrong connector type, severity major',
    'Create a purchase order for supplier #6, total $5000',
    'Show me the dashboard summary',
  ],
  zh: [
    '帮我找深圳的伺服电机供应商，单价15美金以内',
    '创建询价：200个无刷直流电机，48V，预算3000美金',
    '供应商 #1 的信任评分是多少？',
    '显示所有订单',
    '跟供应商 #5 发起议价，目标价 $12',
    '审批订单 #3 的里程碑付款',
    '安排供应商 #2 验厂，订单 #7，出货前检验',
    '提交质量报告：供应商 #4 发错了连接器型号，严重程度为 major',
    '为供应商 #6 创建采购订单，总金额 $5000',
    '展示总览仪表盘',
  ],
};

const ACTION_LABELS = {
  en: {
    create_rfq: 'RFQ created', add_insight: 'Insight added', start_negotiation: 'Negotiation started',
    approve_milestone: 'Milestone approved', schedule_inspection: 'Inspection scheduled',
    create_order: 'Order created', create_quality_report: 'Quality report created', navigate: 'Navigate',
  },
  zh: {
    create_rfq: '询价已创建', add_insight: '洞察已添加', start_negotiation: '议价已发起',
    approve_milestone: '里程碑已审批', schedule_inspection: '验厂已安排',
    create_order: '订单已创建', create_quality_report: '质量报告已创建', navigate: '跳转',
  },
};

function formatExecutedV2(results, lang) {
  const executed = results?.executed || [];
  if (!executed.length) return '';
  const labels = ACTION_LABELS[lang] || ACTION_LABELS.en;
  const lines = executed.map(e => {
    const label = labels[e.type] || e.type;
    return e.success ? `  ✅ ${label}${e.id ? ` #${e.id}` : ''}${e.key ? ` (${e.key})` : ''}` : `  ❌ ${label}: ${e.error || 'failed'}`;
  });
  return '\n' + lines.join('\n');
}

function formatDataResults(results, lang) {
  const parts = [];
  if (results.suppliers?.length) {
    parts.push(lang === 'zh' ? '找到的供应商：' : 'Suppliers found:');
    results.suppliers.slice(0, 5).forEach((s, i) => {
      parts.push(`  ${i + 1}. ${s.name} — ${s.location || '?'} (Q:${s.quality}/5, P:${s.price}/5)`);
    });
  }
  if (results.orders?.length) {
    parts.push(lang === 'zh' ? '订单：' : 'Orders:');
    results.orders.slice(0, 5).forEach((o, i) => {
      parts.push(`  ${i + 1}. #${o.id} — ${o.status} ($${o.total})`);
    });
  }
  if (results.supplier) {
    const s = results.supplier;
    parts.push(`${s.name}: Q:${s.quality}/5, P:${s.price}/5, Speed:${s.speed}/5`);
  }
  if (results.summary) {
    parts.push(`${lang === 'zh' ? '供应商' : 'Suppliers'}: ${results.summary.suppliers}, ${lang === 'zh' ? '订单' : 'Orders'}: ${results.summary.orders}`);
  }
  return parts.length ? '\n' + parts.join('\n') : '';
}

export default function AgentBar({ onNavigate, collapsed, onToggle }) {
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [tab, setTab] = useState('chat'); // chat | audit
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
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

  useEffect(() => {
    if (tab === 'audit') loadAudit();
  }, [tab, loadAudit]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setThinking(true);

    const history = messages.slice(-8).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.text }));

    try {
      const resp = await api.agentChat(text, lang, { user_id: user?.id, user_role: user?.role }, history, sessionId);

      if (resp.session_id && !sessionId) setSessionId(resp.session_id);

      const data = formatDataResults(resp.results || {}, lang);
      const exec = formatExecutedV2(resp.results || {}, lang);
      const navAction = (resp.actions || []).find(a => a.type === 'navigate');
      const hasExec = (resp.results?.executed || []).some(e => e.success);

      const meta = [];
      if (resp.llm_provider && resp.llm_provider !== 'none') meta.push(`🧠 ${resp.llm_provider}`);
      if (resp.execution_ms) meta.push(`⚡ ${resp.execution_ms}ms`);

      setMessages(prev => [...prev, {
        role: 'agent',
        text: resp.reply + data + exec,
        action: navAction ? `navigate:${navAction.page}` : null,
        intent: resp.intent,
        hasExec,
        meta: meta.join(' · '),
      }]);

      if (navAction) {
        setTimeout(() => onNavigate?.(navAction.page), 1200);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'agent',
        text: lang === 'zh' ? `后端暂不可用，请稍后重试。(${e.message})` : `Backend temporarily unavailable. (${e.message})`,
        intent: 'error',
      }]);
    } finally {
      setThinking(false);
    }
  }, [input, thinking, lang, onNavigate, user, messages, sessionId]);

  const handleExample = (ex) => {
    setInput(ex);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const clearSession = () => {
    setMessages([]);
    setSessionId('');
  };

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
      position: 'fixed', bottom: 20, right: 20, width: 460, maxWidth: 'calc(100vw - 280px)',
      height: 600, maxHeight: 'calc(100vh - 60px)',
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
          <div style={{ fontSize: '.7rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{lang === 'zh' ? '多轮对话 · 直接执行 · 全审计' : 'Multi-turn · Direct exec · Full audit'}</span>
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
                  {t('agent.welcome')}
                </div>
                <div style={{ fontSize: '.76rem', color: 'var(--text3)', marginBottom: 6 }}>{t('agent.examples_title')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {(EXAMPLES[lang] || EXAMPLES.en).slice(0, 8).map((ex, i) => (
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
                  maxWidth: '88%', padding: '9px 13px', borderRadius: 12,
                  background: m.role === 'user' ? 'var(--accent)' : 'var(--bg)',
                  color: m.role === 'user' ? '#fff' : 'var(--text)',
                  fontSize: '.85rem', lineHeight: 1.5,
                  border: m.role === 'agent' ? '1px solid var(--border)' : 'none',
                  whiteSpace: 'pre-line',
                }}>
                  {m.text}
                  {m.hasExec && (
                    <div style={{ marginTop: 5, padding: '3px 8px', background: 'rgba(34,197,94,.08)', borderRadius: 6, fontSize: '.74rem', color: 'var(--green)' }}>
                      {lang === 'zh' ? '✅ 操作已自动执行并写入审计日志' : '✅ Actions executed & logged to audit trail'}
                    </div>
                  )}
                  {m.meta && (
                    <div style={{ marginTop: 4, fontSize: '.68rem', color: 'var(--text3)', opacity: 0.7 }}>
                      {m.meta}
                    </div>
                  )}
                  {m.action?.startsWith('navigate:') && (
                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${m.role === 'user' ? 'rgba(255,255,255,.2)' : 'var(--border)'}` }}>
                      <button onClick={() => onNavigate?.(m.action.split(':')[1])} style={{
                        background: 'rgba(59,130,246,.15)', border: 'none', color: 'var(--accent)',
                        padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '.78rem', fontWeight: 600,
                      }}>
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
                  <span>{lang === 'zh' ? 'GPT-4 分析 & 执行中...' : 'GPT-4 analyzing & executing...'}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
            {messages.length > 0 && (
              <button onClick={clearSession} title={lang === 'zh' ? '新对话' : 'New session'} style={{
                padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text3)', cursor: 'pointer', fontSize: '.82rem',
              }}>🔄</button>
            )}
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={t('agent.placeholder')}
              style={{
                flex: 1, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text)', fontSize: '.85rem', outline: 'none',
              }} />
            <button onClick={handleSend} disabled={thinking || !input.trim()} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: thinking ? 'var(--border)' : 'linear-gradient(135deg, #3b82f6, #a855f7)',
              color: '#fff', fontWeight: 600, cursor: thinking ? 'default' : 'pointer', fontSize: '.85rem',
            }}>
              {t('agent.send')}
            </button>
          </div>
        </>
      )}

      {/* Audit Tab */}
      {tab === 'audit' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '.82rem', fontWeight: 600 }}>
              {lang === 'zh' ? '操作审计记录' : 'Agent Audit Trail'}
            </span>
            <button onClick={loadAudit} style={{
              padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--bg)', color: 'var(--text3)', cursor: 'pointer', fontSize: '.74rem',
            }}>
              {auditLoading ? '...' : '↻'}
            </button>
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
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                  [{log.intent}]
                </span>
                <span style={{ color: 'var(--text3)', fontSize: '.7rem' }}>
                  {log.created_at?.slice(0, 19).replace('T', ' ')}
                </span>
              </div>
              <div style={{ color: 'var(--text2)', marginBottom: 3 }}>
                📝 {log.message?.slice(0, 80)}{log.message?.length > 80 ? '...' : ''}
              </div>
              <div style={{ color: 'var(--text3)', fontSize: '.72rem' }}>
                ↪ {log.reply?.slice(0, 80)}{log.reply?.length > 80 ? '...' : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: '.68rem', color: 'var(--text3)' }}>
                {log.llm_provider && log.llm_provider !== 'none' && (
                  <span>🧠 {log.llm_provider}/{log.llm_model}</span>
                )}
                {log.llm_tokens > 0 && <span>🔢 {log.llm_tokens} tokens</span>}
                {log.execution_ms > 0 && <span>⚡ {log.execution_ms}ms</span>}
                <span style={{ color: log.status === 'success' ? 'var(--green)' : '#ef4444' }}>
                  {log.status === 'success' ? '✓' : '✗'} {log.status}
                </span>
              </div>
              {log.actions?.length > 0 && (
                <div style={{ marginTop: 4, fontSize: '.7rem', color: 'var(--text3)' }}>
                  {lang === 'zh' ? '操作：' : 'Actions: '}
                  {log.actions.map(a => a.type).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
