const API = import.meta.env.VITE_API_URL || 'https://fearless-backend-533466225971.us-central1.run.app';
const V1 = `${API}/api/supply-chain`;
const V2 = `${API}/api/supply-chain/v2`;
const MP = `${API}/api/marketplace`;

const TOKEN_KEY = 'robotbuy_token';
const REFRESH_KEY = 'robotbuy_refresh';

export function setTokens(access, refresh) {
  if (access) localStorage.setItem(TOKEN_KEY, access); else localStorage.removeItem(TOKEN_KEY);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh); else localStorage.removeItem(REFRESH_KEY);
}
export function getAccessToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
export function clearTokens() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(REFRESH_KEY); }

let _refreshPromise = null;
async function _tryRefresh() {
  const rt = localStorage.getItem(REFRESH_KEY);
  if (!rt) { clearTokens(); return null; }
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = fetch(`${API}/api/auth/refresh`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: rt }),
  }).then(async r => {
    _refreshPromise = null;
    if (!r.ok) { clearTokens(); return null; }
    const d = await r.json();
    setTokens(d.token, d.refresh_token);
    return d.token;
  }).catch(() => { _refreshPromise = null; clearTokens(); return null; });
  return _refreshPromise;
}

function _headers(extra = {}) {
  const h = { 'Content-Type': 'application/json', ...extra };
  const t = getAccessToken();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

async function _fetch(url, opts = {}) {
  opts.headers = _headers(opts.headers);
  let r = await fetch(url, opts);
  if (r.status === 401 && localStorage.getItem(REFRESH_KEY)) {
    const newToken = await _tryRefresh();
    if (newToken) {
      opts.headers['Authorization'] = `Bearer ${newToken}`;
      r = await fetch(url, opts);
    }
  }
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

const j = (r) => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json(); };
const post = (url, body) => _fetch(url, { method: 'POST', body: JSON.stringify(body) });
const get = (url) => _fetch(url);
const patch = (url, body) => _fetch(url, { method: 'PATCH', body: JSON.stringify(body) });
const del = (url) => _fetch(url, { method: 'DELETE' });
const qs = (p) => { const o = {}; for (const [k, v] of Object.entries(p)) { if (v !== '' && v !== undefined && v !== null) o[k] = v; } const s = new URLSearchParams(o).toString(); return s ? `?${s}` : ''; };

export const apiLogin = (identifier, password) =>
  fetch(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  }).then(j);
export const apiLoginGoogle = (credential) =>
  fetch(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'google', credential }),
  }).then(j);
export const apiMe = () => _fetch(`${API}/api/auth/me`);

// ── V1: Core Supply Chain ───────────────────────────────────────────────
export const fetchDashboard = () => get(`${V1}/dashboard`);
export const fetchConfidence = () => get(`${V1}/confidence`);
export const fetchSuppliers = (p = {}) => get(`${V1}/suppliers${qs(p)}`);
export const createSupplier = (d) => post(`${V1}/suppliers`, d);
export const getSupplier = (id) => get(`${V1}/suppliers/${id}`);
export const updateSupplier = (id, d) => patch(`${V1}/suppliers/${id}`, d);
export const fetchRequests = (p = {}) => get(`${V1}/requests${qs(p)}`);
export const createRequest = (d) => post(`${V1}/requests`, d);
export const getRequest = (id) => get(`${V1}/requests/${id}`);
export const updateRequest = (id, d) => patch(`${V1}/requests/${id}`, d);
export const aiSource = (id) => post(`${V1}/requests/${id}/ai-source`, {});
export const fetchQuotes = (p = {}) => get(`${V1}/quotes${qs(p)}`);
export const createQuote = (d) => post(`${V1}/quotes`, d);
export const fetchNegotiations = (p = {}) => get(`${V1}/negotiations${qs(p)}`);
export const startNegotiation = (d) => post(`${V1}/negotiations`, d);
export const fetchNegMsgs = (id) => get(`${V1}/negotiations/${id}/messages`);
export const sendNegMsg = (id, d) => post(`${V1}/negotiations/${id}/messages`, d);
export const aiNegRespond = (id) => post(`${V1}/negotiations/${id}/ai-respond`, {});
export const approveNegMsg = (tid, mid) => post(`${V1}/negotiations/${tid}/approve/${mid}`, {});
export const fetchOrders = (p = {}) => get(`${V1}/orders${qs(p)}`);
export const createOrder = (d) => post(`${V1}/orders`, d);
export const approveOrder = (id) => post(`${V1}/orders/${id}/approve`, {});
export const updateOrder = (id, p) => patch(`${V1}/orders/${id}${qs(p)}`, {});
export const fetchEvents = (p = {}) => get(`${V1}/events${qs(p)}`);
export const getConfig = () => get(`${V1}/config`);

// ── V1: Browser Agent ───────────────────────────────────────────────────
export const createBrowserTask = (d) => post(`${V1}/browser/tasks`, d);
export const fetchBrowserTasks = (p = {}) => get(`${V1}/browser/tasks${qs(p)}`);
export const getBrowserTask = (id) => get(`${V1}/browser/tasks/${id}`);
export const cancelBrowserTask = (id) => post(`${V1}/browser/tasks/${id}/cancel`, {});
export const sendBrowserMsg = (id, msg) => post(`${V1}/browser/tasks/${id}/message`, { message: msg });
export const getBrowserChat = (id) => get(`${V1}/browser/tasks/${id}/chat`);
export const getBrowserScreenshots = (id) => get(`${V1}/browser/tasks/${id}/screenshots`);

