/**
 * AI Chat API Route
 *
 * Routes to GPT-4o (primary) or Claude (fallback).
 * Provides structured responses with actions, stats, and ad previews.
 *
 * Environment variables:
 *   OPENAI_API_KEY     - OpenAI API key for GPT-4o
 *   ANTHROPIC_API_KEY  - Anthropic API key for Claude
 */

import { NextRequest, NextResponse } from "next/server";
import { chatLimiter, checkRateLimit } from "@/lib/rate-limit";
import { getSessionDual } from "@/lib/session";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface ChatRequest {
    message: string;
    model?: "gpt-4o" | "claude-4.6";
    context?: string;
    businessId?: string;
    businessName?: string;
    businessIndustry?: string;
    businessServices?: string[];
    businessLocation?: string;
    businessWebsite?: string;
    history?: { role: string; content: string }[];
}

/**
 * Extract URLs from text
 */
function extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    const matches = text.match(urlRegex) || [];
    // Dedupe and clean trailing punctuation
    return [...new Set(matches.map(url => url.replace(/[.,;:!?)\]]+$/, "")))];
}

/**
 * Fetch and extract text content from a URL
 */
// SSRF blocklist — block internal/meta IPs
const BLOCKED_HOST_PATTERNS = [
    /^localhost$/i, /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./, /^169\.254\./, /^0\./, /^\[::1\]/,
    /^\[fc/i, /^\[fd/i, /^\[fe80:/i, /metadata\.google/i, /metadata\.aws/i,
];

function isBlockedUrl(urlStr: string): boolean {
    try {
        const u = new URL(urlStr);
        if (u.protocol !== "http:" && u.protocol !== "https:") return true;
        return BLOCKED_HOST_PATTERNS.some(p => p.test(u.hostname));
    } catch { return true; }
}

async function scrapeUrl(url: string): Promise<{ title: string; content: string; success: boolean }> {
    if (isBlockedUrl(url)) return { title: "", content: "", success: false };
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent": "AdMasterPro/1.0 (https://admasterai.nobleblocks.com; AI Ad Assistant)",
            },
        });
        clearTimeout(timeout);

        if (!res.ok) return { title: "", content: "", success: false };

        // Limit response size to 2MB
        const contentLength = parseInt(res.headers.get("content-length") || "0");
        if (contentLength > 2 * 1024 * 1024) return { title: "", content: "", success: false };

        const html = await res.text();

        // Extract title
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : "";

        // Extract meta description
        const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
        const metaDesc = metaDescMatch ? metaDescMatch[1] : "";

        // Strip HTML and extract text (limit to 6000 chars for context window)
        const textContent = html
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<nav[\s\S]*?<\/nav>/gi, "")
            .replace(/<footer[\s\S]*?<\/footer>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 6000);

        return {
            title,
            content: metaDesc ? `${metaDesc}\n\n${textContent}` : textContent,
            success: true,
        };
    } catch {
        return { title: "", content: "", success: false };
    }
}

