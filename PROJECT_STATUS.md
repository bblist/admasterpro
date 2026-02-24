# AdMaster Pro — Project Status

**Last Updated:** February 24, 2026
**Live URL:** https://admasterai.nobleblocks.com
**Repository:** https://github.com/bblist/admasterpro
**Company:** NobleBlocks LLC
**Latest Commit:** `0c77285` (Multi-tenant SaaS auth)

---

## Architecture Overview

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI | React 18, Tailwind CSS v3 |
| Icons | lucide-react |
| AI Models | GPT-4o (primary), Claude (fallback) |
| Hosting | AWS Lightsail (2GB RAM, Static IP) |
| Process Manager | PM2 |
| Reverse Proxy | Nginx + Certbot (Let's Encrypt SSL) |
| Domain | admasterai.nobleblocks.com |

---

## What's Working RIGHT NOW (Live in Production)

| Feature | Status | Details |
|---------|--------|---------|
| Google OAuth Sign-In | ✅ Live | Users sign in with Google, gets Ads API scope |
| Email/Password Sign-In | ✅ Live | Demo mode (cookie-based, needs DB for production) |
| AI Chat (GPT-4o) | ✅ Live | Full Google Ads expert agent, 10K system prompt |
| AI Chat (Claude fallback) | ✅ Live | Auto-fallback when GPT-4o fails |
| Knowledge Base | ✅ Live | Upload files, edit content, brand profile, industry dropdown |
| Video Transcription | ✅ Live | Deepgram Nova-2 model, real API key configured |
| Campaign Planning | ✅ Live | AI creates full campaign structures on request |
| Keyword Research | ✅ Live | AI suggests keywords, match types, negatives |
| Ad Copy Generation | ✅ Live | RSA, RDA, all extension types |
| Policy Compliance | ✅ Live | Built into every AI response |
| Notification Bell | ✅ Live | In-app dropdown with read/unread/dismiss |
| Multi-Business Switching | ✅ Live | Context-isolated per business |
| WebSocket Server | ✅ Live | Real-time notifications, campaign updates, budget alerts |
| SSL/HTTPS | ✅ Live | Auto-renewing via Certbot (Nginx) |

## Waiting On

| Item | Status | ETA |
|------|--------|-----|
| Google Ads API Basic Access | ⏳ Applied | 2-5 business days |
| Developer Token | ✅ Received | Test tier until Basic approved |
| Direct Ads Account Read/Write | ⏳ Blocked by above | After approval |

---

## API Endpoints

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/chat` | POST | AI chat — GPT-4o primary, Claude fallback | ✅ Live |
| `/api/transcribe` | POST | Deepgram video/audio transcription | ✅ Live |
| `/api/auth/callback` | GET | Google OAuth flow (openid + email + profile + adwords scope) | ✅ Live |
| `/api/stripe` | POST | Stripe webhook for billing | ✅ Route exists (needs Stripe keys) |
| `/api/ws` | GET | WebSocket status/health check | ✅ Live |
| `wss://.../ws` | WS | WebSocket real-time updates | ✅ Live (PM2 + Nginx) |

---

## Environment Variables (ALL configured on server + local)

| Variable | Status |
|----------|--------|
| `OPENAI_API_KEY` | ✅ Set |
| `ANTHROPIC_API_KEY` | ✅ Set |
| `DEEPGRAM_API_KEY` | ✅ Set |
| `NEXTAUTH_SECRET` | ✅ Set |
| `NEXTAUTH_URL` | ✅ Set |
| `GOOGLE_CLIENT_ID` | ✅ Set |
| `GOOGLE_CLIENT_SECRET` | ✅ Set |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | ✅ Set |
| `STRIPE_SECRET_KEY` | ❌ Not set (needs Stripe account) |
| `STRIPE_WEBHOOK_SECRET` | ❌ Not set (needs Stripe account) |

> **Storage:** Server `.env` at `/home/ubuntu/admasterpro/.env` (chmod 600). Local at `/Users/bblist/admasterpro/.env.local`. Never committed to git.

---

## Pages & Routes

### Dashboard Pages
| Page | Route | Status |
|------|-------|--------|
| Dashboard Home | `/dashboard` | ✅ Live |
| AI Chat | `/dashboard/chat` | ✅ Live (real AI) |
| Campaigns | `/dashboard/campaigns` | ✅ Empty state (shows after Ads API connected) |
| Keywords | `/dashboard/keywords` | ✅ Empty state (shows after Ads API connected) |
| Ad Drafts | `/dashboard/drafts` | ✅ Empty state (shows after Ads API connected) |
| Shopping Ads | `/dashboard/shopping` | ✅ Empty state (shows after Ads API connected) |
| Knowledge Base | `/dashboard/knowledge-base` | ✅ Full functionality |
| AI Examples | `/dashboard/demo/examples` | ✅ Example prompts |
| FAQ | `/dashboard/faq` | ✅ Live |
| Settings | `/dashboard/settings` | ✅ Live |

### Demo Pages (sample data — not in main nav)
| Page | Route |
|------|-------|
| Demo Campaigns | `/dashboard/demo/campaigns` |
| Demo Keywords | `/dashboard/demo/keywords` |
| Demo Drafts | `/dashboard/demo/drafts` |
| Demo Shopping | `/dashboard/demo/shopping` |
| Demo Examples | `/dashboard/demo/examples` |

### Other Pages
| Page | Route |
|------|-------|
| Landing Page | `/` |
| Login | `/login` |
| Onboarding | `/onboarding` |
| Admin Dashboard | `/admin` |
| Admin AI Costs | `/admin/ai-costs` |
| Admin Analytics | `/admin/analytics` |
| Admin Revenue | `/admin/revenue` |
| Admin Users | `/admin/users` |

---

## AI Agent Capabilities

The system prompt (~10K characters) covers the complete Google Ads ecosystem:

- **Campaign Types:** Search, Display, Shopping, Video, PMax, App, Demand Gen, Local
- **Ad Formats:** RSA (15 headlines + 4 descriptions), RDA, Call-Only, Video
- **Extensions:** Sitelinks, Callouts, Structured Snippets, Call, Location, Price, Promotion, Image, Lead Form, App
- **Bidding:** tCPA, tROAS, Maximize Conversions, Maximize Clicks, Manual CPC, eCPC, Maximize Conv Value
- **Optimization:** Quality Score, budget reallocation, geo targeting, dayparting, audience segmentation, A/B testing, negative keywords, search term analysis
- **Compliance:** Profanity filter, ALL CAPS blocking, sensitive industry handling
- **Models:** GPT-4o primary (4096 max tokens, temp 0.75), Claude fallback

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/api/chat/route.ts` | AI chat API with 10K system prompt |
| `src/app/api/auth/callback/route.ts` | Google OAuth with Ads scope + refresh token storage |
| `src/app/api/transcribe/route.ts` | Deepgram transcription API |
| `src/app/login/page.tsx` | Login page with Google OAuth + email/password |
| `src/app/dashboard/layout.tsx` | Sidebar nav, business switcher, notification bell |
| `src/app/dashboard/chat/page.tsx` | AI chat interface |
| `src/app/dashboard/knowledge-base/page.tsx` | KB with upload, editing, transcription |
| `src/lib/business-context.tsx` | Multi-business state management |
| `src/lib/ws.ts` | WebSocket client hook (reconnection, heartbeat) |
| `src/components/Tooltip.tsx` | Shared tooltip component |
| `ws-server.ts` | WebSocket server (runs as separate PM2 process) |

---

## Infrastructure

| Item | Value |
|------|-------|
| Instance | AWS Lightsail `admasterpro-v2` |
| Spec | 2GB RAM, 2 vCPU, 60GB SSD |
| Static IP | `3.225.249.236` |
| OS | Ubuntu 24.04 LTS |
| Node.js | v20 LTS |
| SSH Key | `~/.ssh/lightsail-admasterpro.pem` |
| SSH Command | `ssh -i ~/.ssh/lightsail-admasterpro.pem ubuntu@3.225.249.236` |
| App Directory (server) | `/home/ubuntu/admasterpro` |
| App Directory (local) | `/Users/bblist/admasterpro` |
| GitHub | `https://github.com/bblist/admasterpro` |

### Deploy Command (one-liner from Mac)
```bash
ssh -i ~/.ssh/lightsail-admasterpro.pem ubuntu@3.225.249.236 'cd /home/ubuntu/admasterpro && git pull origin main && npm run build 2>&1 | tail -20 && pm2 restart all'
```

---

## Google Ads API Setup (Multi-Tenant SaaS)

### How It Works
1. **Platform** has ONE Developer Token (from MCC account)
2. **Each user** signs in with Google OAuth → grants `adwords` scope
3. Platform stores user's `refresh_token` (currently in httpOnly cookie, needs DB)
4. API calls use: Platform Developer Token + User's OAuth token
5. This lets us manage ANY user's Google Ads account

### OAuth Scopes Requested
- `openid`, `email`, `profile` — identity
- `https://www.googleapis.com/auth/adwords` — Google Ads API access

### Google Cloud Console Setup (completed)
- ✅ OAuth Client ID created
- ✅ Redirect URI configured
- ✅ Google Ads API enabled
- ✅ Adwords scope added to consent screen
- ✅ Identity scopes added

---

## What's Next (Priority Order)

### After API Approval (2-5 days)
1. Wire up Google Ads API integration (read campaigns, push ads)
2. Auto-discover user's Ads Customer IDs
3. Campaign sync — pull existing campaigns into dashboard
4. Push AI-generated campaigns directly to user's account

### Soon
5. Database layer (PostgreSQL/Supabase + Prisma) for user accounts, sessions, refresh tokens, chat history
6. Stripe billing integration
7. Protected route middleware (auth guard)

### Later
8. Automated rules engine (auto-pause, bid adjustments)
9. PDF report export
10. Multi-user agency support (roles: admin, editor, viewer)
11. Google Analytics 4 linking
12. White-label for agencies

---

## Recent Commits

```
0c77285 Multi-tenant SaaS auth: Google OAuth with Ads scope + email sign-in
dea793e Google Ads agent knowledge expansion + PROJECT_STATUS.md
9478be2 Move all demo features to live pages - fully working
74170ec KB enhancements, Deepgram transcription, Google Ads policy compliance, notification bell
db12b13 Go live: real AI integration, demo migration, humanized responses
```

---

## Important Notes for Future Developers

1. **NEVER write large files via SSH heredoc** — it corrupts content. Use Python scripts or `scp` instead.
2. **API keys** are ONLY in `.env` / `.env.local` — never in code or docs.
3. **The AI system prompt** is in `src/app/api/chat/route.ts` (~10K chars, full Google Ads ecosystem).
4. **Demo pages** at `/dashboard/demo/*` contain sample data. Live pages show empty states until Google Ads API is connected.
5. **Nginx** handles SSL (via Certbot/Let's Encrypt) + reverse proxy. Config at `/etc/nginx/sites-enabled/admasterpro`.
6. **Build takes ~2-3 min** on the 2GB Lightsail instance.
7. **WebSocket server** runs as separate PM2 process on port 3001, Nginx proxies `/ws` to it.