// ── V1: Supply Graph ────────────────────────────────────────────────────
export const fetchGraphIndustries = () => get(`${V1}/graph/industries`);
export const fetchGraphIndustry = (id) => get(`${V1}/graph/industries/${id}`);
export const fetchGraphVis = (id) => get(`${V1}/graph/industries/${id}/vis`);
export const searchGraph = (q) => get(`${V1}/graph/search?q=${encodeURIComponent(q)}`);
export const fetchGraphComponents = () => get(`${V1}/graph/components`);
export const fetchGraphCategories = () => get(`${V1}/graph/categories`);
export const fetchGraphProductBom = (industry, product) => get(`${V1}/graph/industries/${industry}/products/${encodeURIComponent(product)}/bom`);

// ── V1: Crawler ─────────────────────────────────────────────────────────
export const startCrawler = (d) => post(`${V1}/crawler/start`, d);
export const fetchCrawlerJobs = () => get(`${V1}/crawler/jobs`);
export const getCrawlerJob = (id) => get(`${V1}/crawler/${id}`);
export const cancelCrawler = (id) => post(`${V1}/crawler/${id}/cancel`, {});
export const importCrawler = (id) => post(`${V1}/crawler/${id}/import`, {});

// ── V1: LLM Negotiation ────────────────────────────────────────────────
export const getLlmNegStatus = () => get(`${V1}/negotiation/llm-status`);
export const createNegSession = (d) => post(`${V1}/negotiation/sessions`, d);
export const fetchNegSessions = () => get(`${V1}/negotiation/sessions`);
export const getNegSession = (id) => get(`${V1}/negotiation/sessions/${id}`);
export const generateNegMsg = (id) => post(`${V1}/negotiation/sessions/${id}/generate`, {});
export const sendNegReply = (id, msg) => post(`${V1}/negotiation/sessions/${id}/reply`, { message: msg });

// ── V2: Expert Memory ───────────────────────────────────────────────────
export const fetchV2Dashboard = () => get(`${V2}/v2/dashboard`);
export const createInsight = (d) => post(`${V2}/expert/insights`, d);
export const fetchInsights = (p = {}) => get(`${V2}/expert/insights${qs(p)}`);
export const deleteInsight = (id) => del(`${V2}/expert/insights/${id}`);
export const createTag = (d) => post(`${V2}/expert/tags`, d);
export const fetchTags = (p = {}) => get(`${V2}/expert/tags${qs(p)}`);
export const createAvoidance = (d) => post(`${V2}/expert/avoidance`, d);
export const fetchAvoidance = (p = {}) => get(`${V2}/expert/avoidance${qs(p)}`);
export const aiRecommend = (d) => post(`${V2}/expert/recommend`, d);

// ── V2: BOM Router ──────────────────────────────────────────────────────
export const createBomProject = (d) => post(`${V2}/bom/projects`, d);
export const fetchBomProjects = (p = {}) => get(`${V2}/bom/projects${qs(p)}`);
export const fetchBomProject = (id) => get(`${V2}/bom/projects/${id}`);
export const createBomItem = (d) => post(`${V2}/bom/items`, d);
export const autoRoute = (id) => post(`${V2}/bom/items/${id}/auto-route`, {});
export const createVendorMap = (d) => post(`${V2}/bom/vendor-map`, d);
export const fetchVendorMaps = (p = {}) => get(`${V2}/bom/vendor-map${qs(p)}`);

// ── V2: Relationships ───────────────────────────────────────────────────
export const createRelationship = (d) => post(`${V2}/relationships`, d);
export const fetchRelationships = (p = {}) => get(`${V2}/relationships${qs(p)}`);
export const patchRelationship = (id, d) => patch(`${V2}/relationships/${id}`, d);
export const logRelEvent = (d) => post(`${V2}/relationships/events`, d);
export const fetchRelEvents = (p = {}) => get(`${V2}/relationships/events${qs(p)}`);

// ── V2: RFQ ─────────────────────────────────────────────────────────────
export const createRfq = (d) => post(`${V2}/rfq`, d);
export const fetchRfqs = (p = {}) => get(`${V2}/rfq${qs(p)}`);
export const fetchRfq = (id) => get(`${V2}/rfq/${id}`);
export const patchRfq = (id, d) => patch(`${V2}/rfq/${id}`, d);
export const submitQuote = (d) => post(`${V2}/rfq/quotes`, d);
export const compareQuotes = (id) => post(`${V2}/rfq/${id}/compare`, {});

// ── V2: Quality & Risk ──────────────────────────────────────────────────
export const createQuality = (d) => post(`${V2}/quality/records`, d);
export const fetchQuality = (p = {}) => get(`${V2}/quality/records${qs(p)}`);
export const createAlert = (d) => post(`${V2}/quality/alerts`, d);
export const fetchAlerts = (p = {}) => get(`${V2}/quality/alerts${qs(p)}`);
export const fetchAlternatives = (p = {}) => get(`${V2}/quality/alternatives${qs(p)}`);

