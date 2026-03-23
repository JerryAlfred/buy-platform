const API = import.meta.env.VITE_API_URL || 'https://fearless-backend-533466225971.us-central1.run.app';
const V1 = `${API}/api/supply-chain`;
const V2 = `${API}/api/supply-chain/v2`;
const MP = `${API}/api/marketplace`;

const j = (r) => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json(); };
const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(j);
const get = (url) => fetch(url).then(j);
const patch = (url, body) => fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(j);
const del = (url) => fetch(url, { method: 'DELETE' }).then(j);
const qs = (p) => { const o = {}; for (const [k, v] of Object.entries(p)) { if (v !== '' && v !== undefined && v !== null) o[k] = v; } const s = new URLSearchParams(o).toString(); return s ? `?${s}` : ''; };

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
export const uploadEdaGerber = (id, file) => { const fd = new FormData(); fd.append('file', file); return fetch(`${EDA}/projects/${id}/upload-gerber`, { method: 'POST', body: fd }).then(j); };
export const uploadEdaKicad = (id, file) => { const fd = new FormData(); fd.append('file', file); return fetch(`${EDA}/projects/${id}/upload-kicad`, { method: 'POST', body: fd }).then(j); };
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
