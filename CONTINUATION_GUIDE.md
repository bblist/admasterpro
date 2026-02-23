# AdMaster Pro — Continuation Guide (Post-Restart)

> **Last Updated:** February 24, 2026  
> **Purpose:** Everything needed to continue development after a machine restart

---

## 1. Quick Resume Checklist

After restarting your Mac, run these commands to get back up and running:

```bash
# 1. Navigate to the project
cd ~/admasterpro

# 2. Start the local dev server
npm run dev

# 3. SSH into the production server
ssh -i ~/.ssh/lightsail-admasterpro.pem ubuntu@3.225.249.236

# 4. Check the production app is running
ssh -i ~/.ssh/lightsail-admasterpro.pem ubuntu@3.225.249.236 'pm2 list && curl -sI http://localhost:3000 | head -3'
```

---

## 2. SSH Key Location

The SSH key for the Lightsail server is saved in **two places**:

| Location | Notes |
|----------|-------|
| `~/.ssh/lightsail-admasterpro.pem` | **Primary** — survives restart |
| `/tmp/lightsail-key.pem` | **Temp** — will be deleted on restart |
| `~/admasterpro/deploy/lightsail-key.pem` | **Backup** — in project folder (gitignored) |

If for some reason you lose the key, download it again from the AWS Lightsail console:
1. Go to https://lightsail.aws.amazon.com/ls/webapp/account/keys
2. Download the default key pair for `us-east-1`
3. Save it and `chmod 600` it

---

## 3. Production Server Details

| Item | Value |
|------|-------|
| **Cloud** | AWS Lightsail |
| **Instance Name** | `admasterpro` |
| **Region** | `us-east-1` (N. Virginia) |
| **AZ** | `us-east-1a` |
| **Bundle** | `nano_3_0` — 512MB RAM, 2 vCPU, 20GB SSD, $5/mo |
| **OS** | Ubuntu 24.04 LTS |
| **Static IP** | `3.225.249.236` |
| **Domain** | `admasterai.nobleblocks.com` |
| **SSH User** | `ubuntu` |
| **SSH Command** | `ssh -i ~/.ssh/lightsail-admasterpro.pem ubuntu@3.225.249.236` |
| **App Directory** | `/home/ubuntu/admasterpro` |
| **Node.js** | v20 LTS (installed via nodesource) |
| **Process Manager** | PM2 (auto-restart on reboot configured) |
| **Web Server** | Nginx reverse proxy (port 80/443 → localhost:3000) |
| **SSL** | Let's Encrypt via Certbot (expires May 24, 2026, auto-renews) |
| **Swap** | 1GB `/swapfile` (persistent via fstab) |
| **Firewall Ports** | 22 (SSH), 80 (HTTP), 443 (HTTPS) |

---

## 4. AWS Account

| Item | Value |
|------|-------|
| **Account ID** | `891377173693` |
| **IAM User** | `admin-delroy` |
| **Default Region** | `us-east-1` |
| **Route 53 Hosted Zone** | `nobleblocks.com` — Zone ID: `Z09431023T50KZYMBGV70` |

---

## 5. DNS Configuration

### AdMaster Pro (our subdomain)
```
admasterai.nobleblocks.com  →  A  →  3.225.249.236  (Lightsail static IP)
```
- **SSL:** Let's Encrypt cert active, HTTP→HTTPS redirect configured in Nginx
- **Nginx config:** `/etc/nginx/sites-enabled/admasterpro`

### Other NobleBlocks Subdomains (separate infrastructure — NOT on Lightsail)
| Subdomain | Points To | Type |
|-----------|-----------|------|
| `nobleblocks.com` | CloudFront (`dcx6uzjbd4dm.cloudfront.net`) | A (alias) |
| `www.nobleblocks.com` | CloudFront (`dcx6uzjbd4dm.cloudfront.net`) | A (alias) |
| `api.nobleblocks.com` | ELB (`nobleblocks-590777762.ap-southeast-1.elb`) | CNAME |
| `api-cdn.nobleblocks.com` | CloudFront (`d17jzykyyyrszz.cloudfront.net`) | CNAME |
| `dev.nobleblocks.com` | ELB (same as api) | CNAME |
| `dev2.nobleblocks.com` | ELB (same as api) | CNAME |
| `dev-backend.nobleblocks.com` | ELB (same as api) | CNAME |
| `docs.nobleblocks.com` | GitBook (`726555de1f-hosting.gitbook.io`) | CNAME |
| `clips.nobleblocks.com` | ELB (clips ALB) | A (alias) |
| `dev-s3.nobleblocks.com` | CloudFront (`d2beht90bk5xi3.cloudfront.net`) | CNAME |
| `origin.api.nobleblocks.com` | ELB (same as api) | A (alias) |
| `dev.api.nobleblocks.com` | CloudFront (`du9szxxhrvxkg.cloudfront.net`) | A (alias) |