// ── V2: Procurement ─────────────────────────────────────────────────────
export const createProcProject = (d) => post(`${V2}/procurement/projects`, d);
export const fetchProcProjects = (p = {}) => get(`${V2}/procurement/projects${qs(p)}`);
export const fetchProcProject = (id) => get(`${V2}/procurement/projects/${id}`);
export const createProcLine = (d) => post(`${V2}/procurement/lines`, d);

// ── V2: Intelligence ────────────────────────────────────────────────────
export const fetchPriceBenchmarks = (p = {}) => get(`${V2}/intelligence/price-benchmarks${qs(p)}`);
export const fetchReliability = (p = {}) => get(`${V2}/intelligence/supplier-reliability${qs(p)}`);
export const fetchIndustryBenchmarks = (p = {}) => get(`${V2}/intelligence/industry-benchmarks${qs(p)}`);

// ── Marketplace ─────────────────────────────────────────────────────────
export const fetchMpDashboard = () => get(`${MP}/dashboard`);
export const fetchBuyerRequests = (p = {}) => get(`${MP}/buyer/requests${qs(p)}`);
export const createBuyerRequest = (d) => post(`${MP}/buyer/requests`, d);
export const confirmBuyerReq = (id) => post(`${MP}/buyer/requests/${id}/confirm`, {});
export const matchListings = (id) => post(`${MP}/buyer/requests/${id}/match`, {});
export const aiParse = (text) => post(`${MP}/ai/parse`, { text });
export const fetchListings = (p = {}) => get(`${MP}/seller/listings${qs(p)}`);
export const createListing = (d) => post(`${MP}/seller/listings`, d);
export const fetchMpOrders = (p = {}) => get(`${MP}/orders${qs(p)}`);
export const createMpOrder = (d) => post(`${MP}/orders`, d);

const MPP = `${API}/api/marketplace/payments`;
export const sellerOnboard = (d) => post(`${MPP}/sellers/onboard`, d);
export const fetchSellerProfile = (email) => get(`${MPP}/sellers/${encodeURIComponent(email)}/profile`);
export const sellerDashboardLink = (email) => post(`${MPP}/sellers/${encodeURIComponent(email)}/dashboard-link`, {});
export const fetchSellerBalance = (email) => get(`${MPP}/sellers/${encodeURIComponent(email)}/balance`);
export const createMpCheckout = (d) => post(`${MPP}/checkout`, d);

// ── Supply Chain Ops (Fulfillment + Compliance + Payments) ────────────
const OPS = `${API}/api/supply-chain-ops`;

export const fetchFulfillmentDash = () => get(`${OPS}/fulfillment/dashboard`);
export const fetchFulfillmentOrders = () => get(`${OPS}/fulfillment/orders`);
export const fetchFulfillmentOrder = (id) => get(`${OPS}/fulfillment/orders/${id}`);
export const fetchFulfillmentSamples = () => get(`${OPS}/fulfillment/samples`);
export const createFulfillmentSample = (d) => post(`${OPS}/fulfillment/samples`, d);
export const updateSampleStatus = (id, d) => patch(`${OPS}/fulfillment/samples/${id}/status`, d);
export const createFulfillmentOrder = (d) => post(`${OPS}/fulfillment/orders`, d);
export const updateMilestone = (oid, name, d) => patch(`${OPS}/fulfillment/orders/${oid}/milestones/${name}`, d);
export const checkDelays = () => post(`${OPS}/fulfillment/check-delays`, {});

export const fetchComplianceDash = () => get(`${OPS}/compliance/dashboard`);
export const fetchSupplierCredits = () => get(`${OPS}/compliance/supplier-credit`);
export const fetchComplianceChecks = () => get(`${OPS}/compliance/checks`);
export const fetchCertifications = () => get(`${OPS}/compliance/certifications`);
export const fetchExpiringCerts = (days = 90) => get(`${OPS}/compliance/certifications/expiring?days=${days}`);
export const createCertification = (d) => post(`${OPS}/compliance/certifications`, d);

export const fetchPaymentsDash = () => get(`${OPS}/payments/dashboard`);
export const fetchInvoices = () => get(`${OPS}/payments/invoices`);
export const createInvoice = (d) => post(`${OPS}/payments/invoices`, d);
export const approveInvoice = (id, d) => post(`${OPS}/payments/invoices/${id}/approve`, d);
export const fetchPendingApprovals = () => get(`${OPS}/payments/approvals`);
export const decideApproval = (id, d) => post(`${OPS}/payments/approvals/${id}/decide`, d);
export const fetchAccountsPayable = () => get(`${OPS}/payments/accounts-payable`);

// ── Supply Chain Trust + Revenue ──────────────────────────────────────
const TR = `${API}/api/supply-chain-trust`;

export const fetchTrustDash = () => get(`${TR}/trust/dashboard`);
export const fetchCertifiedSuppliers = (tier) => get(`${TR}/trust/supplier-certifications${tier ? `?tier=${tier}` : ''}`);
export const fetchSupplierTrustProfile = (name) => get(`${TR}/trust/supplier-certifications/${encodeURIComponent(name)}`);
export const fetchSupplierReviews = (name) => get(`${TR}/trust/reviews/supplier/${encodeURIComponent(name)}`);
export const fetchAllReviews = () => get(`${TR}/trust/reviews`);
export const submitReview = (d) => post(`${TR}/trust/reviews`, d);
export const fetchDisputes = () => get(`${TR}/trust/disputes`);
export const createDispute = (d) => post(`${TR}/trust/disputes`, d);
export const updateDisputeStatus = (id, d) => patch(`${TR}/trust/disputes/${id}/status`, d);
export const fetchGuarantees = () => get(`${TR}/trust/guarantees`);
export const claimGuarantee = (id) => patch(`${TR}/trust/guarantees/${id}/claim`, {});

