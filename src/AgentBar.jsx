import { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from './i18n';
import { useAuth } from './auth';
import * as api from './api';

const EXAMPLES = {
  en: [
    'Find 3 servo motor suppliers in Shenzhen under $15/unit',
    'Create an RFQ for 200 brushless DC motors, 48V, budget $3000',
    'What is the trust score for supplier #12?',
    'Show me all overdue orders',
    'Start negotiation with supplier #5 for order #23',
    'Check compliance status for FCC certification on product X',
    'Add expert insight: supplier #8 has great CNC quality but slow on communication',
    'Compare quotes for RFQ-2024-015',
  ],
  zh: [
    '帮我找3家深圳的伺服电机供应商，单价15美金以内',
    '创建一个询价：200个无刷直流电机，48V，预算3000美金',
    '供应商 #12 的信任评分是多少？',
    '显示所有逾期订单',
    '跟供应商 #5 就订单 #23 开始议价',
    '检查产品X的FCC认证合规状态',
    '添加专家记忆：供应商 #8 的CNC质量很好但沟通较慢',
    '对比询价 RFQ-2024-015 的所有报价',
  ],
};

function classifyIntent(input) {
  const lower = input.toLowerCase();
  if (/find|search|找|搜|推荐|recommend/.test(lower)) return 'search_supplier';
  if (/rfq|询价|报价|quote/.test(lower)) return 'rfq';
  if (/negotiat|议价|谈判|bargain/.test(lower)) return 'negotiate';
  if (/order|订单|跟踪|track|overdue|逾期/.test(lower)) return 'order';
  if (/trust|信任|score|评分|credit|信用/.test(lower)) return 'trust';
  if (/compliance|认证|合规|fcc|ce|ul/.test(lower)) return 'compliance';
  if (/expert|insight|记忆|洞察|add.*insight/.test(lower)) return 'expert';
  if (/compare|对比|比较/.test(lower)) return 'compare';
  if (/milestone|里程碑|payment|付款/.test(lower)) return 'milestone';
  if (/verify|验证|inspect|验厂/.test(lower)) return 'verify';
  if (/bom|物料|part|零件/.test(lower)) return 'bom';
  if (/quality|质量|risk|风险|alert|警报/.test(lower)) return 'quality';
  return 'general';
}

function generateAgentResponse(input, intent, lang) {
  const isZh = lang === 'zh';
  const responses = {
    search_supplier: {
      en: `Searching supplier database... I found matching suppliers based on your criteria. Let me show you the top results with pricing and reliability scores.`,
      zh: `正在搜索供应商数据库... 根据你的条件找到了匹配的供应商。让我展示评分最高的结果和价格对比。`,
      action: 'navigate:suppliers',
    },
    rfq: {
      en: `Got it! I'm creating an RFQ based on your requirements. I'll auto-distribute it to qualified suppliers and start collecting quotes.`,
      zh: `收到！正在根据你的需求创建询价。我会自动分发给合格的供应商并开始收集报价。`,
      action: 'navigate:rfq',
    },
    negotiate: {
      en: `Starting AI negotiation. I'll analyze the supplier's pricing history, market benchmarks, and your budget to optimize the deal. You'll only need to approve the final terms.`,
      zh: `正在启动 AI 议价。我会分析供应商的历史定价、市场基准和你的预算来优化交易。你只需要批准最终条款。`,
      action: 'navigate:negotiation',
    },
    order: {
      en: `Checking order status... I can see your active orders. Let me highlight any that need attention — overdue items, pending milestones, or delivery updates.`,
      zh: `正在检查订单状态... 我可以看到你的活跃订单。让我标记出需要关注的 — 逾期项目、待验收里程碑或物流更新。`,
      action: 'navigate:orders',
    },
    trust: {
      en: `Pulling trust and credit data... I've compiled the supplier's fulfillment history, quality scores, communication rating, and overall trust tier.`,
      zh: `正在获取信任和信用数据... 我已汇总该供应商的履约历史、质量评分、沟通评级和整体信用等级。`,
      action: 'navigate:trust',
    },
    compliance: {
      en: `Checking certification and compliance status... I'll show you the current status of all required certifications and flag any that are expiring or missing.`,
      zh: `正在检查认证合规状态... 我会展示所有必要认证的当前状态，并标记即将过期或缺失的。`,
      action: 'navigate:compliance',
    },
    expert: {
      en: `Adding to expert memory... This insight has been recorded and will be factored into future supplier recommendations and risk assessments.`,
      zh: `正在添加到专家记忆... 这条洞察已记录，未来的供应商推荐和风险评估会将其纳入考虑。`,
      action: 'navigate:expert',
    },
    compare: {
      en: `Running comparison analysis... I'm pulling all quotes side-by-side with AI scoring on price, quality, lead time, and supplier reliability.`,
      zh: `正在运行对比分析... 我正在拉取所有报价进行并排对比，包含价格、质量、交期和供应商可靠性的 AI 评分。`,
      action: 'navigate:rfq',
    },
    milestone: {
      en: `Checking milestone payment status... I can see all payment stages and their verification status. I'll flag any that need your approval.`,
      zh: `正在检查里程碑付款状态... 我可以看到所有付款阶段及验收状态。我会标记需要你审批的。`,
      action: 'navigate:milestones',
    },
    verify: {
      en: `Initiating production verification... I'll coordinate with our Shenzhen team to schedule an inspection and collect evidence photos/videos.`,
      zh: `正在启动生产验证... 我会协调深圳团队安排验厂并收集证据照片/视频。`,
      action: 'navigate:verification',
    },
    bom: {
      en: `Processing BOM request... I'll route standard parts to known vendors and flag custom parts for expert review. Let me show you the breakdown.`,
      zh: `正在处理 BOM 请求... 我会将标准件路由到已知供应商，定制件标记给专家审核。让我展示明细。`,
      action: 'navigate:bom',
    },
    quality: {
      en: `Checking quality and risk data... I'll pull recent quality issues, active risk alerts, and supplier performance trends.`,
      zh: `正在检查质量与风险数据... 我会拉取最近的质量问题、活跃的风险警报和供应商绩效趋势。`,
      action: 'navigate:quality',
    },
    general: {
      en: `I understand your request. Let me analyze it and take the best action. I'm working on it now...`,
      zh: `我理解你的需求。让我分析并采取最佳行动。正在处理中...`,
      action: null,
    },
  };
  const r = responses[intent] || responses.general;
  return { text: isZh ? r.zh : r.en, action: r.action, intent };
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

    await new Promise(r => setTimeout(r, 600 + Math.random() * 800));

    const intent = classifyIntent(text);
    const resp = generateAgentResponse(text, intent, lang);
    setMessages(prev => [...prev, { role: 'agent', text: resp.text, action: resp.action, intent: resp.intent }]);
    setThinking(false);

    if (resp.action?.startsWith('navigate:')) {
      const page = resp.action.split(':')[1];
      setTimeout(() => onNavigate?.(page), 800);
    }
  }, [input, thinking, lang, onNavigate]);

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
        zIndex: 200, fontSize: '1.4rem', transition: 'transform .2s',
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        AI
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, width: 420, maxWidth: 'calc(100vw - 280px)',
      height: 520, maxHeight: 'calc(100vh - 80px)',
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
            {lang === 'zh' ? '一句话搞定一切' : 'One sentence does it all'}
          </div>
        </div>
        <button onClick={onToggle} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.2rem', padding: '4px 8px' }}>✕</button>
      </div>

      <div ref={chatRef} style={{ flex: 1, overflow: 'auto', padding: '14px 18px' }}>
        {messages.length === 0 && (
          <div>
            <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,.06)', borderRadius: 12, marginBottom: 12, fontSize: '.88rem', lineHeight: 1.6 }}>
              {t('agent.welcome')}
            </div>
            <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginBottom: 8 }}>{t('agent.examples_title')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(EXAMPLES[lang] || EXAMPLES.en).slice(0, 5).map((ex, i) => (
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
              maxWidth: '85%', padding: '10px 14px', borderRadius: 12,
              background: m.role === 'user' ? 'var(--accent)' : 'var(--bg)',
              color: m.role === 'user' ? '#fff' : 'var(--text)',
              fontSize: '.88rem', lineHeight: 1.5,
              border: m.role === 'agent' ? '1px solid var(--border)' : 'none',
            }}>
              {m.text}
              {m.action?.startsWith('navigate:') && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${m.role === 'user' ? 'rgba(255,255,255,.2)' : 'var(--border)'}` }}>
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
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '.88rem', color: 'var(--text3)' }}>
              <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>{t('agent.thinking')}</span>
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