> **HTTPS issue on other subdomains:** These subdomains are NOT hosted on our Lightsail instance — they run on CloudFront, ELB, GitBook, and ICP. To fix HTTPS on those, you need to check the SSL certificates on each respective service (ACM certs on CloudFront/ELB, etc). This is separate from AdMaster Pro.

---

## 6. How to Deploy Updates

From your local machine:

```bash
# 1. Make changes locally, then:
cd ~/admasterpro
git add -A && git commit -m "your message" && git push

# 2. SSH into the server and deploy:
ssh -i ~/.ssh/lightsail-admasterpro.pem ubuntu@3.225.249.236

# On the server:
cd /home/ubuntu/admasterpro
git pull
./node_modules/.bin/next build
pm2 restart admasterpro
```

Or as a one-liner from your Mac:
```bash
ssh -i ~/.ssh/lightsail-admasterpro.pem ubuntu@3.225.249.236 'cd /home/ubuntu/admasterpro && git pull && ./node_modules/.bin/next build 2>&1 | tail -20 && pm2 restart admasterpro'
```

> **Note:** Build takes ~5-8 minutes on the 512MB instance. The server may be unresponsive during builds. Don't panic — it's using swap. SSH might time out; just wait and reconnect.

---

## 7. GitHub Repository

| Item | Value |
|------|-------|
| **URL** | https://github.com/bblist/admasterpro |
| **Branch** | `main` |
| **Latest Commit** | `39f4ec4` — "Update all pages with latest changes" |

---

## 8. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 14 |
| UI Library | React | 18 |
| Styling | Tailwind CSS | 3 |
| Language | TypeScript | 5 |
| Icons | lucide-react | 0.575 |
| Linting | ESLint | 8 |
| Font | Inter (Google Fonts) | — |

---

## 9. Project Structure

```
admasterpro/
├── src/app/
│   ├── layout.tsx              # Root layout (Inter font, global styles)
│   ├── globals.css             # Tailwind directives + CSS variables + animations
│   ├── page.tsx                # Landing page (hero, features, pricing, testimonials)
│   ├── login/page.tsx          # Login page (Google OAuth + email — UI only)
│   ├── onboarding/page.tsx     # 4-step onboarding flow (UI only)
│   ├── dashboard/
│   │   ├── layout.tsx          # User sidebar layout (blue theme)
│   │   ├── page.tsx            # Main dashboard (stats, money leaks, winners)
│   │   ├── chat/page.tsx       # AI chat interface (UI only)
│   │   ├── campaigns/page.tsx  # Campaign management table
│   │   ├── keywords/page.tsx   # Keywords with filters/search
│   │   ├── drafts/page.tsx     # Ad draft review interface
│   │   └── settings/page.tsx   # Auto-pilot, notifications, safety settings
│   └── admin/
│       ├── layout.tsx          # Admin sidebar layout (dark/red theme)
│       ├── page.tsx            # Admin overview (stats, alerts, revenue chart)
│       ├── users/page.tsx      # User management (search, filter, expand)
│       ├── revenue/page.tsx    # Revenue/MRR analytics
│       └── analytics/page.tsx  # Usage analytics, AI metrics, retention
├── deploy/
│   ├── setup-server.sh         # Server provisioning script
│   └── lightsail-key.pem       # SSH key (gitignored)
├── SYSTEM_PROMPT.md            # Complete AI system prompt (12 sections)
├── WHATS_LEFT.md               # Full development roadmap
├── package.json
├── tailwind.config.ts
├── next.config.mjs
└── .gitignore
```

---

## 10. All Pages & URLs

| Page | Local URL | Production URL | Status |
|------|-----------|----------------|--------|
| Landing | http://localhost:3000 | https://admasterai.nobleblocks.com | ✅ Static |
| Login | http://localhost:3000/login | https://admasterai.nobleblocks.com/login | ✅ UI only |
| Onboarding | http://localhost:3000/onboarding | https://admasterai.nobleblocks.com/onboarding | ✅ UI only |
| Dashboard | http://localhost:3000/dashboard | https://admasterai.nobleblocks.com/dashboard | ✅ Demo data |
| AI Chat | http://localhost:3000/dashboard/chat | https://admasterai.nobleblocks.com/dashboard/chat | ✅ UI only |
| Campaigns | http://localhost:3000/dashboard/campaigns | https://admasterai.nobleblocks.com/dashboard/campaigns | ✅ Demo data |
| Keywords | http://localhost:3000/dashboard/keywords | https://admasterai.nobleblocks.com/dashboard/keywords | ✅ Demo data |
| Drafts | http://localhost:3000/dashboard/drafts | https://admasterai.nobleblocks.com/dashboard/drafts | ✅ Demo data |
| Settings | http://localhost:3000/dashboard/settings | https://admasterai.nobleblocks.com/dashboard/settings | ✅ UI only |
| Admin | http://localhost:3000/admin | https://admasterai.nobleblocks.com/admin | ✅ Demo data |
| Admin Users | http://localhost:3000/admin/users | https://admasterai.nobleblocks.com/admin/users | ✅ Demo data |
| Admin Revenue | http://localhost:3000/admin/revenue | https://admasterai.nobleblocks.com/admin/revenue | ✅ Demo data |
| Admin Analytics | http://localhost:3000/admin/analytics | https://admasterai.nobleblocks.com/admin/analytics | ✅ Demo data |