export const fetchRevenueDash = () => get(`${TR}/revenue/dashboard`);
export const fetchRevenueTransactions = () => get(`${TR}/revenue/transactions`);
export const fetchRevenuePricing = () => get(`${TR}/revenue/pricing`);
export const fetchRevenueProjections = () => get(`${TR}/revenue/projections`);

// ── AI Agent ─────────────────────────────────────────────────────────
export const agentChat = (msg, lang = 'en', context = {}, history = [], session_id = '') =>
  post(`${V1}/agent`, { message: msg, lang, context, history, session_id });
export const fetchAgentAudit = (p = {}) => get(`${V1}/agent/audit${qs(p)}`);

// ── Notifications ────────────────────────────────────────────────────
export const fetchNotifications = (p = {}) => get(`${V1}/notifications${qs(p)}`);
export const markNotifRead = (id) => post(`${V1}/notifications/${id}/read`, {});
export const markAllNotifRead = (userId = '') => post(`${V1}/notifications/read-all${userId ? `?user_id=${userId}` : ''}`, {});
export const sendNotification = (data) => post(`${V1}/notifications/send`, data);
export const fetchNotifPreferences = (userId = 'default') => get(`${V1}/notifications/preferences?user_id=${userId}`);
export const updateNotifPreferences = (data) => post(`${V1}/notifications/preferences`, data);
export const fetchNotifDeliveries = (p = {}) => get(`${V1}/notifications/deliveries${qs(p)}`);

// ── Logistics Tracking ──────────────────────────────────────────────
export const fetchLogistics = (p = {}) => get(`${V1}/logistics${qs(p)}`);
export const createLogistics = (data) => post(`${V1}/logistics`, data);
export const updateLogistics = (id, data) => post(`${V1}/logistics/${id}/update`, data);
export const fetchLogisticsDashboard = () => get(`${V1}/logistics/dashboard`);

// ── Auto-Negotiation ────────────────────────────────────────────────
export const startAutoNeg = (data) => post(`${V1}/auto-negotiate`, data);
export const fetchAutoNeg = (id) => get(`${V1}/auto-negotiate/${id}`);
export const autoNegNextRound = (id) => post(`${V1}/auto-negotiate/${id}/next-round`, {});
export const autoNegAccept = (id, idx = 0) => post(`${V1}/auto-negotiate/${id}/accept?supplier_idx=${idx}`, {});
export const fetchAutoNegList = (p = {}) => get(`${V1}/auto-negotiate${qs(p)}`);

// ── Marketing Engine (对标阿里妈妈) ─────────────────────────────────
export const createCampaign = (data) => post(`${V1}/marketing/campaigns`, data);
export const fetchCampaigns = () => get(`${V1}/marketing/campaigns`);
export const fetchMarketingDashboard = () => get(`${V1}/marketing/dashboard`);
export const optimizeCampaign = (id = '') => post(`${V1}/marketing/optimize?campaign_id=${id}`, {});

// ── Business Intelligence (对标生意参谋) ─────────────────────────────
export const fetchBIOverview = () => get(`${V1}/intelligence/overview`);
export const fetchMarketTrends = () => get(`${V1}/intelligence/market-trends`);

// ── AI Control Tower (对标 Medline) ──────────────────────────────────
export const fetchControlTower = () => get(`${V1}/control-tower/overview`);
export const fetchControlAlerts = () => get(`${V1}/control-tower/alerts`);

// ── Warehouse Intelligence (对标京东物流) ────────────────────────────
export const fetchWarehouseOverview = () => get(`${V1}/warehouse/overview`);
export const fetchWarehouseRouting = (dest = 'US') => get(`${V1}/warehouse/routing?destination=${dest}`);

// ── Cross-Border Compliance (对标 Deel) ──────────────────────────────
export const fetchComplianceOverview = () => get(`${V1}/compliance/overview`);
export const fetchContracts = () => get(`${V1}/compliance/contracts`);
export const calcTax = (p = {}) => get(`${V1}/compliance/tax-calculator${qs(p)}`);
export const fetchMultiCurrency = () => get(`${V1}/compliance/multi-currency`);

// ── Fulfillment Optimizer (对标 Amazon FBA) ──────────────────────────
export const fetchFulfillmentOptimizer = () => get(`${V1}/fulfillment/optimizer`);

// ── RaaS Engine ─────────────────────────────────────────────────────
export const fetchRaaSPlans = () => get(`${V1}/raas/plans`);
export const createRaaSContract = (d) => post(`${V1}/raas/contracts`, d);
export const fetchRaaSContracts = () => get(`${V1}/raas/contracts`);
export const fetchRaaSDashboard = () => get(`${V1}/raas/dashboard`);
export const fetchRaaSUsage = () => get(`${V1}/raas/usage`);

// ── Asset Lifecycle ─────────────────────────────────────────────────
export const registerAsset = (d) => post(`${V1}/assets/register`, d);
export const fetchAssets = () => get(`${V1}/assets`);
export const fetchAssetLifecycle = () => get(`${V1}/assets/lifecycle-overview`);
export const fetchDeploymentPipeline = () => get(`${V1}/assets/deployment-pipeline`);

