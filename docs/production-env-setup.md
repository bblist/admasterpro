# Production Environment Setup

This document lists all environment variables required for full production functionality.

## Currently Configured (Production)

These are already set in `/home/ubuntu/admasterpro/.env`:

| Variable | Status | Description |
|----------|--------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | JWT signing secret |
| `NEXTAUTH_URL` | ✅ | https://admasterai.nobleblocks.com |
| `ADMIN_EMAIL` | ✅ | Admin user email |
| `OPENAI_API_KEY` | ✅ | OpenAI API for AI chat |
| `ANTHROPIC_API_KEY` | ✅ | Claude fallback for AI chat |
| `DEEPGRAM_API_KEY` | ✅ | Video transcription |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | ✅ | Google Ads API |
| `STRIPE_SECRET_KEY` | ✅ | Stripe payments |
| `NEXT_PUBLIC_STRIPE_KEY` | ✅ | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe webhook verification |
| `STRIPE_STARTER_PRICE_ID` | ✅ | $49/mo plan |
| `STRIPE_PRO_PRICE_ID` | ✅ | $149/mo plan |
| `STRIPE_TOPUP_30_PRICE_ID` | ✅ | $30 top-up |
| `STRIPE_TOPUP_50_PRICE_ID` | ✅ | $50 top-up |
| `STRIPE_TOPUP_100_PRICE_ID` | ✅ | $100 top-up |

## Optional (Not Yet Configured)

These enhance functionality but are not required for the app to work:

### Resend (Email Service)

```bash
RESEND_API_KEY=re_xxx
```

**Setup:**
1. Sign up at https://resend.com
2. Add domain `admasterai.nobleblocks.com` and verify DNS
3. Create API key
4. Add to production `.env`

**Features enabled:**
- Welcome emails
- Subscription confirmations
- Payment receipts
- Weekly performance reports

### Sentry (Error Tracking)

```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=admasterpro
```

**Setup:**
1. Sign up at https://sentry.io
2. Create a Next.js project
3. Copy DSN from Project Settings → Client Keys
4. Add to production `.env`

**Features enabled:**
- Automatic error capture
- Performance monitoring
- Release tracking
- Source maps (if SENTRY_AUTH_TOKEN is added)

### S3 Backup (Database Backups)

```bash
S3_BACKUP_BUCKET=admasterpro-backups
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_DEFAULT_REGION=us-east-1
```

**Setup:**
1. Create S3 bucket with lifecycle rules
2. Create IAM user with S3 write access
3. Add to production `.env`

**Features enabled:**
- Offsite database backups
- Automatic retention/cleanup

## Adding Environment Variables to Production

SSH into the server and edit the `.env` file:

```bash
ssh -i ~/.ssh/lightsail-admasterpro.pem ubuntu@3.225.249.236
nano /home/ubuntu/admasterpro/.env
```

After adding variables, restart the application:

```bash
pm2 restart admasterpro
```

## Verify Configuration

Check what's currently set:

```bash
ssh -i ~/.ssh/lightsail-admasterpro.pem ubuntu@3.225.249.236 \
  'cat /home/ubuntu/admasterpro/.env | grep -E "^[A-Z]" | sed "s/=.*/=***/" | sort'
```

---

*Last Updated: February 2025*
