import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'robotbuy_lang';

const dict = {
  // ─── App Shell ────────────────────────────────────────────────────────
  'app.name': { en: 'RobotBuy OS', zh: 'RobotBuy OS' },
  'app.sub': { en: 'AI-Native Supply Chain Platform', zh: 'AI 原生供应链平台' },
  'app.signout': { en: 'Sign Out', zh: '退出登录' },

  // ─── Nav Groups ───────────────────────────────────────────────────────
  'nav.command': { en: 'Command Center', zh: '指挥中心' },
  'nav.transaction': { en: 'Layer 1: Transaction', zh: '第一层：交易入口' },
  'nav.execution': { en: 'Layer 2: Execution', zh: '第二层：落地执行' },
  'nav.supplier': { en: 'Supplier Network', zh: '供应商网络' },
  'nav.agents': { en: 'AI Agents', zh: 'AI 智能体' },
  'nav.quality': { en: 'Quality', zh: '质量管理' },
  'nav.finance': { en: 'Finance & Revenue', zh: '财务与营收' },
  'nav.system': { en: 'System', zh: '系统管理' },

  // ─── Nav Items ────────────────────────────────────────────────────────
  'nav.flywheel': { en: 'Flywheel & KPIs', zh: '飞轮与北极星' },
  'nav.dashboard': { en: 'Dashboard', zh: '总览仪表盘' },
  'nav.confidence': { en: 'Confidence System', zh: '置信度系统' },
  'nav.marketplace': { en: 'Buy / Sell', zh: '买卖市场' },
  'nav.agency': { en: 'Exclusive Agency', zh: '独家代理' },
  'nav.rfq': { en: 'RFQ Engine', zh: '询价引擎' },
  'nav.negotiation': { en: 'AI Negotiation', zh: 'AI 议价' },
  'nav.bom': { en: 'BOM Router', zh: 'BOM 路由' },
  'nav.procurement': { en: 'Orchestration', zh: '采购编排' },
  'nav.milestones': { en: 'Milestone Payments', zh: '里程碑付款' },
  'nav.orders': { en: 'Order Tracking', zh: '订单跟踪' },
  'nav.verification': { en: 'Production Verify', zh: '生产验证' },
  'nav.compliance': { en: 'Cert & Compliance', zh: '认证与合规' },
  'nav.portal': { en: 'Customer Portal', zh: '客户门户' },
  'nav.suppliers': { en: 'Suppliers', zh: '供应商' },
  'nav.expert': { en: 'Expert Memory', zh: '专家记忆' },
  'nav.trust': { en: 'Trust Scores', zh: '信任评分' },
  'nav.credit': { en: 'Credit System', zh: '信用体系' },
  'nav.relationships': { en: 'Relationships', zh: '关系管理' },
  'nav.intelligence': { en: 'Intelligence', zh: '网络情报' },
  'nav.browser': { en: 'Browser Agent', zh: '浏览器代理' },
  'nav.graph': { en: 'Supply Graph', zh: '供应图谱' },
  'nav.crawler': { en: 'Batch Crawler', zh: '批量爬虫' },
  'nav.operations': { en: 'Operations', zh: '运营管理' },
  'nav.requests': { en: 'Supply Requests', zh: '采购需求' },
  'nav.timeline': { en: 'Timeline', zh: '事件流' },
  'nav.quality_risk': { en: 'Quality & Risk', zh: '质量与风险' },
  'nav.fulfillment': { en: 'Fulfillment', zh: '履约管理' },
  'nav.payments': { en: 'Payments & Finance', zh: '支付与财务' },
  'nav.revenue': { en: 'Revenue Hub', zh: '营收中心' },
  'nav.org': { en: 'Organization', zh: '组织管理' },
  'nav.roles': { en: 'Roles & Permissions', zh: '角色与权限' },
  'nav.account': { en: 'Account Settings', zh: '账户设置' },
  'nav.catalog': { en: 'Parts & Supply', zh: '零件与供应链' },
  'nav.parts_catalog': { en: 'Parts Catalog', zh: '零部件目录' },
  'nav.humanoid_atlas': { en: 'Humanoid Atlas', zh: '人形机器人地图' },
  'nav.supply_tree': { en: 'Supply Tree', zh: '供应链树' },
  'nav.cad_design': { en: '3D CAD Design', zh: '3D CAD 设计' },
  'nav.design_to_quote': { en: 'Design → Quote', zh: '设计→报价' },
  'nav.eda': { en: 'EDA Design', zh: 'EDA 设计' },
  'nav.eda_hub': { en: 'Design Hub', zh: '设计中心' },
  'nav.schematic': { en: 'Schematic', zh: '原理图' },
  'nav.pcb_layout': { en: 'PCB Layout', zh: 'PCB 布局' },
  'nav.gerber_view': { en: 'Gerber Preview', zh: 'Gerber 预览' },
  'nav.pcb_order': { en: 'PCB Order', zh: 'PCB 下单' },

  // ─── Dashboard ────────────────────────────────────────────────────────
  'dash.title': { en: 'Supply Chain Command Center', zh: '供应链指挥中心' },
  'dash.sub': { en: 'Real-time overview of your entire procurement operation', zh: '你的整个采购运营实时总览' },
  'dash.active_suppliers': { en: 'Active Suppliers', zh: '活跃供应商' },
  'dash.open_requests': { en: 'Open Requests', zh: '待处理需求' },
  'dash.active_negotiations': { en: 'Active Negotiations', zh: '进行中议价' },
  'dash.pending_orders': { en: 'Pending Orders', zh: '待处理订单' },
  'dash.completed_orders': { en: 'Completed Orders', zh: '已完成订单' },
  'dash.expert_insights': { en: 'Expert Insights', zh: '专家洞察' },
  'dash.bom_projects': { en: 'BOM Projects', zh: 'BOM 项目' },
  'dash.standard_parts': { en: 'Standard Parts', zh: '标准件' },
  'dash.custom_parts': { en: 'Custom Parts', zh: '定制件' },
  'dash.relationships': { en: 'Relationships', zh: '供应商关系' },
  'dash.active_rfqs': { en: 'Active RFQs', zh: '活跃询价' },
  'dash.open_issues': { en: 'Open Issues', zh: '未解决问题' },
  'dash.risk_alerts': { en: 'Risk Alerts', zh: '风险警报' },
  'dash.procurement_active': { en: 'Procurement Active', zh: '进行中采购' },

  // ─── Expert Memory ────────────────────────────────────────────────────
  'expert.title': { en: 'Expert Memory', zh: '专家记忆系统' },
  'expert.sub': { en: "Jerry's supplier judgment, digitized — insights, scenario tags, avoidance records", zh: '将 Jerry 的供应商判断数字化 — 洞察、场景标签、规避记录' },
  'expert.recommender': { en: 'AI Supplier Recommender', zh: 'AI 供应商推荐' },
  'expert.insights': { en: 'Insights', zh: '洞察' },
  'expert.tags': { en: 'Scenario Tags', zh: '场景标签' },
  'expert.avoidance': { en: 'Avoidance', zh: '规避清单' },
  'expert.add': { en: 'Add Expert Insight', zh: '添加专家洞察' },
  'expert.find': { en: 'Find Suppliers', zh: '找供应商' },

  // ─── BOM Router ───────────────────────────────────────────────────────
  'bom.title': { en: 'BOM Router', zh: 'BOM 智能路由' },
  'bom.sub': { en: 'Standard parts auto-route to known vendors. Custom parts go to expert review.', zh: '标准件自动路由到已知供应商，定制件转入专家审核。' },
  'bom.projects': { en: 'Projects', zh: '项目' },
  'bom.add_part': { en: 'Add Part', zh: '添加零件' },

  // ─── RFQ ──────────────────────────────────────────────────────────────
  'rfq.title': { en: 'RFQ Engine', zh: '询价引擎' },
  'rfq.sub': { en: 'Multi-round quoting, AI scoring, side-by-side comparison, auto follow-up', zh: '多轮报价、AI 评分、并排对比、自动跟进' },
  'rfq.compare': { en: 'Compare', zh: '对比' },

  // ─── Suppliers ────────────────────────────────────────────────────────
  'supp.title': { en: 'Suppliers', zh: '供应商网络' },
  'supp.sub': { en: 'All suppliers in your network', zh: '你网络中的所有供应商' },

  // ─── Relationships ────────────────────────────────────────────────────
  'rel.title': { en: 'Relationships', zh: '供应商关系' },
  'rel.sub': { en: 'Your supplier relationship graph — trust, channels, AI delegation', zh: '供应商关系图 — 信任度、沟通渠道、AI 授权' },
  'rel.events': { en: 'Recent Events', zh: '最近事件' },

  // ─── Quality ──────────────────────────────────────────────────────────
  'qual.title': { en: 'Quality & Risk', zh: '质量与风险' },
  'qual.sub': { en: 'Track issues, risk alerts, and manage alternative parts', zh: '追踪问题、风险警报和替代零件' },
  'qual.issues': { en: 'Quality Issues', zh: '质量问题' },
  'qual.alerts': { en: 'Risk Alerts', zh: '风险警报' },

  // ─── Procurement ──────────────────────────────────────────────────────
  'proc.title': { en: 'Procurement Orchestration', zh: '采购编排' },
  'proc.sub': { en: 'Multi-supplier coordination across entire BOM', zh: '跨供应商的整个 BOM 协调管理' },

  // ─── Intelligence ─────────────────────────────────────────────────────
  'intel.title': { en: 'Network Intelligence', zh: '供应网络情报' },
  'intel.sub': { en: 'Cross-customer data: price baselines, supplier reliability, industry benchmarks', zh: '跨客户数据：价格基线、供应商可靠性、行业基准' },
  'intel.price': { en: 'Price Benchmarks', zh: '价格基准' },
  'intel.reliability': { en: 'Supplier Reliability', zh: '供应商可靠性' },

  // ─── Marketplace ──────────────────────────────────────────────────────
  'mp.title': { en: 'Marketplace', zh: '买卖市场' },
  'mp.sub': { en: 'Buyers submit needs. Sellers list products. AI matches.', zh: '买家提交需求，卖家上架产品，AI 自动匹配。' },
  'mp.buyer': { en: 'Buyer', zh: '买家' },
  'mp.seller': { en: 'Seller', zh: '卖家' },
  'mp.placeholder': { en: 'Try: "I need 100 aluminum robotic grippers, budget $5000"', zh: '试试: "我要100个铝制机器人夹爪，预算5000美元"' },
  'mp.parse': { en: 'AI Parse', zh: 'AI 解析' },
  'mp.confirm': { en: 'Confirm & Match', zh: '确认并匹配' },
  'mp.discard': { en: 'Discard', zh: '丢弃' },
  'mp.requests': { en: 'My Requests', zh: '我的需求' },
  'mp.listings': { en: 'Listings', zh: '商品列表' },
  'mp.matched': { en: 'Matched Listings', zh: '匹配结果' },

  // ─── Agent Bar ────────────────────────────────────────────────────────
  'agent.placeholder': { en: 'Tell me what you need — I\'ll handle it. Try: "find 3 motor suppliers in Shenzhen under $15/unit"', zh: '告诉我你需要什么 — 我来处理。试试："帮我找3家深圳电机供应商，单价15美金以内"' },
  'agent.thinking': { en: 'Thinking...', zh: '思考中...' },
  'agent.send': { en: 'Send', zh: '发送' },
  'agent.welcome': { en: 'Hi! I\'m your procurement AI agent. Just tell me what you need in plain language — I can search suppliers, create RFQs, track orders, check quality, and more. No clicking required.', zh: '你好！我是你的采购 AI 助手。用自然语言告诉我你需要什么 — 我可以搜索供应商、创建询价、跟踪订单、检查质量等等。不需要点击任何按钮。' },
  'agent.examples_title': { en: 'Try these:', zh: '试试这些：' },

  // ─── Common ───────────────────────────────────────────────────────────
  'common.cancel': { en: 'Cancel', zh: '取消' },
  'common.save': { en: 'Save', zh: '保存' },
  'common.create': { en: 'Create', zh: '创建' },
  'common.add': { en: 'Add', zh: '添加' },
  'common.edit': { en: 'Edit', zh: '编辑' },
  'common.delete': { en: 'Delete', zh: '删除' },
  'common.search': { en: 'Search', zh: '搜索' },
  'common.status': { en: 'Status', zh: '状态' },
  'common.no_data': { en: 'No data yet', zh: '暂无数据' },
  'common.loading': { en: 'Loading...', zh: '加载中...' },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'en'; } catch { return 'en'; }
  });

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'zh' : 'en';
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      return next;
    });
  }, []);

  const setLangDirect = useCallback((l) => {
    setLang(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  const t = useCallback((key, fallback) => {
    const entry = dict[key];
    if (!entry) return fallback || key;
    return entry[lang] || entry.en || fallback || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang, setLang: setLangDirect }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}