// ── Financial Infrastructure ────────────────────────────────────────
export const fetchFinanceOverview = () => get(`${V1}/finance/overview`);
export const fetchMilestonePayments = () => get(`${V1}/finance/milestones`);
export const fetchInsuranceProducts = () => get(`${V1}/finance/insurance`);
export const fetchRiskScoring = () => get(`${V1}/finance/risk-scoring`);
export const fetchTradeCredit = () => get(`${V1}/finance/trade-credit`);

// ── Strategic Overview ──────────────────────────────────────────────
export const fetchStrategyOverview = () => get(`${V1}/strategy/market-position`);

// ── Revenue Engine ──────────────────────────────────────────────────
export const fetchRevenueArch = () => get(`${V1}/revenue-arch/model`);
export const fetchPackages = () => get(`${V1}/packages`);
export const createPackageDeal = (d) => post(`${V1}/packages/deals`, d);
export const fetchPackageDeals = () => get(`${V1}/packages/deals`);
export const fetchPackagesPipeline = () => get(`${V1}/packages/pipeline`);
export const fetchAttachOverview = () => get(`${V1}/attach/overview`);
export const fetchRiskPricingEngine = () => get(`${V1}/risk-pricing/engine`);
export const generateRiskQuote = (d) => post(`${V1}/risk-pricing/quote`, d);
export const fetchGrowthMetrics = () => get(`${V1}/growth/metrics`);
export const fetchActionBoard = () => get(`${V1}/actions/board`);
export const simulateRevenue = (d) => post(`${V1}/growth/simulate`, d);

// ── GeoIntel ────────────────────────────────────────────────────────
export const fetchGeoEvents = (p = {}) => get(`${V1}/geointel/events${qs(p)}`);
export const fetchGeoEvent = (id) => get(`${V1}/geointel/events/${id}`);
export const fetchResilience = () => get(`${V1}/geointel/resilience`);
export const fetchIndustryChains = () => get(`${V1}/geointel/industry-chains`);
export const fetchMarkets = () => get(`${V1}/geointel/markets`);
export const fetchTradingSignals = () => get(`${V1}/geointel/signals`);
export const fetchPlaybook = () => get(`${V1}/geointel/playbook`);

// ── AI Trading ──────────────────────────────────────────────────────
export const fetchPredictions = (p = {}) => get(`${V1}/ai-trading/predictions${qs(p)}`);
export const fetchImpactStream = () => get(`${V1}/ai-trading/impact-stream`);
export const fetchArbitrage = () => get(`${V1}/ai-trading/arbitrage`);
export const executeTrade = (d) => post(`${V1}/ai-trading/execute`, d);
export const executeArb = (d) => post(`${V1}/ai-trading/execute-arb`, d);
export const fetchTrades = (p = {}) => get(`${V1}/ai-trading/trades${qs(p)}`);
export const fetchPortfolio = () => get(`${V1}/ai-trading/portfolio`);
export const closePosition = (d) => post(`${V1}/ai-trading/close-position`, d);
export const runBacktest = (d) => post(`${V1}/ai-trading/backtest`, d);

// ── Finance Data (Multi-source) ─────────────────────────────────────
export const fetchFinanceQuote = (symbol = 'NVDA') => get(`${V1}/finance/quote?symbol=${symbol}`);
export const fetchFinanceWatchlist = () => get(`${V1}/finance/watchlist`);
export const fetchFinanceHistorical = (symbol = 'NVDA', days = 30) => get(`${V1}/finance/historical?symbol=${symbol}&days=${days}`);
export const fetchFinanceTechnicals = (symbol = 'NVDA') => get(`${V1}/finance/technicals?symbol=${symbol}`);
export const fetchCompanyNews = (symbol = 'NVDA') => get(`${V1}/finance/company-news?symbol=${symbol}`);
export const fetchSectorHeatmap = () => get(`${V1}/finance/sector-heatmap`);
export const fetchEconomicCalendar = () => get(`${V1}/finance/economic-calendar`);
export const fetchCorrelationMatrix = () => get(`${V1}/finance/correlation-matrix`);
export const fetchDataSourcesStatus = () => get(`${V1}/finance/data-sources-status`);

// ── Push Engine (Twilio/SendGrid/Feishu/WeChat/Slack) ──────────────
export const sendPush = (d) => post(`${V1}/push/send`, d);
export const testPushChannel = (d) => post(`${V1}/push/test`, d);
export const fetchPushConfig = () => get(`${V1}/push/config`);
export const updatePushConfig = (d) => post(`${V1}/push/config`, d);
export const fetchPushLog = (limit = 50) => get(`${V1}/push/log?limit=${limit}`);

// ── Alert Rules Engine (Visual Builder) ────────────────────────────
export const fetchRuleBuilderConfig = () => get(`${V1}/rules/builder-config`);
export const fetchAlertRulesAll = (activeOnly = false) => get(`${V1}/rules?active_only=${activeOnly}`);
export const getAlertRule = (id) => get(`${V1}/rules/${id}`);
export const createAlertRuleV2 = (d) => post(`${V1}/rules`, d);
export const updateAlertRule = (id, d) => patch(`${V1}/rules/${id}`, d);
export const deleteAlertRule = (id) => del(`${V1}/rules/${id}`);
export const dryRunRule = (d) => post(`${V1}/rules/dry-run`, d);
export const fetchRuleHistory = (limit = 50) => get(`${V1}/rules/history?limit=${limit}`);
export const fetchRuleTemplates = () => get(`${V1}/rules/templates`);
export const createRuleFromTemplate = (tplId, name = '', asset = '', value = 0) => post(`${V1}/rules/from-template/${tplId}?name=${encodeURIComponent(name)}&asset=${encodeURIComponent(asset)}&value=${value}`, {});

