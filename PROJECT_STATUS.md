# AdMaster Pro — Project Status

**Live URL:** https://admasterai.nobleblocks.com  
**Repository:** https://github.com/bblist/admasterpro  
**Stack:** Next.js 14 · TypeScript · Prisma 5 · PostgreSQL · Stripe · OpenAI/Claude · AWS Lightsail  
**Last Updated:** June 2025  
**Latest Commit:** Phase 13 (Admin real data + Free audit feature)

---

## Current State: Ready for User Testing

The platform is live and functional. Users can sign up (Google OAuth or email), explore the dashboard, chat with the AI assistant, and subscribe to paid plans via Stripe (live mode).

---

## Infrastructure

| Component | Status | Details |
|-----------|--------|---------|
| Domain & SSL | ✅ Live | admasterai.nobleblocks.com via Let's Encrypt |
| Web Server | ✅ Running | PM2 → Next.js on port 3000 |
| WebSocket | ✅ Running | PM2 → ws-server on port 3001 |
| Nginx | ✅ Configured | Reverse proxy with SSL termination |
| PostgreSQL | ✅ Running | localhost:5432, 8 tables deployed |
| Stripe | ✅ Live Mode | Products, prices, webhook configured |
| Google OAuth | ✅ Working | Sign-in + Google Ads scope |
| Route Protection | ✅ Active | Middleware guards /dashboard/* and /admin/* |

### Server Details
| Item | Value |
|------|-------|
| Instance | AWS Lightsail `admasterpro-v2` |
| Spec | 2GB RAM, 2 vCPU, 60GB SSD |
| Static IP | `3.225.249.236` |
| OS | Ubuntu 24.04 LTS |
| SSH Key | `~/.ssh/lightsail-admasterpro.pem` |
| SSH | `ssh -i ~/.ssh/lightsail-admasterpro.pem ubuntu@3.225.249.236` |
| App Dir (server) | `/home/ubuntu/admasterpro` |
| App Dir (local) | `/Users/bblist/admasterpro` |

### Deploy Command
```bash
ssh -i ~/.ssh/lightsail-admasterpro.pem ubuntu@3.225.249.236 'cd /home/ubuntu/admasterpro && git pull origin main && npm run build 2>&1 | tail -20 && pm2 restart admasterpro'
```

---

## Database (Prisma 5 + PostgreSQL)

8 models deployed and active:

| Model | Purpose |
|-------|---------|
| `User` | email, name, picture, googleId, authMethod, refreshToken |
| `Subscription` | plan, status, limits, Stripe IDs, bonus tokens |
| `Usage` | Monthly AI message counters |
| `ChatMessage` | Conversation history per user |
| `CampaignDraft` | AI-generated campaign drafts |
| `Business` | Multi-business support |
| `KnowledgeBaseItem` | Uploaded brand assets |
| `TokenPurchase` | Top-up purchase records |

---

## Stripe Products (Live Mode)

| Product | Price ID | Amount |
|---------|----------|--------|
| Starter Plan | `price_1T4KGUEBVDcwowWrxjY5BtgE` | $49/mo |
| Pro Plan | `price_1T4KGlEBVDcwowWr4H1rrdh3` | $149/mo |
| Top-up 50 msgs | `price_1T4KH6EBVDcwowWraEGE0LC7` | $30 |
| Top-up 100 msgs | `price_1T4KH6EBVDcwowWrktI2ATKR` | $50 |
| Top-up 250 msgs | `price_1T4KH7EBVDcwowWrK2jIAjfO` | $100 |

Webhook endpoint active with signature verification.

---

## Pages (39 total)

### Public Pages
| Page | Status | Notes |
|------|--------|-------|
| `/` (Landing) | ✅ | Marketing page with features, pricing preview, testimonials |
| `/login` | ✅ | Google OAuth + email sign-in (httpOnly cookies) |
| `/pricing` | ✅ | 3 tiers + top-ups, Stripe checkout with real user session |
| `/onboarding` | ⚠️ Demo | Guided flow — doesn't persist data yet |
| `/privacy` | ✅ | Privacy policy |
| `/terms` | ✅ | Terms of service |

### Dashboard (Auth Required via Middleware)
| Page | Status | Notes |
|------|--------|-------|
| `/dashboard` | ✅ | Welcome page with 3-step getting started guide |
| `/dashboard/chat` | ✅ | AI assistant (GPT-4o primary, Claude fallback) |
| `/dashboard/campaigns` | ⚠️ | Empty state — needs Google Ads connection |
| `/dashboard/keywords` | ⚠️ | Empty state — needs Google Ads connection |
| `/dashboard/drafts` | ⚠️ | Empty state — needs Google Ads connection |
| `/dashboard/shopping` | ⚠️ | Empty state — retail businesses only |
| `/dashboard/knowledge-base` | ✅ | Full UI with sample data, upload, editing |
| `/dashboard/settings` | ✅ | Plan/billing from DB, auto-pilot, notifications |
| `/dashboard/faq` | ✅ | 30+ questions, correct plan names (Free/Starter/Pro) |
| `/dashboard/demo/examples` | ✅ | AI example showcases |
| `/dashboard/demo/*` | ✅ | Demo campaigns, keywords, drafts, shopping |

### Admin (Auth + ADMIN_EMAIL Required)
| Page | Status | Notes |
|------|--------|-------|
| `/admin` | ✅ | Overview with real DB stats |
| `/admin/users` | ⚠️ | Hardcoded demo data (will pull from DB later) |
| `/admin/revenue` | ⚠️ | Hardcoded demo data |
| `/admin/ai-costs` | ⚠️ | Hardcoded demo data |
| `/admin/analytics` | ⚠️ | Hardcoded demo data |

### API Routes
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/auth/callback` | GET | Google OAuth flow + DB persistence | ✅ |
| `/api/auth/email` | POST | Email sign-in with httpOnly cookie + DB | ✅ |
| `/api/auth/signout` | POST | Clears session cookie | ✅ |
| `/api/chat` | POST | GPT-4o / Claude AI chat with usage tracking | ✅ |
| `/api/stripe` | POST | Checkout, portal, webhook handler | ✅ |
| `/api/subscription` | GET | Current user plan, usage, name, picture | ✅ |
| `/api/admin/stats` | GET | Real DB stats for admin overview | ✅ |
| `/api/transcribe` | POST | Deepgram audio/video transcription | ✅ |

---

## Security

| Feature | Implementation |
|---------|---------------|
| Route Protection | Next.js middleware redirects unauthenticated users |
| Admin Access | Restricted to `ADMIN_EMAIL` env var |
| Session Cookies | httpOnly, secure, sameSite=lax (7-day expiry) |
| OAuth | Google OAuth 2.0 with refresh token storage |
| Stripe | Webhook signature verification |
| SSL | Let's Encrypt auto-renewing certificates |

---

## Environment Variables

All configured on both local (`.env.local`) and server (`.env`):

| Variable | Status |
|----------|--------|
| `OPENAI_API_KEY` | ✅ Set |
| `ANTHROPIC_API_KEY` | ✅ Set |
| `DEEPGRAM_API_KEY` | ✅ Set |
| `GOOGLE_CLIENT_ID` | ✅ Set |
| `GOOGLE_CLIENT_SECRET` | ✅ Set |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | ✅ Set |
| `DATABASE_URL` | ✅ Set (PostgreSQL) |
| `STRIPE_SECRET_KEY` | ✅ Set (Live) |
| `STRIPE_WEBHOOK_SECRET` | ✅ Set |
| `NEXT_PUBLIC_STRIPE_KEY` | ✅ Set |
| `STRIPE_STARTER_PRICE_ID` | ✅ Set |
| `STRIPE_PRO_PRICE_ID` | ✅ Set |
| `STRIPE_TOPUP_*_PRICE_ID` | ✅ Set (3 prices) |
| `ADMIN_EMAIL` | ❌ **Needs to be set** |

---

## AI Agent Capabilities

The system prompt (~10K characters) covers the complete Google Ads ecosystem:

- **Campaign Types:** Search, Display, Shopping, Video, PMax, App, Demand Gen, Local
- **Ad Formats:** RSA (15 headlines + 4 descriptions), RDA, Call-Only, Video
- **Extensions:** Sitelinks, Callouts, Structured Snippets, Call, Location, Price, Promotion, Image, Lead Form, App
- **Bidding:** tCPA, tROAS, Maximize Conversions, Maximize Clicks, Manual CPC, eCPC
- **Optimization:** Quality Score, budget reallocation, geo targeting, dayparting, audience segmentation, A/B testing, negative keywords, search term analysis
- **Compliance:** Profanity filter, ALL CAPS blocking, sensitive industry handling
- **Models:** GPT-4o primary (4096 max tokens, temp 0.75), Claude fallback

---

## Phase History

| Phase | Commit | Summary |
|-------|--------|---------|
| 1-3 | Various | Initial build, landing page, 22+ dashboard pages |
| 4-5 | Various | AI chat integration, knowledge base, demo pages |
| 6 | `74170ec` | KB enhancements, Deepgram transcription, policy compliance |
| 7 | `0c77285` | Multi-tenant SaaS auth, Google OAuth with Ads scope |
| 8 | Various | WebSocket server, Nginx config, Google Ads API application |
| 9 | `a556ddd` | Prisma + PostgreSQL schema, Stripe integration, billing UI |
| 10 | (infra) | PostgreSQL server setup, Stripe products/prices/webhook creation |
| 11 | `fdd2343` | Full site audit: 18 fixes (auth, billing, UI, content, security) |
| 12 | `a24f88b` | Dual JWT auth (cookies + localStorage token, 30-day expiry) |
| 13 | (current) | Admin dashboard with real DB data + Free audit tool |

---

## Phase 11 Fixes (Latest)

### P0 Critical
- ✅ Route protection middleware (redirects unauthenticated users)
- ✅ Stripe checkout passes real user session (was `temp_user`)
- ✅ Email auth uses httpOnly cookie via API route (was `document.cookie`)
- ✅ Sign-out properly clears session cookie via API

### P1 Important
- ✅ Dashboard: welcome page instead of hardcoded fake metrics
- ✅ Settings: "Connect Google Ads" instead of "Mike's Plumbing LLC"
- ✅ Sidebar: shows actual plan from subscription API
- ✅ Avatar: shows user initial/picture instead of hardcoded "S"
- ✅ FAQ: correct plan names (Agency→Pro, limits, trial duration)
- ✅ Admin pages: all "Agency" → "Pro"
- ✅ Knowledge base: "Sample Data" banner
- ✅ Subscription API: returns userName + userPicture

### P2 Nice to Have
- ✅ Created /privacy and /terms pages
- ✅ Removed false "SOC 2 Compliant" claim
- ✅ Footer: correct year, Next.js Link components

---

## Phase 12 — Dual JWT Auth

- ✅ JWT tokens via `jose` library (cookies + localStorage)
- ✅ `getSessionDual()` helper: checks cookie first, falls back to Bearer token
- ✅ All API routes use dual auth
- ✅ `authFetch()` utility for client-side requests with token header
- ✅ 30-day token expiry
- ✅ Commit: `a24f88b`

---

## Phase 13 — Admin Dashboard + Free Audit (Latest)

### Admin Dashboard — Real PostgreSQL Data
All admin pages previously used hardcoded demo data. Now they query the live database.

**New API Routes:**
- `src/app/api/admin/users/route.ts` — All users with subscription + usage data, per-user margin
- `src/app/api/admin/costs/route.ts` — AI costs per client, model breakdown, daily cost trends
- `src/app/api/admin/revenue/route.ts` — MRR/ARR, plan breakdown, top clients by LTV, recent transactions
- `src/app/api/admin/analytics/route.ts` — Query stats, model usage, feature usage, top user queries

**Updated API Routes:**
- `src/app/api/admin/stats/route.ts` — Switched from cookie-only to `getSessionDual()` for admin auth

**Admin Auth Pattern:** Email-based check (`ADMIN_EMAIL` env var or `admin@nobleblocks.com`)

**Rewritten Admin Pages:**
- `/admin/users` — Sortable user table, expandable rows (auth method, messages, all-time stats), CSV export, plan distribution bar, search/filter
- `/admin/ai-costs` — Summary cards, model breakdown grid, daily cost chart, unprofitable client warnings, expandable client rows
- `/admin/revenue` — MRR/ARR/ARPU cards, plan breakdown bars, top clients by LTV, recent transactions
- `/admin/analytics` — Today/week metrics, model usage bars, feature usage bars, top user queries

### Free Audit Tool — Lead Generation
New public-facing AI-powered website audit feature.

**New Pages:**
- `/audit` — Landing page with form (website URL, business name, industry, email, monthly spend), "What's In Your Report" section, trust badges
- `/audit/report/[id]` — Beautiful branded report: animated ScoreRing SVG, StatusBadge, SectionScoreBar, expandable sections with findings/recommendations, quick wins, competitive insight, print-ready CSS for PDF export

**New API Route:**
- `src/app/api/audit/route.ts` — Fetches website HTML, extracts text, sends to GPT-4o for 8-section analysis (Landing Page Quality, CTA Effectiveness, Mobile, Trust Signals, Ad-Readiness, SEO, Competitive Positioning, Content Quality), returns scored audit with recommendations

**Audit Storage:** Results stored in localStorage (no DB dependency for anonymous users). Shareable via URL within browser session.

**Homepage Updates:** Two audit CTA buttons changed from `/onboarding` to `/audit`

---

## TODO (Priority Order)

### Immediate (Before Wider Testing)
- [ ] Set `ADMIN_EMAIL` in server `.env` to owner's Google sign-in email
- [ ] Test full Stripe checkout flow end-to-end (subscribe → webhook → DB update)

### After Google Ads API Approval
- [ ] Wire up Google Ads API (read campaigns, push ads)
- [ ] Auto-discover user's Ads Customer IDs
- [ ] Campaign sync — pull existing campaigns into dashboard
- [ ] Real-time campaign data on dashboard overview

### Future Enhancements
- [x] Admin pages: query real DB data instead of demo data ✅ Phase 13
- [ ] Onboarding flow: persist business profile to DB
- [ ] Password authentication (currently email is passwordless)
- [ ] Stripe webhook for cancel/upgrade events
- [ ] Email notifications (currently UI-only toggles)
- [x] PDF report export ✅ Phase 13 (audit reports via window.print)
- [ ] Rate limiting on API routes
- [ ] Mobile responsive polish pass
- [ ] Persist audit results to DB (currently localStorage only)

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Route protection (auth guard) |
| `src/app/api/chat/route.ts` | AI chat with 10K system prompt |
| `src/app/api/auth/callback/route.ts` | Google OAuth + DB persistence |
| `src/app/api/auth/email/route.ts` | Email sign-in + httpOnly cookie |
| `src/app/api/auth/signout/route.ts` | Session cleanup |
| `src/app/api/stripe/route.ts` | Stripe checkout + webhook handler |
| `src/app/api/subscription/route.ts` | User plan + usage info |
| `src/app/api/admin/stats/route.ts` | Admin overview stats (real DB) |
| `src/app/api/admin/users/route.ts` | Admin users + usage data |
| `src/app/api/admin/costs/route.ts` | Admin AI cost tracking |
| `src/app/api/admin/revenue/route.ts` | Admin revenue analytics |
| `src/app/api/admin/analytics/route.ts` | Admin platform analytics |
| `src/app/api/audit/route.ts` | Free audit AI analysis engine |
| `src/app/audit/page.tsx` | Audit landing page |
| `src/app/audit/report/[id]/page.tsx` | Branded audit report viewer |
| `src/lib/db.ts` | Prisma client singleton |
| `src/lib/session.ts` | Session parsing helpers |
| `src/lib/plans.ts` | Plan definitions (Free/Starter/Pro) |
| `src/lib/stripe.ts` | Stripe helper functions |
| `prisma/schema.prisma` | Database schema (8 models) |
| `ws-server.ts` | WebSocket server (PM2 process) |
