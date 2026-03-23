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
    'Start negotiation with supplier #5',
    'Add expert insight: supplier #8 has great CNC quality but slow communication',
    'Compare quotes for all active RFQs',
    'Show me the dashboard summary',
  ],
  zh: [
    '帮我找深圳的伺服电机供应商，单价15美金以内',
    '创建询价：200个无刷直流电机，48V，预算3000美金',
    '供应商 #1 的信任评分是多少？',
    '显示所有订单',
    '跟供应商 #5 开始议价',
    '添加专家记忆：供应商 #8 的CNC质量很好但沟通较慢',
    '对比所有活跃询价的报价',
    '展示总览仪表盘',
  ],
};

async function executeActions(actions, message) {
  const executed = [];
  for (const action of actions) {
    try {
      if (action.type === 'create_rfq' && action.title) {
        const result = await api.createRfq({
          title: action.title,
          quantity: action.quantity || 100,
          budget_usd: action.budget_usd || 0,
        });
        executed.push({ type: 'create_rfq', success: true, result });
      } else if (action.type === 'add_insight' && action.content) {
        const result = await api.createInsight({
          supplier_id: action.supplier_id || 0,
          insight_type: 'tip',
          category: 'general',
          title: action.content.slice(0, 60),
          content: action.content,
          scenarios: [],
        });
        executed.push({ type: 'add_insight', success: true, result });
      }
    } catch (e) {
      executed.push({ type: action.type, success: false, error: e.message });
    }
  }
  return executed;
}

function formatResults(results, lang) {
  const parts = [];
  if (results.suppliers?.length) {
    const header = lang === 'zh' ? '找到的供应商：' : 'Suppliers found:';
    parts.push(header);
    results.suppliers.slice(0, 5).forEach((s, i) => {
      parts.push(`  ${i + 1}. ${s.name} — ${s.location || '?'} (${lang === 'zh' ? '质量' : 'Q'}:${s.quality}/5, ${lang === 'zh' ? '价格' : 'P'}:${s.price}/5)`);
    });
  }
  if (results.orders?.length) {
    const header = lang === 'zh' ? '订单：' : 'Orders:';
    parts.push(header);
    results.orders.slice(0, 5).forEach((o, i) => {
      parts.push(`  ${i + 1}. #${o.id} — ${o.status} ($${o.total})`);
    });
  }
  if (results.supplier) {
    const s = results.supplier;
    parts.push(`${s.name}: Q:${s.quality}/5, P:${s.price}/5, Speed:${s.speed}/5 (${s.orders} ${lang === 'zh' ? '个订单' : 'orders'})`);
  }
  if (results.rfq) {
    const r = results.rfq;
    parts.push(`RFQ: "${r.title}" x${r.quantity}${r.budget_usd ? ` ($${r.budget_usd})` : ''}`);
  }
  if (results.insight) {
    parts.push(`${lang === 'zh' ? '洞察' : 'Insight'}: ${results.insight.content.slice(0, 80)}`);
  }
  if (results.summary) {
    parts.push(`${lang === 'zh' ? '供应商' : 'Suppliers'}: ${results.summary.suppliers}, ${lang === 'zh' ? '订单' : 'Orders'}: ${results.summary.orders}`);
  }
  return parts.length ? '\n' + parts.join('\n') : '';
}

function formatExecuted(executed, lang) {
  if (!executed.length) return '';
  const parts = [lang === 'zh' ? '\n✅ 已执行：' : '\n✅ Executed:'];
  executed.forEach(e => {
    if (e.type === 'create_rfq') {
      parts.push(e.success
        ? (lang === 'zh' ? '  · 询价已创建' : '  · RFQ created')
        : (lang === 'zh' ? '  · 询价创建失败' : '  · RFQ creation failed'));
    } else if (e.type === 'add_insight') {
      parts.push(e.success
        ? (lang === 'zh' ? '  · 专家洞察已添加' : '  · Expert insight added')
        : (lang === 'zh' ? '  · 洞察添加失败' : '  · Insight add failed'));
    }
  });
  return parts.join('\n');
}