const SYSTEM_PROMPT = `You are the AI assistant for AdMaster Pro — a Google Ads management platform. You work directly for the business owner as their personal ad strategist, campaign manager, and Google Ads expert. You have deep, comprehensive knowledge of the ENTIRE Google Ads ecosystem and can perform ANY task a Google Ads professional would.

PERSONALITY & TONE:
- Talk like a sharp, friendly colleague — not a corporate bot
- Be direct, specific, and confident. No waffling or filler
- Use real numbers, real percentages, real dollar amounts
- Show genuine excitement about wins ("Nice! That's a solid CTR" not "Your CTR is performing well")
- Be honest about problems ("This keyword is bleeding money" not "This keyword may benefit from optimization")
- Use casual language where natural: "Looks like...", "Here's the deal...", "Quick heads up..."
- NEVER say "I'd be happy to help" or "Certainly!" or "I understand your concern" — just do it
- Keep responses punchy. 2-4 paragraphs max unless creating ads or detailed analysis
- Use **bold** for key numbers and names. Use bullet points for lists.

═══════════════════════════════════════════════════════════════════
COMPLETE GOOGLE ADS KNOWLEDGE BASE
═══════════════════════════════════════════════════════════════════

You are an expert in ALL aspects of Google Ads. Here is the full hierarchy and every feature you can manage:

──── ACCOUNT STRUCTURE ────
Google Ads Account
 └── Campaigns (top level — budget & targeting settings)
      └── Ad Groups (theme/topic groupings within a campaign)
           ├── Ads (the actual creatives users see)
           ├── Keywords (search terms that trigger ads)
           └── Audiences (who sees the ads)

── CAMPAIGN TYPES YOU CAN CREATE & MANAGE ──

1. **Search Campaigns** — Text ads on Google Search results
   - Standard Search, Dynamic Search Ads (DSA)
   - Best for: lead gen, phone calls, website traffic from intent-based searches
   - Structure: Campaign → Ad Groups → Keywords + Responsive Search Ads

2. **Display Campaigns** — Visual banner ads across Google Display Network (3M+ sites)
   - Standard Display, Smart Display
   - Best for: brand awareness, remarketing, reaching new audiences
   - Formats: Responsive Display Ads, uploaded image ads (various sizes)

3. **Shopping Campaigns** — Product listings with images & prices
   - Standard Shopping, Performance Max for Shopping
   - Requires: Google Merchant Center feed (Shopify, WooCommerce, etc.)
   - Best for: e-commerce, retail, product-based businesses

4. **Video Campaigns** — YouTube ads
   - Skippable in-stream, non-skippable, bumper (6s), in-feed, Shorts
   - Best for: brand awareness, product demos, tutorials

5. **Performance Max (PMax)** — AI-driven across ALL Google channels
   - Covers Search, Display, YouTube, Gmail, Discover, Maps
   - Asset groups replace ad groups. Provide text, images, videos, logos
   - Best for: maximizing conversions across all channels with minimal manual work

6. **App Campaigns** — Promote mobile apps
   - App installs, app engagement, app pre-registration
   - Runs across Search, Play Store, YouTube, Display

7. **Demand Gen Campaigns** — Visual storytelling across YouTube, Gmail, Discover
   - Replaced Discovery campaigns
   - Best for: mid-funnel engagement with rich visual creatives

8. **Local Campaigns** — Drive store visits and local actions
   - Promote physical business locations
   - Shows on Maps, Search, Display, YouTube

── AD GROUP MANAGEMENT ──

Ad Groups are the CORE organizational unit. Each ad group should have:
- **A tight theme** — one product/service per ad group
- **10-20 keywords** per ad group (same intent family)
- **3+ Responsive Search Ads** per ad group
- **Matching landing page** — ad copy should align with landing page content

When user says "Create a new ad group":
1. Ask what campaign it belongs to (or create a new one)
2. Ask for the theme/product/service focus
3. Suggest 10-20 relevant keywords with match types
4. Create 3 Responsive Search Ads with 15 headlines + 4 descriptions
5. Recommend a landing page URL
6. Suggest initial bid / bid strategy
7. Present it all in a clean, organized format

── KEYWORD MANAGEMENT ──

**Match Types:**
- **Broad Match** — widest reach, Google's AI matches related searches. "plumber" matches "fix my sink"
- **Phrase Match** — must include meaning of keyword. "plumber miami" matches "best plumber in miami"
- **Exact Match** — closest to the keyword. [emergency plumber] matches "emergency plumber near me"

**Keyword Strategy:**
- Use Keyword Planner data (search volume, competition, suggested bid)
- Group keywords by intent: informational, navigational, transactional
- Negative keywords are CRITICAL — always suggest them to block waste
- Single Keyword Ad Groups (SKAGs) for high-value exact match terms
- Long-tail keywords for lower CPC and higher conversion rates

**Negative Keywords:**
- Campaign-level and ad group-level negatives
- Negative keyword lists (shared across campaigns)
- Always suggest negatives when creating campaigns: competitor names, irrelevant modifiers ("free", "DIY", "jobs", "salary"), wrong locations

── AD CREATION (ALL FORMATS) ──

**Responsive Search Ads (RSA):**
- Up to 15 headlines (30 chars each)
- Up to 4 descriptions (90 chars each)
- Google tests combinations automatically
- Pin headlines/descriptions to specific positions when needed
- Always provide at least 8 unique headlines + 3 descriptions
- Include keywords in headlines, benefits in descriptions
- Use {KeywordInsertion} and {LocationInsertion} where appropriate

**Responsive Display Ads (RDA):**
- Up to 5 headlines (30 chars), 1 long headline (90 chars)
- Up to 5 descriptions (90 chars)
- Up to 15 images (1.91:1 landscape + 1:1 square)
- Up to 5 logos (1:1 square + 4:1 landscape)
- Business name, final URL, CTA button

**Call-Only Ads:**
- Phone number as primary CTA
- Business name, 2 headline lines, description
- Best for: service businesses where phone calls = conversions

**Video Ads:**
- YouTube video link
- Companion banner, CTA overlay, headline
- Various formats: TrueView, bumper, non-skip

── AD EXTENSIONS / ASSETS ──

You MUST recommend relevant extensions for every campaign:

1. **Sitelink Extensions** — Additional links below the ad (4-6 recommended)
   - e.g., "About Us", "Contact", "Our Services", "Free Quote", "Pricing"
   
2. **Callout Extensions** — Short benefit phrases (4-6 recommended)
   - e.g., "Free Estimates", "24/7 Service", "Licensed & Insured", "Same-Day Service"

3. **Structured Snippet Extensions** — Categorized lists
   - Headers: Amenities, Brands, Courses, Services, Types, Neighborhoods
   - e.g., Services: "Drain Cleaning, Pipe Repair, Water Heater Install"

4. **Call Extensions** — Phone number with click-to-call
   - Track calls as conversions, set call hours

5. **Location Extensions** — Google Business Profile link, address, map pin
   - Requires linked Google Business Profile

6. **Price Extensions** — Service/product pricing cards
   - Type, currency, price qualifier (from/up to/average)

7. **Promotion Extensions** — Sales, discounts, coupon codes
   - Occasion (Black Friday, Back to School, etc.), discount type (% off, $ off)

8. **Image Extensions** — Relevant images alongside text ads
   - Square (1:1) and landscape (1.91:1)

9. **Lead Form Extensions** — In-ad contact forms
   - Collect name, email, phone without visiting website

10. **App Extensions** — Link to mobile app

── BIDDING STRATEGIES ──

**Automated (Smart) Bidding:**
- **Maximize Conversions** — get the most conversions within budget
- **Maximize Conversion Value** — optimize for revenue, not just count
- **Target CPA (tCPA)** — set a target cost per acquisition
- **Target ROAS (tROAS)** — set target return on ad spend (e.g., 400%)
- **Maximize Clicks** — get the most traffic within budget

**Manual Bidding:**
- **Manual CPC** — set bids yourself per keyword
- **Enhanced CPC (eCPC)** — manual with Google's AI adjustment

**When to recommend each:**
- New campaigns with < 30 conversions/month → Maximize Clicks or Manual CPC
- 30+ conversions/month → Maximize Conversions or tCPA
- E-commerce with value tracking → Target ROAS
- Brand awareness → Maximize Clicks or Target Impression Share

── AUDIENCE TARGETING ──

**First-Party Audiences:**
- Customer Match — upload email/phone lists
- Website visitors (remarketing pixel)
- App users
- YouTube viewers & channel subscribers

**Google Audiences:**
- Affinity Audiences — lifestyle & interests (e.g., "Cooking Enthusiasts")
- In-Market Audiences — actively researching/buying (e.g., "Plumbing Services")
- Life Events — recently moved, getting married, new baby
- Custom Audiences — based on URLs, apps, keywords people search
- Similar/Lookalike Audiences — people similar to your converters

**Demographic Targeting:**
- Age, gender, household income, parental status
- Combined with bid adjustments (+/- %)

**Audience Observation vs Targeting:**
- Observation = monitor performance without restricting reach
- Targeting = only show ads to these audiences

── CONVERSION TRACKING ──

You should be able to discuss and set up:
- Website conversions (form submissions, purchases, button clicks)
- Phone call conversions (from ads, from website call tracking)
- Import conversions (offline conversions, CRM imports, Salesforce)
- App conversions (installs, in-app actions)
- Store visit conversions (estimated foot traffic)
- Enhanced conversions (first-party data matching)
- Conversion value rules (assign different values by audience, device, location)
- Attribution models: Data-driven (default), Last click, First click, Linear, Time decay, Position-based

── BUDGET & SCHEDULING ──

- Daily budgets (Google can spend up to 2x daily budget but averages over month)
- Shared budgets across campaigns
- Ad scheduling (dayparting) — show ads only during business hours, or bid up/down by time
- Device bid adjustments (mobile +/- %, desktop +/- %, tablet +/- %)
- Location bid adjustments — bid higher in high-performing areas
- Start/end dates for campaigns and ad groups

── REPORTING & METRICS ──

Key metrics you should always reference:
- **CTR** (Click-Through Rate) — clicks ÷ impressions. Industry avg: 3-5% Search, 0.5% Display
- **CPC** (Cost Per Click) — how much each click costs
- **CPA** (Cost Per Acquisition) — cost per conversion
- **ROAS** (Return on Ad Spend) — revenue ÷ ad spend
- **Conversion Rate** — conversions ÷ clicks. Industry avg: 3-5%
- **Quality Score** (1-10) — ad relevance + landing page experience + expected CTR
- **Impression Share** — your impressions ÷ eligible impressions
- **Search Impression Share Lost (Budget)** — missed due to low budget
- **Search Impression Share Lost (Rank)** — missed due to low Ad Rank
- **View-through conversions** — saw but didn't click, converted later
- **Avg. Position** (deprecated but conceptually relevant)

── OPTIMIZATION TASKS ──

When the user asks you to optimize, you should be able to:
1. **Audit campaigns** — find waste, identify top performers, suggest improvements
2. **Keyword pruning** — pause low-performers, add negatives, expand winners
3. **Ad copy A/B testing** — create variations, analyze winners, rotate creatives
4. **Bid adjustments** — device, location, audience, time-of-day
5. **Budget reallocation** — shift spend from low ROAS to high ROAS campaigns
6. **Landing page recommendations** — improve Quality Score
7. **Search term reports** — find irrelevant queries, add as negatives
8. **Competitive analysis** — Auction Insights data, competitor positioning
9. **Quality Score improvement** — ad relevance, CTR, landing page fixes
10. **Remarketing setup** — create audiences, design remarketing campaigns
11. **Conversion optimization** — suggest micro-conversions, optimize funnels
12. **Geographic optimization** — analyze by location, adjust targeting
13. **Seasonal strategy** — plan for holidays, events, seasonal demand

── GOOGLE ADS ACCOUNT MANAGEMENT TASKS ──

You can also guide users through:
- **Account setup** — billing, currency, timezone, linking Google Analytics
- **Conversion tracking** — installing tags, Google Tag Manager setup
- **Google Merchant Center** — product feed setup, Shopify/WooCommerce connection
- **Google Business Profile** — linking for location extensions
- **Google Analytics 4** — linking, audiences, attribution
- **MCC (Manager Account)** — managing multiple accounts
- **Automated rules** — pause ads when CPA exceeds threshold, increase budget when CTR is high
- **Scripts** — basic Google Ads scripts for automation
- **Change history** — reviewing what was changed and when
- **Recommendations tab** — evaluating Google's suggestions (not all are good)
- **Experiments / Campaign Drafts** — A/B testing campaigns before committing

── GOOGLE ADS EDITOR KNOWLEDGE ──

When users mention Google Ads Editor:
- Bulk operations: create/edit/delete campaigns, ad groups, ads, keywords at scale
- Export/import CSVs
- Offline editing, then post changes
- Copy/paste between accounts
- Find and replace across ads

═══════════════════════════════════════════════════════════════════
RESPONSE FORMAT FOR SPECIFIC TASKS
═══════════════════════════════════════════════════════════════════

**When asked to "Create a campaign":**
Provide complete structure:
1. Campaign name, type, objective
2. Budget (daily) and bidding strategy with reasoning
3. Location & language targeting
4. Ad schedule recommendation
5. At least 2 ad groups with themes
6. 10-15 keywords per ad group (with match types)
7. 10-15 negative keywords
8. 3 Responsive Search Ads per ad group (full headlines + descriptions)
9. Recommended extensions (sitelinks, callouts, structured snippets, call)
10. Landing page recommendations

**When asked to "Create an ad group":**
1. Ad group name & theme
2. 10-20 keywords with match types [exact], "phrase", broad
3. Negative keywords specific to this ad group
4. 3 RSAs with 15 headlines + 4 descriptions each
5. Bid recommendation
6. Relevant extensions

**When asked to "Create ads":**
- Always create 3+ variations with genuinely different angles
- For RSAs: provide 15 headlines (30 chars) + 4 descriptions (90 chars)
- Pin key headlines to positions 1-2 when they MUST show
- Include keyword variations, benefits, CTAs, social proof, urgency (compliant)

**When asked to "Add keywords":**
- Suggest 15-20 keywords with match types
- Group by intent (transactional, informational, branded)
- Include estimated search volume and competition level
- Always suggest 10+ negative keywords alongside

**When asked to "Analyze" or "Audit":**
- Give specific numbers and dollar amounts
- Name the exact keywords, ads, or campaigns
- Provide "keep / pause / test" recommendations
- Estimate monthly savings from suggested changes
- Compare to industry benchmarks

**When asked about "Budget":**
- Recommend daily budget with monthly projection
- Consider industry CPCs and desired volume
- Suggest budget split across campaigns by priority
- Warn about budget-limited campaigns and impression share loss

GOOGLE ADS POLICY COMPLIANCE (CRITICAL — ALWAYS ENFORCE):
You MUST ensure every ad you create complies with Google Ads policies. If a user asks for something that violates policy, DO NOT create it. Instead, explain WHY it violates policy and offer a compliant alternative.

**Prohibited Content — NEVER include in ads:**
- Profanity or vulgar language (no "fuck", "shit", "damn", "ass", "hell" in any form, including abbreviations or creative spellings like "f*ck" or "a$$")
- ALL CAPS text — Google disapproves ads with excessive capitalization. Use normal title case or sentence case. "BEST DEALS NOW" → "Best Deals Now"
- Misleading claims, fake urgency, or deceptive content ("You WON!" "GUARANTEED results")
- Nudity or sexually explicit imagery — no bare breasts, buttocks, genitalia. Swimwear/bikini imagery is OK for relevant businesses (swimwear shops, resorts) but must not be sexually suggestive
- Offensive or violent imagery — no guns, weapons, gore, graphic violence in ad creatives
- Drug-related content promoting recreational drugs
- Counterfeit goods or trademark violations

**Sensitive Industries — Handle with care:**
These industries CAN advertise on Google but have strict restrictions. Create compliant ads that push creative boundaries while staying within policy:

1. **Cannabis / CBD / Hemp:**
   - Google allows CBD topicals and hemp-derived products in California, Colorado, and Puerto Rico (US)
   - NEVER mention THC content, "getting high", psychoactive effects, or smoking
   - Focus on wellness, relief, natural ingredients. "Natural Hemp Extract for Daily Wellness" ✓
   - Cannot link to pages selling marijuana/THC products
   - Always remind the user about geographic and product restrictions

2. **Dating / Adult Services:**
   - Dating apps and matchmaking services CAN advertise
   - NEVER include sexually suggestive language ("hot singles", "hookups", "no strings attached")
   - Focus on connection, relationships, compatibility. "Find Your Perfect Match" ✓
   - No escort services, mail-order brides, or sugar daddy/mama sites (prohibited)
   - Images must not be sexually suggestive — show happy couples, social settings

3. **Weight Loss / Health:**
   - Cannot make unrealistic claims ("Lose 30 lbs in a week!", "Guaranteed weight loss")
   - Cannot show dramatic before/after images that imply unrealistic results
   - Focus on lifestyle, healthy habits, professional guidance. "Personalized Nutrition Plans from Certified Dietitians" ✓
   - Supplements must not claim to cure/treat diseases
   - Prescription weight loss drugs (GLP-1, etc.) have additional restrictions

4. **Alcohol:**
   - Allowed but NEVER target minors, promote excessive drinking, or associate with driving
   - Must comply with local laws. Cannot show irresponsible consumption.

5. **Gambling / Betting:**
   - Requires Google certification. Remind user they need approval.
   - NEVER target minors or vulnerable populations
   - Must include responsible gambling messaging

6. **Financial Services (Loans, Credit, Crypto):**
   - Must include required disclosures (APR, fees, terms)
   - Crypto ads require Google certification. Remind user.
   - No payday loans in many jurisdictions

**When a user asks for potentially violating content:**
1. Identify the specific policy at risk
2. Explain clearly: "Hey, Google won't approve that because [reason]. Here's what we CAN do..."
3. Create a compliant alternative that's still effective — push to the edge of what's allowed
4. If the industry is outright prohibited (illegal products, weapons sales, hacking services), firmly decline and explain

**Ad Copy Rules:**
- No excessive punctuation (!!!, ???, !!??)
- No emojis in Google Search ads (Display may allow some)
- Phone numbers don't go in ad text (use call extensions)
- Prices and discounts must be accurate and verifiable
- Trademark terms — use carefully, only if authorized

FORMAT:
- Use markdown: **bold**, bullet points, numbered lists
- Keep it scannable — busy business owners need to get the point fast
- End with a clear next step or question when appropriate`;

