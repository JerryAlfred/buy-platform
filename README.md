# RobotBuy OS

**AI-Native Supply Chain Procurement Platform**

Live: [buy.roboticscenter.ai](https://buy.roboticscenter.ai)

## Architecture

```
buy-platform/          ← This repo (frontend)
  src/
    pages/             ← 23+ page components
    api.js             ← API client → backend
    auth.jsx           ← Auth / RBAC
    i18n.jsx           ← EN/ZH translations
    App.jsx            ← App shell + navigation

Backend: fearless-backend (separate repo)
  /api/supply-chain/*
  /api/marketplace/*
  /api/supply-chain-ops/*
  /api/supply-chain-trust/*
```

## Pages

| Group | Pages |
|-------|-------|
| Command Center | Flywheel KPIs, Dashboard, Confidence System |
| Transaction Layer | Marketplace, Exclusive Agency, RFQ Engine, AI Negotiation, BOM Router, Orchestration |
| Execution Layer | Milestone Payments, Order Tracking, Production Verify, Cert & Compliance, Customer Portal |
| Supplier Network | Suppliers, Expert Memory, Trust Scores, Credit System, Relationships, Intelligence |
| AI Agents | Browser Agent, Supply Graph, Batch Crawler |
| Operations | Supply Requests, Timeline |
| Quality | Quality & Risk |
| Finance & Revenue | Fulfillment, Payments & Finance, Revenue Hub |
| System | Organization, Roles & Permissions, Account |

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # Production build
```

## Deployment

**Auto-deploy via Vercel Git Integration:**
- Push to `main` → auto-deploys to [buy.roboticscenter.ai](https://buy.roboticscenter.ai)
- PR → preview deployment

**Manual deploy:**
```bash
vercel --prod
```

## Tech Stack

- React 19 + Vite 8
- Vercel (hosting + CDN)
- Backend: FastAPI + SQLAlchemy (Google Cloud Run)