export default function AgentBar({ onNavigate, collapsed, onToggle }) {
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setThinking(true);

    try {
      const resp = await api.agentChat(text, lang, { user_id: user?.id });
      const executed = await executeActions(resp.actions || [], text);
      const extra = formatResults(resp.results || {}, lang);
      const execText = formatExecuted(executed, lang);
      const navAction = (resp.actions || []).find(a => a.type === 'navigate');
      
      setMessages(prev => [...prev, {
        role: 'agent',
        text: resp.reply + extra + execText,
        action: navAction ? `navigate:${navAction.page}` : null,
        intent: resp.intent,
        results: resp.results,
        executed,
      }]);

      if (navAction) {
        setTimeout(() => onNavigate?.(navAction.page), 1200);
      }
    } catch (e) {
      const fallback = lang === 'zh'
        ? `后端暂时不可用，使用本地模式处理你的请求。`
        : `Backend temporarily unavailable, processing locally.`;
      setMessages(prev => [...prev, { role: 'agent', text: fallback, intent: 'error' }]);
    } finally {
      setThinking(false);
    }
  }, [input, thinking, lang, onNavigate, user]);

  const handleExample = (ex) => {
    setInput(ex);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (collapsed) {
    return (
      <div onClick={onToggle} style={{
        position: 'fixed', bottom: 20, right: 20, width: 56, height: 56, borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6, #a855f7)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 24px rgba(59,130,246,.4)',
        zIndex: 200, fontSize: '1.4rem', transition: 'transform .2s', color: '#fff', fontWeight: 800,
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        AI
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, width: 440, maxWidth: 'calc(100vw - 280px)',
      height: 560, maxHeight: 'calc(100vh - 80px)',
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
      display: 'flex', flexDirection: 'column', zIndex: 200,
      boxShadow: '0 8px 48px rgba(0,0,0,.4)',
    }}>
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(59,130,246,.08), rgba(168,85,247,.08))',
        borderRadius: '16px 16px 0 0',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '.95rem' }}>
            {lang === 'zh' ? 'AI 采购助手' : 'AI Procurement Agent'}
          </div>
          <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>
            {lang === 'zh' ? '一句话搞定一切 · 直接执行' : 'One sentence does it all · Direct execution'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '.72rem', color: 'var(--green)' }}>Live</span>
          <button onClick={onToggle} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.2rem', padding: '4px 8px' }}>✕</button>
        </div>
      </div>

      <div ref={chatRef} style={{ flex: 1, overflow: 'auto', padding: '14px 18px' }}>
        {messages.length === 0 && (
          <div>
            <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,.06)', borderRadius: 12, marginBottom: 12, fontSize: '.88rem', lineHeight: 1.6 }}>
              {t('agent.welcome')}
            </div>
            <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginBottom: 8 }}>{t('agent.examples_title')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(EXAMPLES[lang] || EXAMPLES.en).slice(0, 6).map((ex, i) => (
                <div key={i} onClick={() => handleExample(ex)} style={{
                  padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 8, cursor: 'pointer', fontSize: '.82rem', color: 'var(--text2)',
                  transition: 'border-color .15s',
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
            marginBottom: 10,
          }}>
            <div style={{
              maxWidth: '88%', padding: '10px 14px', borderRadius: 12,
              background: m.role === 'user' ? 'var(--accent)' : 'var(--bg)',
              color: m.role === 'user' ? '#fff' : 'var(--text)',
              fontSize: '.88rem', lineHeight: 1.5,
              border: m.role === 'agent' ? '1px solid var(--border)' : 'none',
              whiteSpace: 'pre-line',
            }}>
              {m.text}
              {m.executed?.some(e => e.success) && (
                <div style={{ marginTop: 6, padding: '4px 8px', background: 'rgba(34,197,94,.08)', borderRadius: 6, fontSize: '.78rem', color: 'var(--green)' }}>
                  {lang === 'zh' ? '✅ 操作已自动执行' : '✅ Actions executed automatically'}
                </div>
              )}
              {m.action?.startsWith('navigate:') && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${m.role === 'user' ? 'rgba(255,255,255,.2)' : 'var(--border)'}` }}>
                  <button onClick={() => onNavigate?.(m.action.split(':')[1])} style={{
                    background: 'rgba(59,130,246,.15)', border: 'none', color: 'var(--accent)',
                    padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '.8rem', fontWeight: 600,
                  }}>
                    {lang === 'zh' ? '→ 跳转查看' : '→ Go to page'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '.88rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(n => (
                  <div key={n} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: `pulse 1.4s ${n * 0.2}s ease-in-out infinite` }} />
                ))}
              </div>
              <span>{lang === 'zh' ? '正在思考并执行...' : 'Thinking & executing...'}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={t('agent.placeholder')}
          style={{
            flex: 1, padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text)', fontSize: '.88rem', outline: 'none',
          }} />
        <button onClick={handleSend} disabled={thinking || !input.trim()} style={{
          padding: '10px 18px', borderRadius: 10, border: 'none',
          background: thinking ? 'var(--border)' : 'linear-gradient(135deg, #3b82f6, #a855f7)',
          color: '#fff', fontWeight: 600, cursor: thinking ? 'default' : 'pointer', fontSize: '.88rem',
        }}>
          {t('agent.send')}
        </button>
      </div>
    </div>
  );
}