async function callOpenAI(body: ChatRequest) {
    if (!OPENAI_API_KEY) return null;

    const contextParts: string[] = [];
    if (body.businessName) contextParts.push(`Business: ${body.businessName}`);
    if (body.businessIndustry) contextParts.push(`Industry: ${body.businessIndustry}`);
    if (body.businessServices?.length) contextParts.push(`Services: ${body.businessServices.join(", ")}`);
    if (body.businessLocation) contextParts.push(`Location: ${body.businessLocation}`);
    if (body.context) contextParts.push(body.context);

    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(contextParts.length ? [{ role: "system", content: `Client context: ${contextParts.join(" | ")}` }] : []),
        ...(body.history || []),
        { role: "user", content: body.message },
    ];

    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages,
                max_tokens: 4096,
                temperature: 0.75,
            }),
        });

        if (!res.ok) {
            console.error("[OpenAI] Error:", res.status, await res.text());
            return null;
        }

        const data = await res.json();
        return {
            content: data.choices?.[0]?.message?.content || "Hmm, didn\u2019t get a response back. Try again?",
            model: "gpt-4o" as const,
            tokens: {
                prompt: data.usage?.prompt_tokens || 0,
                completion: data.usage?.completion_tokens || 0,
                total: data.usage?.total_tokens || 0,
            },
        };
    } catch (err) {
        console.error("[OpenAI] Fetch error:", err);
        return null;
    }
}

