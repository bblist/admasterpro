# AdMaster Pro — Project Status

**Last Updated:** February 24, 2026  
**Live URL:** https://admasterai.nobleblocks.com  
**Repository:** https://github.com/bblist/admasterpro  
**Latest Commit:** `9478be2` (+ pending Google Ads knowledge expansion)

---

## Architecture Overview

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI | React 18, Tailwind CSS v3 |
| Icons | lucide-react |
| Hosting | AWS Lightsail (2GB, Static IP) |
| Process Manager | PM2 |
| SSL | Let's Encrypt (Caddy reverse proxy) |

---

## API Endpoints & Integrations

### Internal API Routes

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/chat` | POST | AI chat — routes to GPT-4o (primary) or Claude (fallback) | ✅ Live |
| `/api/transcribe` | POST | Video/audio transcription via Deepgram | ✅ Live (demo mode without key) |
| `/api/auth/callback` | GET | Google OAuth callback handler | ⏳ Awaiting Google credentials |
| `/api/stripe` | POST | Stripe webhook for billing/subscriptions | ✅ Route exists |
| `/api/ws` | GET | WebSocket upgrade for real-time features | ✅ Route exists |

### External APIs Used

| Service | Endpoint | Purpose | Key Location |
|---------|----------|---------|--------------|
| **OpenAI (GPT-4o)** | `https://api.openai.com/v1/chat/completions` | Primary AI model for chat, ad creation, analysis | Server `.env` → `OPENAI_API_KEY` |
| **Anthropic (Claude)** | `https://api.anthropic.com/v1/messages` | Fallback AI model (uses `claude-sonnet-4-20250514`) | Server `.env` → `ANTHROPIC_API_KEY` |
| **Deepgram** | `https://api.deepgram.com/v1/listen` | Speech-to-text for video transcription (Nova-2 model) | Server `.env` → `DEEPGRAM_API_KEY` |
| **Google OAuth 2.0** | `https://accounts.google.com/o/oauth2/v2/auth` | User authentication via Google | Server `.env` → `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` |
| **Google Ads API** | `https://googleads.googleapis.com/` | Campaign management, keyword data, ad operations | 🔜 Not yet integrated — needs Google Ads API credentials |
| **Google Trends** | Informal / via SerpAPI or similar | Keyword trend data | 🔜 Planned |
| **Stripe** | `https://api.stripe.com/` | Subscription billing, payment processing | Server `.env` → `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` |

### API Key Storage

> ⚠️ **IMPORTANT:** All API keys are stored ONLY in environment variables on the server.
> - **Server:** `/home/ubuntu/admasterpro/.env` (chmod 600, owned by ubuntu)
> - **Local dev:** `/Users/bblist/admasterpro/.env.local`
> - **NEVER** committed to git — `.gitignore` excludes all `.env*` files
> - Keys are NOT stored in any documentation, code, or config files

### Environment Variables Required

| Variable | Service | Required |
|----------|---------|----------|
| `OPENAI_API_KEY` | OpenAI GPT-4o | ✅ Set |
| `ANTHROPIC_API_KEY` | Anthropic Claude | ✅ Set |
| `DEEPGRAM_API_KEY` | Deepgram transcription | ❌ Not yet set (runs in demo mode) |
| `GOOGLE_CLIENT_ID` | Google OAuth | ❌ Not yet set |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | ❌ Not yet set |
| `NEXTAUTH_SECRET` | Session encryption | ✅ Set |
| `NEXTAUTH_URL` | Auth redirect base URL | ✅ Set |
| `STRIPE_SECRET_KEY` | Stripe billing | ❌ Not yet set |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks | ❌ Not yet set |

---

## Pages & Features

### Dashboard Pages (all fully functional)

| Page | Route | Features |
|------|-------|----------|
| **Dashboard** | `/dashboard` | Overview stats, quick actions, business summary |
| **AI Assistant** | `/dashboard/chat` | Full AI chat with GPT-4o/Claude, voice input, per-business history, NLP intent matching, structured ad creation UI |
| **Campaigns** | `/dashboard/campaigns` | Campaign table with Search/Shopping/Display types, status, budget, spend, clicks, conversions, cost/conv, trends, AI tips |
| **Keywords** | `/dashboard/keywords` | Keyword management with Google Trends data, AI quality scores & verdicts, match types, bulk import/export, add/delete, search & filter |
| **Ad Drafts** | `/dashboard/drafts` | Draft editor: text ads (headline/description inline editing), display ads (image library, drag-to-reposition, overlay text, CTA), version history, regenerate, go live workflow |
| **Shopping Ads** | `/dashboard/shopping` | Product listings with Shopify connection, ROAS tracking, product status (active/disapproved/pending), performance stats |
| **Knowledge Base** | `/dashboard/knowledge-base` | 4 tabs: Files & Media (drag-drop upload, AI analysis, Deepgram video transcription), Text Content (inline editing), Website URLs, Brand Profile (searchable industry dropdown with 100+ industries, editable fields) |
| **AI Examples** | `/dashboard/demo/examples` | Example prompts organized by category (text ads, display ads, analysis, competitors, optimization) |
| **FAQ** | `/dashboard/faq` | Searchable FAQ with categories |
| **Settings** | `/dashboard/settings` | Account settings, preferences |