// ── Live Data (Real Sources) ────────────────────────────────────────
export const fetchGdeltEvents = (p = {}) => get(`${V1}/live/gdelt-events${qs(p)}`);
export const fetchLiveMarketPrices = () => get(`${V1}/live/market-prices`);
export const fetchLiveFxRates = (base = 'USD') => get(`${V1}/live/fx-rates?base=${base}`);
export const fetchLiveNews = (p = {}) => get(`${V1}/live/news${qs(p)}`);
export const fetchExtendedChains = () => get(`${V1}/live/industry-chains-extended`);
export const fetchLiveAlerts = (p = {}) => get(`${V1}/live/alerts${qs(p)}`);
export const fetchAlertRules = () => get(`${V1}/live/alert-rules`);
export const createAlertRule = (d) => post(`${V1}/live/alert-rules`, d);
export const markAlertRead = (id) => post(`${V1}/live/alerts/${id}/read`, {});
export const testWebhook = (d) => post(`${V1}/live/webhook-test`, d);
export const fetchLiveDashboard = () => get(`${V1}/live/dashboard`);

// ── Parts Catalog ────────────────────────────────────────────────────
const PC = `${API}/api/parts-catalog`;

export const fetchPartCategories = () => get(`${PC}/categories`);
export const fetchParts = (p = {}) => get(`${PC}/parts${qs(p)}`);
export const fetchPartDetail = (id) => get(`${PC}/parts/${id}`);
export const fetchPartStats = () => get(`${PC}/stats`);
export const fetchPartSuppliers = (category) => get(`${PC}/suppliers${category ? `?category=${category}` : ''}`);

// ── Humanoid Atlas ───────────────────────────────────────────────────
const HA = `${API}/api/humanoid-atlas`;

export const fetchHumanoidRegions = () => get(`${HA}/body-regions`);
export const fetchHumanoidRegionDetail = (id) => get(`${HA}/body-regions/${id}`);
export const fetchHumanoidOem = (country) => get(`${HA}/oem${country ? `?country=${country}` : ''}`);
export const fetchHumanoidLayers = () => get(`${HA}/supply-chain-layers`);
export const fetchHumanoidSuppliers = (category) => get(`${HA}/component-suppliers${category ? `?category=${category}` : ''}`);
export const searchHumanoidComponents = (q) => get(`${HA}/search?q=${encodeURIComponent(q)}`);
export const fetchHumanoidBomTree = () => get(`${HA}/bom-tree`);
export const fetchHumanoidStats = () => get(`${HA}/stats`);

// ── EDA Design Platform ──────────────────────────────────────────────
const EDA = `${API}/api/eda`;
const PCB = `${API}/api/pcb-order`;

export const fetchEdaProjects = (p = {}) => get(`${EDA}/projects${qs(p)}`);
export const createEdaProject = (d) => post(`${EDA}/projects`, d);
export const fetchEdaProject = (id) => get(`${EDA}/projects/${id}`);
export const updateEdaProject = (id, d) => patch(`${EDA}/projects/${id}`, d);
export const deleteEdaProject = (id) => del(`${EDA}/projects/${id}`);
export const uploadEdaGerber = (id, file) => { const fd = new FormData(); fd.append('file', file); const h = {}; const t = getAccessToken(); if (t) h['Authorization'] = `Bearer ${t}`; return fetch(`${EDA}/projects/${id}/upload-gerber`, { method: 'POST', body: fd, headers: h }).then(j); };
export const uploadEdaKicad = (id, file) => { const fd = new FormData(); fd.append('file', file); const h = {}; const t = getAccessToken(); if (t) h['Authorization'] = `Bearer ${t}`; return fetch(`${EDA}/projects/${id}/upload-kicad`, { method: 'POST', body: fd, headers: h }).then(j); };
export const fetchEdaTemplates = () => get(`${EDA}/templates`);
export const searchEdaParts = (q, limit = 20) => get(`${EDA}/parts/search?q=${encodeURIComponent(q)}&limit=${limit}`);
export const fetchEdaStats = () => get(`${EDA}/stats`);

export const fetchPcbQuote = (spec) => post(`${PCB}/quote`, spec);
export const fetchPcbOrders = (p = {}) => get(`${PCB}/orders${qs(p)}`);
export const createPcbOrder = (d) => post(`${PCB}/orders`, d);
export const fetchPcbOrder = (id) => get(`${PCB}/orders/${id}`);
export const updatePcbOrder = (id, d) => patch(`${PCB}/orders/${id}`, d);
export const confirmPcbOrder = (id) => post(`${PCB}/orders/${id}/confirm`, {});
export const fetchPcbVendorOptions = () => get(`${PCB}/vendor-options`);

// ── Cloud MES / ERP / APS ───────────────────────────────────────────────
const MES = `${API}/api/mes`;