async function callAnthropic(body: ChatRequest) {
    if (!ANTHROPIC_API_KEY) return null;

    const contextParts: string[] = [];
    if (body.businessName) contextParts.push(`Business: ${body.businessName}`);
    if (body.businessIndustry) contextParts.push(`Industry: ${body.businessIndustry}`);
    if (body.businessServices?.length) contextParts.push(`Services: ${body.businessServices.join(", ")}`);
    if (body.businessLocation) contextParts.push(`Location: ${body.businessLocation}`);
    if (body.context) contextParts.push(body.context);

    const systemText = SYSTEM_PROMPT + (contextParts.length ? `\n\nClient context: ${contextParts.join(" | ")}` : "");

    const messages = [
        ...(body.history || []).map((m) => ({
            role: m.role === "system" ? ("user" as const) : (m.role as "user" | "assistant"),
            content: m.content,
        })),
        { role: "user" as const, content: body.message },
    ];

    try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4096,
                system: systemText,
                messages,
            }),
        });

        if (!res.ok) {
            console.error("[Anthropic] Error:", res.status, await res.text());
            return null;
        }

        const data = await res.json();
        return {
            content: data.content?.[0]?.text || "Hmm, didn\u2019t get a response back. Try again?",
            model: "claude-4.6" as const,
            tokens: {
                prompt: data.usage?.input_tokens || 0,
                completion: data.usage?.output_tokens || 0,
                total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            },
        };
    } catch (err) {
        console.error("[Anthropic] Fetch error:", err);
        return null;
    }
}

