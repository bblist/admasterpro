# AdMaster Pro

> Your AI-powered Google Ads assistant. Get more customers, waste less money.

Built for busy small business owners who hate wasting money on ads and just want more calls, leads, bookings, or sales.

## What It Does

- **Free Ad Audit** — instantly shows where your Google Ads are wasting money
- **AI Assistant** — explains everything in plain English (no marketing jargon)
- **Money Leak Detection** — finds keywords burning your budget with zero results
- **Auto-Pilot Mode** — automatically pauses losers, blocks junk searches, saves money
- **Draft-First Safety** — new ads are always drafts until you approve them
- **Dead-Simple Stats** — money spent, customers gained, cost per customer

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Icons:** Lucide React
- **AI Backend:** (coming soon) OpenAI / Anthropic API
- **Google Ads:** (coming soon) Google Ads API integration
- **Database:** (coming soon) PostgreSQL / Supabase

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/page.tsx        # Login page
│   ├── onboarding/page.tsx   # 4-step onboarding flow
│   └── dashboard/
│       ├── layout.tsx        # Dashboard sidebar layout
│       ├── page.tsx          # Main dashboard (stats, leaks, winners)
│       ├── chat/page.tsx     # AI chat interface
│       ├── campaigns/page.tsx # Campaign management
│       ├── keywords/page.tsx  # Keyword performance
│       ├── drafts/page.tsx   # Ad draft review
│       └── settings/page.tsx # Auto-pilot, notifications, safety
├── SYSTEM_PROMPT.md          # Complete AI system prompt
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Marketing page with features, pricing, testimonials |
| Login | `/login` | Google OAuth + email sign-in |
| Onboarding | `/onboarding` | 4-step setup: connect → business info → upload → audit |
| Dashboard | `/dashboard` | Stats, money leaks, winners, auto-pilot actions |
| AI Chat | `/dashboard/chat` | Conversational AI assistant |
| Campaigns | `/dashboard/campaigns` | Campaign overview with metrics |
| Keywords | `/dashboard/keywords` | Keyword performance with winner/loser labels |
| Ad Drafts | `/dashboard/drafts` | Review and approve AI-generated ads |
| Settings | `/dashboard/settings` | Auto-pilot, notifications, budget limits, safety |

## License

Proprietary — All rights reserved.