export const fetchMesDashboard = (p = {}) => get(`${MES}/dashboard${qs(p)}`);
export const fetchMesFactories = (p = {}) => get(`${MES}/factories${qs(p)}`);
export const createMesFactory = (d) => post(`${MES}/factories`, d);
export const fetchMesFactory = (id) => get(`${MES}/factories/${id}`);
export const fetchMesLines = (p = {}) => get(`${MES}/lines${qs(p)}`);
export const createMesLine = (d) => post(`${MES}/lines`, d);
export const fetchMesWorkOrders = (p = {}) => get(`${MES}/work-orders${qs(p)}`);
export const createMesWorkOrder = (d) => post(`${MES}/work-orders`, d);
export const updateMesWorkOrder = (id, p) => patch(`${MES}/work-orders/${id}${qs(p)}`, {});
export const fetchMesInventory = (p = {}) => get(`${MES}/inventory${qs(p)}`);
export const createMesInventory = (d) => post(`${MES}/inventory`, d);
export const adjustMesInventory = (id, p) => patch(`${MES}/inventory/${id}/adjust${qs(p)}`, {});
export const fetchMesQuality = (p = {}) => get(`${MES}/quality${qs(p)}`);
export const createMesQuality = (d) => post(`${MES}/quality`, d);
export const fetchMesSchedules = (p = {}) => get(`${MES}/schedules${qs(p)}`);
export const createMesSchedule = (d) => post(`${MES}/schedules`, d);
export const fetchMesEvents = (p = {}) => get(`${MES}/events${qs(p)}`);
export const fetchMesAiScheduling = (fid) => post(`${MES}/ai/scheduling-suggestion?factory_id=${fid}`, {});
export const fetchMesAiQuote = (p = {}) => post(`${MES}/ai/quote-prediction${qs(p)}`, {});
export const fetchMesAiAnalytics = (p = {}) => get(`${MES}/ai/production-analytics${qs(p)}`);
export const fetchMesTrace = (poId) => get(`${MES}/trace/order/${poId}`);
export const uploadQualityImages = (qid, files) => {
  const fd = new FormData(); files.forEach(f => fd.append('files', f));
  const h = {}; const t = getAccessToken(); if (t) h['Authorization'] = `Bearer ${t}`;
  return fetch(`${MES}/quality/${qid}/upload-images`, { method: 'POST', body: fd, headers: h }).then(j);
};
export const uploadWorkOrderEvidence = (woid, files, type = 'progress', notes = '') => {
  const fd = new FormData(); files.forEach(f => fd.append('files', f));
  const h = {}; const t = getAccessToken(); if (t) h['Authorization'] = `Bearer ${t}`;
  return fetch(`${MES}/work-orders/${woid}/upload-evidence?evidence_type=${type}&notes=${encodeURIComponent(notes)}`, { method: 'POST', body: fd, headers: h }).then(j);
};

// ── APS Simulation ───────────────────────────────────────────────────
const APS = `${API}/api/aps`;

export const fetchApsScenarios = (p = {}) => get(`${APS}/scenarios${qs(p)}`);
export const createApsScenario = (d) => post(`${APS}/scenarios`, d);
export const fetchApsScenario = (id) => get(`${APS}/scenarios/${id}`);
export const runApsSimulation = (id) => post(`${APS}/scenarios/${id}/run`, {});
export const fetchApsGantt = (id) => get(`${APS}/scenarios/${id}/gantt`);
export const apsWhatIf = (d) => post(`${APS}/what-if`, d);
export const apsCompare = (ids) => get(`${APS}/compare?ids=${ids}`);
export const apsAutoSchedule = (factoryId, horizon = 14, objective = 'on_time') => post(`${APS}/auto-schedule?factory_id=${factoryId}&horizon_days=${horizon}&objective=${objective}`, {});
export const syncBuyerView = (d) => post(`${APS}/buyer-view/sync`, d);
export const fetchBuyerView = (poId) => get(`${APS}/buyer-view/${poId}`);
export const fetchBuyerViews = (p = {}) => get(`${APS}/buyer-view${qs(p)}`);

// ── 3D CAD Design ────────────────────────────────────────────────────
const CAD = `${API}/api/cad-design`;

export const fetchCadTemplates = () => get(`${CAD}/templates`);
export const fetchCadMaterials = (cat) => get(`${CAD}/materials${cat ? `?category=${cat}` : ''}`);
export const fetchCadProcesses = () => get(`${CAD}/processes`);
export const fetchCadSuppliers = (cap) => get(`${CAD}/suppliers${cap ? `?capability=${cap}` : ''}`);
export const fetchCadEngineStatus = () => get(`${CAD}/engine-status`);
export const estimateCadCost = (body) => post(`${CAD}/estimate`, body);
export const getCadQuote = (body) => post(`${CAD}/quote`, body);
export const createCadDesign = (body) => post(`${CAD}/designs`, body);
export const listCadDesigns = () => get(`${CAD}/designs`);
export const getCadDesign = (id) => get(`${CAD}/designs/${id}`);
export const updateCadDesign = (id, body) => patch(`${CAD}/designs/${id}`, body);
export const exportCadDesign = (id, fmt = 'step') => post(`${CAD}/designs/${id}/export?format=${fmt}`, {});
export const previewCadStl = (id, idx = 0) => get(`${CAD}/designs/${id}/preview-stl?part_index=${idx}`);
export const previewPartStl = (body) => post(`${CAD}/part-preview-stl`, body);
export const generateCadRfq = (id) => post(`${CAD}/designs/${id}/generate-rfq`, {});
export const quickCadRfq = (body) => post(`${CAD}/quick-rfq`, body);
export const getCadRfqQuotes = (body) => post(`${CAD}/rfq-quotes`, body);
export const fetchCadStats = () => get(`${CAD}/stats`);