### Admin Pages

| Page | Route | Purpose |
|------|-------|---------|
| Admin Dashboard | `/admin` | Platform overview |
| AI Costs | `/admin/ai-costs` | Token usage & cost tracking |
| Analytics | `/admin/analytics` | Platform usage analytics |
| Revenue | `/admin/revenue` | Subscription revenue tracking |
| Users | `/admin/users` | User management |

### Other Pages

| Page | Route | Purpose |
|------|-------|---------|
| Landing Page | `/` | Marketing homepage |
| Login | `/login` | Authentication page |
| Onboarding | `/onboarding` | New user setup flow |

---

## AI Agent Capabilities

The AI assistant has comprehensive Google Ads knowledge and can perform:

### Campaign Management
- Create full campaign structures (campaign → ad groups → ads → keywords)
- All campaign types: Search, Display, Shopping, Video, Performance Max, App, Demand Gen, Local
- Budget recommendations with daily/monthly projections
- Bidding strategy selection (tCPA, tROAS, Maximize Conversions, Manual CPC, etc.)
- Ad scheduling (dayparting) and device/location bid adjustments

### Ad Group Operations
- Create themed ad groups with tight keyword groupings
- Recommend 10-20 keywords per ad group with match types
- Generate 3+ Responsive Search Ads per ad group (15 headlines + 4 descriptions)

### Ad Creation
- Responsive Search Ads (RSA) with full headline/description sets
- Responsive Display Ads (RDA) with image/text specifications
- Call-Only Ads for service businesses
- All ad extensions: Sitelinks, Callouts, Structured Snippets, Call, Location, Price, Promotion, Image, Lead Form

### Keyword Management
- Keyword research with search volume estimates
- Match type recommendations (Broad, Phrase, Exact)
- Negative keyword suggestions (campaign + ad group level)
- Search term analysis and pruning
- Long-tail keyword discovery

### Optimization & Analysis
- Campaign audits with specific dollar amounts
- Quality Score improvement recommendations
- Budget reallocation suggestions
- Competitive analysis (Auction Insights)
- Geographic optimization
- Seasonal strategy planning
- Remarketing audience setup
- Conversion tracking guidance

### Policy Compliance (enforced automatically)
- Blocks profanity, ALL CAPS, misleading claims
- Handles sensitive industries: Cannabis/CBD, Dating, Weight Loss, Alcohol, Gambling, Financial Services
- Suggests compliant alternatives when requests violate policy

---

## Shared Components

| Component | Path | Purpose |
|-----------|------|---------|
| Tooltip | `src/components/Tooltip.tsx` | Information tooltips throughout the app |
| Business Context | `src/lib/business-context.tsx` | Multi-business switching, active business state |
| WebSocket | `src/lib/ws.ts` | Real-time communication infrastructure |

---

## Deployment

| Item | Value |
|------|-------|
| Server | AWS Lightsail `admasterpro-v2` (2GB RAM) |
| Static IP | `3.225.249.236` |
| Domain | `admasterai.nobleblocks.com` |
| SSL | Let's Encrypt via Caddy |
| Process | PM2 (`admasterpro`) |
| SSH Key | `~/.ssh/lightsail-admasterpro.pem` |
| Deploy Flow | `git push` → SSH → `git pull && npm run build && pm2 restart admasterpro` |

---

## What's Next (Roadmap)

### Immediate Priorities
1. **Google OAuth setup** — User creating credentials. Redirect URI: `https://admasterai.nobleblocks.com/api/auth/callback`
2. **Deepgram API key** — Add to server `.env` to enable real video transcription
3. **Google Ads API integration** — Connect to live Google Ads data for real campaign/keyword management

### Future Enhancements
- Stripe subscription billing (plans: Free, Pro, Enterprise)
- Google Analytics 4 linking
- Google Merchant Center / Shopify auto-sync
- Automated rules engine (pause/adjust based on thresholds)
- White-label support for agencies
- Multi-user access with roles (admin, editor, viewer)
- Scheduled reporting (daily/weekly email reports)

---

## Recent Commits

```
9478be2 Move all demo features to live pages - fully working
74170ec KB enhancements, Deepgram transcription, Google Ads policy compliance, notification bell
db12b13 Go live: real AI integration, demo migration, humanized responses
8c09bdc Cross-account awareness, smart confirmations, portfolio queries
c02b9ea Keyword management with AI control, Google Trends, bulk import, branded report export
3ef5d41 Per-business chat history isolation, in-chat account switching, KB business context
35eae27 Restructure: Demo Examples section, empty states, hide LLM badges, drag-to-reposition
9a34979 Business context isolation — sidebar switcher + agent off-topic guard
98a6828 AnalyserNode silence detection + platform-aware mic permission UX
3f36ae2 Mobile optimization + mic permission flow + cross-browser voice
```