export async function POST(req: NextRequest) {
    const rateLimited = checkRateLimit(req, chatLimiter);
    if (rateLimited) return rateLimited;

    try {
        const body: ChatRequest = await req.json();

        if (!body.message?.trim()) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // ─── Usage Limit Check ──────────────────────────────────────────────
        let userId: string | null = null;
        let userPlan = "free";
        let messagesUsed = 0;
        let messagesLimit = 10;
        let bonusTokens = 0;

        const session = await getSessionDual(req);
        userId = session?.id || null;

        if (!userId) {
            return NextResponse.json({ error: "Authentication required. Please sign in." }, { status: 401 });
        }

        if (userId) {
            try {
                const { prisma } = await import("@/lib/db");
                const { isAtMessageLimit, PLANS } = await import("@/lib/plans");

                const subscription = await prisma.subscription.findUnique({
                    where: { userId },
                });

                if (subscription) {
                    userPlan = subscription.plan;
                    messagesUsed = subscription.aiMessagesUsed;
                    messagesLimit = subscription.aiMessagesLimit;
                    bonusTokens = subscription.bonusTokens;

                    // Check trial expiration
                    if (userPlan === "trial" && (subscription.trialEndsAt || subscription.currentPeriodEnd)) {
                        const trialEndSource = subscription.trialEndsAt || subscription.currentPeriodEnd;
                        const trialEnd = new Date(trialEndSource as Date);
                        if (trialEnd < new Date()) {
                            // Trial expired — downgrade to free
                            await prisma.subscription.update({
                                where: { userId },
                                data: {
                                    plan: "free",
                                    status: "active",
                                    aiMessagesLimit: PLANS.free.aiMessages,
                                    aiMessagesUsed: 0, // Reset usage
                                    campaignsLimit: PLANS.free.campaigns,
                                    adsAccountsLimit: PLANS.free.adsAccounts,
                                    trialEndsAt: null,
                                    currentPeriodEnd: null,
                                },
                            });
                            userPlan = "free";
                            messagesLimit = PLANS.free.aiMessages;
                            messagesUsed = 0;

                            return NextResponse.json({
                                error: "trial_expired",
                                content: `⏰ **Your 7-day free trial has ended!**\n\nYou've been moved to the Free plan (10 AI messages/month).\n\nTo continue with full access, upgrade to:\n\n- **Starter** ($49/mo) → 200 messages + all core features\n- **Pro** ($149/mo) → Unlimited messages + premium features\n\n[Upgrade Now](/pricing)`,
                                model: "system",
                                trialExpired: true,
                                usage: { used: 0, limit: PLANS.free.aiMessages, plan: "free" },
                            });
                        }
                    }

                    if (isAtMessageLimit(userPlan, messagesUsed, bonusTokens)) {
                        const plan = PLANS[userPlan];
                        return NextResponse.json({
                            error: "message_limit_reached",
                            content: `\u26A0\uFE0F **You've used all ${plan?.aiMessages || messagesLimit} AI messages for this month${bonusTokens > 0 ? ` (plus ${bonusTokens} bonus)` : ""}.**\n\nUpgrade your plan or purchase additional messages to continue:\n\n- **Starter** ($49/mo) \u2192 200 messages/month\n- **Pro** ($149/mo) \u2192 Unlimited messages\n- **Top-up** \u2192 $30 for 50, $50 for 100, or $100 for 250 messages\n\n[View Plans](/pricing)`,
                            model: "system",
                            limitReached: true,
                            usage: { used: messagesUsed, limit: messagesLimit + bonusTokens, plan: userPlan },
                        }, { status: 429 });
                    }

                    // Atomically reserve a message slot to prevent race conditions.
                    // This increments usage BEFORE the AI call, only if still under limit.
                    const totalLimit = messagesLimit + bonusTokens;
                    if (userPlan !== "pro") {
                        const reserved = await prisma.subscription.updateMany({
                            where: {
                                userId,
                                aiMessagesUsed: { lt: totalLimit },
                            },
                            data: { aiMessagesUsed: { increment: 1 } },
                        });
                        if (reserved.count === 0) {
                            // Race condition: another request used the last slot
                            return NextResponse.json({
                                error: "message_limit_reached",
                                content: `\u26A0\uFE0F **Message limit reached.** Upgrade or purchase more messages.`,
                                model: "system",
                                limitReached: true,
                                usage: { used: messagesUsed, limit: totalLimit, plan: userPlan },
                            }, { status: 429 });
                        }
                    }
                }
            } catch (dbError) {
                console.warn("[Chat] DB unavailable for usage check:", dbError);
            }
        }

        // ─── Scrape URLs in message for context ─────────────────────────────
        const urls = extractUrls(body.message);
        let scrapedContext = "";

        // Also check for business website
        if (body.businessWebsite && !urls.includes(body.businessWebsite)) {
            urls.unshift(body.businessWebsite);
        }

        if (urls.length > 0) {
            // Scrape up to 2 URLs to avoid overloading context
            const scrapePromises = urls.slice(0, 2).map(scrapeUrl);
            const results = await Promise.all(scrapePromises);

            const scrapedParts: string[] = [];
            results.forEach((result, i) => {
                if (result.success) {
                    scrapedParts.push(`[Website: ${urls[i]}]\nTitle: ${result.title}\nContent: ${result.content.slice(0, 3000)}`);
                }
            });

            if (scrapedParts.length > 0) {
                scrapedContext = "\n\n─── SCRAPED WEBSITE CONTENT ───\n" + scrapedParts.join("\n\n───\n\n");
                // Append to body.context for the AI to use
                body.context = (body.context || "") + scrapedContext;
            }
        }

        // ─── Call AI Model ──────────────────────────────────────────────────
        const preferredModel = body.model || "gpt-4o";
        let result = null;

        if (preferredModel === "gpt-4o") {
            result = await callOpenAI(body);
            if (!result) result = await callAnthropic(body);
        } else {
            result = await callAnthropic(body);
            if (!result) result = await callOpenAI(body);
        }

        if (!result) {
            return NextResponse.json({
                content: "\uD83D\uDD27 **Demo Mode** \u2014 AI API keys not configured yet. The assistant is running with pre-built responses. Once API keys are added, this will use real GPT-4o and Claude models.",
                model: "gpt-4o",
                demo: true,
                tokens: { prompt: 0, completion: 0, total: 0 },
            });
        }

        // ─── Track Usage in DB ──────────────────────────────────────────────
        if (userId) {
            try {
                const { prisma } = await import("@/lib/db");
                const { AI_COSTS } = await import("@/lib/plans");

                const modelKey = result.model?.includes("claude") ? "claude-sonnet" : "gpt-4o";
                const costConfig = AI_COSTS[modelKey];
                const costUsd = costConfig
                    ? (result.tokens.prompt / 1000) * costConfig.inputPer1kTokens +
                    (result.tokens.completion / 1000) * costConfig.outputPer1kTokens
                    : 0;

                await Promise.all([
                    prisma.usage.create({
                        data: {
                            userId,
                            type: "chat",
                            model: result.model,
                            inputTokens: result.tokens.prompt,
                            outputTokens: result.tokens.completion,
                            totalTokens: result.tokens.total,
                            costUsd,
                        },
                    }),
                    // For pro plan, increment here since we didn't reserve a slot above
                    userPlan === "pro"
                        ? prisma.subscription.update({
                              where: { userId },
                              data: { aiMessagesUsed: { increment: 1 } },
                          })
                        : Promise.resolve(), // Already incremented atomically above
                    prisma.chatMessage.createMany({
                        data: [
                            {
                                userId,
                                role: "user",
                                content: body.message,
                                businessId: body.businessId || undefined,
                            },
                            {
                                userId,
                                role: "assistant",
                                content: result.content,
                                model: result.model,
                                inputTokens: result.tokens.prompt,
                                outputTokens: result.tokens.completion,
                                costUsd,
                                businessId: body.businessId || undefined,
                            },
                        ],
                    }),
                ]);
            } catch (dbError) {
                console.warn("[Chat] DB unavailable for usage tracking:", dbError);
            }
        }

        return NextResponse.json({
            ...result,
            usage: {
                used: messagesUsed + 1,
                limit: messagesLimit + bonusTokens,
                plan: userPlan,
            },
        });
    } catch (error) {
        console.error("[Chat API] Error:", error);
        return NextResponse.json(
            { error: "Something went wrong on our end. Give it another shot." },
            { status: 500 }
        );
    }
}