// ── Project Workspace ────────────────────────────────────────────────
const PW = `${API}/api/project-workspace`;

export const fetchProductTypes = () => get(`${PW}/product-types`);
export const fetchProjectStages = () => get(`${PW}/stages`);
export const createProject = (d) => post(`${PW}/projects`, d);
export const fetchProjects = (p = {}) => get(`${PW}/projects${qs(p)}`);
export const fetchProject = (id) => get(`${PW}/projects/${id}`);
export const updateProject = (id, d) => patch(`${PW}/projects/${id}`, d);
export const advanceProjectStage = (id) => post(`${PW}/projects/${id}/advance-stage`, {});
export const addProjectVersion = (id, note = '') => post(`${PW}/projects/${id}/add-version?note=${encodeURIComponent(note)}`, {});
export const addProjectCost = (id, category, amount) => post(`${PW}/projects/${id}/add-cost?category=${encodeURIComponent(category)}&amount=${amount}`, {});
export const linkProjectResource = (id, type, rid) => post(`${PW}/projects/${id}/link?resource_type=${type}&resource_id=${rid}`, {});
export const addProjectMilestone = (id, name, target) => post(`${PW}/projects/${id}/milestones?name=${encodeURIComponent(name)}&target=${target}`, {});
export const fetchProjectDashboard = () => get(`${PW}/dashboard`);

// ── AI Product Wizard ────────────────────────────────────────────────
const WIZ = `${API}/api/product-wizard`;

export const fetchWizardPresets = () => get(`${WIZ}/presets`);
export const fetchTechStackDb = () => get(`${WIZ}/tech-stack-db`);
export const generateProductPlan = (d) => post(`${WIZ}/generate`, d);
export const refineProductPlan = (d) => post(`${WIZ}/refine`, d);

// ── Component Search ─────────────────────────────────────────────────
const CS = `${API}/api/component-search`;

export const fetchComponentDistributors = () => get(`${CS}/distributors`);
export const searchComponents = (q, category = '', limit = 20) => get(`${CS}/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&limit=${limit}`);
export const fetchComponentCategories = () => get(`${CS}/categories`);
export const crossReferenceComponent = (mpn) => get(`${CS}/cross-reference/${encodeURIComponent(mpn)}`);
export const compareComponents = (mpns) => post(`${CS}/compare`, { mpns });
export const fetchPopularComponents = () => get(`${CS}/popular`);

// ── Market Intelligence ──────────────────────────────────────────────
const MI = `${API}/api/market-intelligence`;

export const searchPatents = (q, limit = 20) => get(`${MI}/patents?q=${encodeURIComponent(q)}&limit=${limit}`);
export const searchCrowdfunding = (q, category = '') => get(`${MI}/crowdfunding?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`);
export const fetchTrendingCampaigns = () => get(`${MI}/crowdfunding/trending`);
export const searchFcc = (q) => get(`${MI}/fcc/search?q=${encodeURIComponent(q)}`);
export const fetchTeardowns = (q = '') => get(`${MI}/teardowns?q=${encodeURIComponent(q)}`);
export const fetchTeardown = (id) => get(`${MI}/teardowns/${id}`);
export const fetchMarketSummary = (q) => get(`${MI}/summary?q=${encodeURIComponent(q)}`);

// ── Compliance Guide ─────────────────────────────────────────────────
const CG = `${API}/api/compliance-guide`;

export const fetchComplianceProductTypes = () => get(`${CG}/product-types`);
export const fetchComplianceMarkets = () => get(`${CG}/markets`);
export const checkCompliance = (d) => post(`${CG}/check`, d);
export const fetchComplianceCertifications = (p = {}) => get(`${CG}/certifications${qs(p)}`);
export const fetchComplianceAgencies = (region = '') => get(`${CG}/agencies${region ? `?region=${region}` : ''}`);

// ── Prototype Bundle ─────────────────────────────────────────────────
const PB = `${API}/api/prototype-bundle`;

export const fetchBundlePackages = () => get(`${PB}/packages`);
export const fetchDemoBom = () => get(`${PB}/demo-bom`);
export const fetchShippingOptions = () => get(`${PB}/shipping-options`);
export const splitBom = (d) => post(`${PB}/split`, d);
export const fetchBundle = (id) => get(`${PB}/bundles/${id}`);
export const checkoutBundle = (d) => post(`${PB}/checkout`, d);

// ── Design Templates ─────────────────────────────────────────────────
const DT = `${API}/api/design-templates`;

export const fetchDesignTemplateCategories = () => get(`${DT}/categories`);
export const fetchDesignTemplates = (p = {}) => get(`${DT}/templates${qs(p)}`);
export const fetchDesignTemplateDetail = (id) => get(`${DT}/templates/${id}`);
export const fetchDesignTemplateFeatured = () => get(`${DT}/featured`);
export const fetchDesignTemplateTutorials = () => get(`${DT}/tutorials`);
export const fetchDesignTemplateStats = () => get(`${DT}/stats`);