---

## 11. Server Management Commands

```bash
# SSH into server
ssh -i ~/.ssh/lightsail-admasterpro.pem ubuntu@3.225.249.236

# PM2 commands (on server)
pm2 list                    # See running processes
pm2 restart admasterpro     # Restart the app
pm2 logs admasterpro        # View app logs
pm2 logs admasterpro --lines 50  # Last 50 log lines

# Nginx commands (on server)
sudo nginx -t               # Test config
sudo systemctl restart nginx # Restart nginx
sudo cat /etc/nginx/sites-enabled/admasterpro  # View config

# SSL cert commands (on server)
sudo certbot certificates   # View cert status
sudo certbot renew --dry-run # Test renewal

# System monitoring (on server)
free -h                     # Check memory
df -h /                     # Check disk
htop                        # Interactive process monitor
```

---

## 12. What's Left to Build (Summary)

See `WHATS_LEFT.md` for the full detailed roadmap. Quick summary:

### Phase 1 — Critical for MVP (Weeks 1-6)
1. **Authentication** — NextAuth.js, Google OAuth, email/password, protected routes
2. **Database** — PostgreSQL (Supabase), Prisma ORM, schema design
3. **Google Ads API** — OAuth flow, campaign sync, real data on dashboard
4. **AI Engine** — OpenAI/Claude API, chat backend, money leak detection, ad copy generation

### Phase 2 — Needed for Launch (Weeks 7-9)
5. **Stripe Billing** — Free/Pro/Agency subscriptions, webhooks, customer portal
6. **Auto-Pilot** — Scheduled jobs, auto-pause keywords, bid adjustments
7. **Notifications** — Email alerts (SendGrid), in-app notification center
8. **Admin Real Data** — Connect admin dashboard to real DB/Stripe

### Phase 3 — Post-Launch
9. Reporting & PDF exports
10. Multi-account (agency) support
11. Landing page enhancements (blog, case studies)
12. Mobile PWA
13. Advanced AI (competitor analysis, seasonal predictions)

### Upgrade Path
- **Now:** Nano $5/mo (sufficient for demo)
- **Phase 1:** Upgrade to Small $12/mo (2GB RAM — needed for DB + auth)
- **Production:** Medium $24/mo (4GB RAM — handles concurrent AI calls)

---

## 13. HTTPS Issue — Other Subdomains

The "not secure" warnings on other `nobleblocks.com` subdomains are **NOT** related to AdMaster Pro. Each subdomain runs on different infrastructure:

| Subdomain | Hosted On | Fix HTTPS Here |
|-----------|-----------|----------------|
| `nobleblocks.com` / `www` | CloudFront | AWS Certificate Manager (ACM) → CloudFront distribution |
| `api.nobleblocks.com` | ELB (ap-southeast-1) | ACM cert → attach to ALB/ELB listener |
| `dev.nobleblocks.com` | ELB (ap-southeast-1) | ACM cert → attach to ALB/ELB listener |
| `docs.nobleblocks.com` | GitBook | GitBook custom domain settings |
| `clips.nobleblocks.com` | ELB (clips ALB) | ACM cert → attach to clips ALB |
| `admasterai.nobleblocks.com` | **Lightsail (ours)** | **✅ ALREADY HTTPS** |

To fix HTTPS on the ELB-based subdomains:
1. Go to AWS Certificate Manager (ACM) in `ap-southeast-1`
2. Check if you have a cert for `*.nobleblocks.com` or the specific subdomains
3. Attach the cert to the ELB HTTPS listener (port 443)
4. Ensure the ELB security group allows port 443

---

## 14. Troubleshooting

### Server unresponsive / SSH timeout
The 512MB instance gets overwhelmed during builds. Wait 5-10 minutes and retry. If it persists:
```bash
# Check instance state
aws lightsail get-instance --instance-name admasterpro --region us-east-1 --query 'instance.state.name'

# Reboot if needed
aws lightsail reboot-instance --instance-name admasterpro --region us-east-1
```

### App not serving after reboot
PM2 is configured to auto-start, but if it doesn't:
```bash
ssh -i ~/.ssh/lightsail-admasterpro.pem ubuntu@3.225.249.236
cd /home/ubuntu/admasterpro
pm2 start npm --name admasterpro -- start
pm2 save
```

### Need to rebuild
```bash
cd /home/ubuntu/admasterpro
./node_modules/.bin/next build
pm2 restart admasterpro
```

### Lost SSH key
Download from AWS Lightsail console: https://lightsail.aws.amazon.com/ls/webapp/account/keys
