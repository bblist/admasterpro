/**
 * Enhanced Ad Policy Compliance Engine API
 *
 * POST — Deep policy check with banned words DB, trademark detection,
 *        landing page validation, restricted content warnings, char limits,
 *        URL validation, and redirect chain detection.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { checkCSRF } from "@/lib/csrf";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ─── Banned Words Database (per-industry) ────────────────────────────────────

const BANNED_WORDS_GLOBAL = [
    "guaranteed results", "miracle", "cure", "#1", "best in the world",
    "click here", "buy now!!!", "free money", "no risk", "act now!!!",
    "once in a lifetime", "secret", "unlimited", "100% free", "winner",
];

const BANNED_WORDS_HEALTHCARE = [
    "cure", "miracle cure", "guaranteed weight loss", "FDA approved",
    "treats disease", "prevents cancer", "heal", "remedy", "prescription",
    "diagnose", "clinical trial results", "doctor recommended",
];

const BANNED_WORDS_FINANCE = [
    "guaranteed returns", "risk-free investment", "get rich quick",
    "double your money", "no credit check", "instant approval",
    "bad credit ok", "guaranteed loan", "free money", "crypto profits",
];

const BANNED_WORDS_ALCOHOL = [
    "drink responsibly", "get drunk", "binge", "unlimited drinks",
    "shots", "hammered", "wasted", "party hard",
];

const BANNED_WORDS_GAMBLING = [
    "sure bet", "guaranteed win", "easy money", "no-lose",
    "winning system", "beat the house", "insider tip",
];

const INDUSTRY_BANNED_WORDS: Record<string, string[]> = {
    healthcare: BANNED_WORDS_HEALTHCARE,
    health: BANNED_WORDS_HEALTHCARE,
    medical: BANNED_WORDS_HEALTHCARE,
    finance: BANNED_WORDS_FINANCE,
    financial: BANNED_WORDS_FINANCE,
    banking: BANNED_WORDS_FINANCE,
    insurance: BANNED_WORDS_FINANCE,
    alcohol: BANNED_WORDS_ALCOHOL,
    beverage: BANNED_WORDS_ALCOHOL,
    gambling: BANNED_WORDS_GAMBLING,
    casino: BANNED_WORDS_GAMBLING,
    betting: BANNED_WORDS_GAMBLING,
};

// ─── Trademark Database (common trademarks to flag) ──────────────────────────

const COMMON_TRADEMARKS = [
    "google", "facebook", "meta", "instagram", "tiktok", "youtube",
    "amazon", "apple", "microsoft", "samsung", "nike", "adidas",
    "coca-cola", "pepsi", "starbucks", "mcdonalds", "walmart",
    "shopify", "stripe", "paypal", "visa", "mastercard", "amex",
    "uber", "lyft", "airbnb", "netflix", "spotify", "twitter",
    "linkedin", "snapchat", "pinterest", "reddit", "whatsapp",
    "tesla", "bmw", "mercedes", "toyota", "honda", "ford",
    "rolex", "gucci", "louis vuitton", "prada", "chanel",
];

// ─── Restricted Content Categories ───────────────────────────────────────────

const RESTRICTED_CATEGORIES: Record<string, { warning: string; rules: string[] }> = {
    healthcare: {
        warning: "Healthcare ads require certification in most countries",
        rules: [
            "Cannot make unsubstantiated health claims",
            "Prescription drugs require Google certification",
            "Must not diagnose or guarantee treatment outcomes",
            "Over-the-counter drug ads must comply with local pharmacy laws",
        ],
    },
    finance: {
        warning: "Financial services ads have strict disclosure requirements",
        rules: [
            "Must include APR/fees for lending products",
            "Cannot guarantee investment returns",
            "Crypto ads require Google certification",
            "Must comply with local financial advertising regulations",
        ],
    },
    alcohol: {
        warning: "Alcohol ads restricted in many countries and require certification",
        rules: [
            "Cannot target minors or show irresponsible consumption",
            "Must comply with local alcohol advertising laws",
            "Cannot promote excessive drinking",
            "Age-gating required on landing pages",
        ],
    },
    gambling: {
        warning: "Gambling ads require Google certification and are restricted by geography",
        rules: [
            "Must have valid gambling license in target country",
            "Cannot target minors",
            "Must include responsible gambling messaging",
            "Real-money gambling requires Google certification",
        ],
    },
    adult: {
        warning: "Adult content is heavily restricted on Google Ads",
        rules: [
            "Sexually explicit content is prohibited",
            "Adult-oriented businesses have limited ad options",
            "Must comply with SafeSearch requirements",
        ],
    },
};

// ─── Character Limits ────────────────────────────────────────────────────────

const CHAR_LIMITS: Record<string, Record<string, number>> = {
    search: { headline: 30, description: 90, path: 15 },
    rsa: { headline: 30, description: 90, path: 15 },
    display: { shortHeadline: 30, longHeadline: 90, description: 90, businessName: 25 },
    shopping: { title: 150, description: 5000 },
    pmax: { headline: 30, longHeadline: 90, description: 90, shortDescription: 60, businessName: 25 },
    video: { headline: 30, description: 90, ctaText: 10, ctaHeadline: 15 },
    demand_gen: { headline: 40, description: 90 },
    call_only: { headline: 30, description: 90, businessName: 25 },
    app: { headline: 30, description: 90 },
};

// ─── URL Validation ──────────────────────────────────────────────────────────

async function validateUrl(url: string): Promise<{
    valid: boolean;
    redirects: string[];
    finalUrl: string;
    issues: string[];
    https: boolean;
}> {
    const issues: string[] = [];
    const redirects: string[] = [];
    let finalUrl = url;
    let valid = true;
    let https = url.startsWith("https://");

    if (!url.match(/^https?:\/\/.+\..+/)) {
        return { valid: false, redirects: [], finalUrl: url, issues: ["Invalid URL format"], https: false };
    }

    if (!https) {
        issues.push("URL does not use HTTPS — Google strongly prefers HTTPS landing pages");
    }

    try {
        let currentUrl = url;
        let redirectCount = 0;
        const maxRedirects = 5;

        while (redirectCount < maxRedirects) {
            const response = await fetch(currentUrl, { method: "HEAD", redirect: "manual" });
            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get("location");
                if (location) {
                    redirects.push(`${currentUrl} → ${location} (${response.status})`);
                    currentUrl = location.startsWith("http") ? location : new URL(location, currentUrl).href;
                    redirectCount++;
                } else {
                    break;
                }
            } else if (response.status >= 400) {
                issues.push(`Landing page returns HTTP ${response.status} error`);
                valid = false;
                break;
            } else {
                finalUrl = currentUrl;
                break;
            }
        }

        if (redirectCount >= maxRedirects) {
            issues.push(`Too many redirects (${redirectCount}+) — this can slow ad loading and hurt Quality Score`);
        }
        if (redirectCount > 0) {
            issues.push(`URL has ${redirectCount} redirect(s) — reduce for better ad performance`);
        }
    } catch {
        issues.push("Could not reach the landing page — verify the URL is accessible");
        valid = false;
    }

    return { valid, redirects, finalUrl, issues, https };
}

// ─── Main Policy Check ──────────────────────────────────────────────────────

interface PolicyCheckRequest {
    adCopy: string;
    campaignType?: string;
    industry?: string;
    landingPageUrl?: string;
    headlines?: string[];
    descriptions?: string[];
}

interface PolicyIssue {
    severity: "error" | "warning" | "info";
    category: string;
    rule: string;
    detail: string;
    suggestion: string;
    line?: string;
}

export async function POST(req: NextRequest) {
    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    try {
        const body: PolicyCheckRequest = await req.json();
        const issues: PolicyIssue[] = [];
        const industry = (body.industry || "").toLowerCase();
        const campaignType = body.campaignType || "search";

        // 1. Character limit enforcement
        const limits = CHAR_LIMITS[campaignType] || CHAR_LIMITS.search;
        if (body.headlines) {
            body.headlines.forEach((h, i) => {
                const maxLen = limits.headline || 30;
                if (h.length > maxLen) {
                    issues.push({
                        severity: "error",
                        category: "Character Limits",
                        rule: `Headline max ${maxLen} chars`,
                        detail: `Headline ${i + 1} is ${h.length} chars: "${h}"`,
                        suggestion: `Shorten to ${maxLen} characters or fewer`,
                        line: h,
                    });
                }
            });
        }
        if (body.descriptions) {
            body.descriptions.forEach((d, i) => {
                const maxLen = limits.description || 90;
                if (d.length > maxLen) {
                    issues.push({
                        severity: "error",
                        category: "Character Limits",
                        rule: `Description max ${maxLen} chars`,
                        detail: `Description ${i + 1} is ${d.length} chars`,
                        suggestion: `Shorten to ${maxLen} characters or fewer`,
                        line: d,
                    });
                }
            });
        }

        // 2. Banned words check (global + industry-specific)
        const allText = body.adCopy.toLowerCase();
        const bannedWords = [...BANNED_WORDS_GLOBAL, ...(INDUSTRY_BANNED_WORDS[industry] || [])];
        for (const word of bannedWords) {
            if (allText.includes(word.toLowerCase())) {
                issues.push({
                    severity: "error",
                    category: "Banned Content",
                    rule: "Prohibited phrase detected",
                    detail: `"${word}" is not allowed in Google Ads`,
                    suggestion: "Remove or rephrase this term to comply with Google Ads policies",
                });
            }
        }

        // 3. Editorial checks
        const lines = body.adCopy.split("\n").filter(l => l.trim());
        for (const line of lines) {
            // ALL CAPS check
            if (line === line.toUpperCase() && line.length > 3 && /[A-Z]/.test(line)) {
                issues.push({
                    severity: "error",
                    category: "Editorial Standards",
                    rule: "No ALL CAPS",
                    detail: `"${line}" is in all caps`,
                    suggestion: "Use title case or sentence case instead",
                    line,
                });
            }
            // Excessive punctuation
            if (/[!?]{2,}/.test(line)) {
                issues.push({
                    severity: "error",
                    category: "Editorial Standards",
                    rule: "Excessive punctuation",
                    detail: `"${line}" has repeated punctuation marks`,
                    suggestion: "Use single punctuation marks only",
                    line,
                });
            }
            // Emoji check (not allowed in text ads)
            if (/[\u{1F600}-\u{1F9FF}]/u.test(line)) {
                issues.push({
                    severity: "warning",
                    category: "Editorial Standards",
                    rule: "Emojis in ad text",
                    detail: "Emojis are not permitted in Search Ad text",
                    suggestion: "Remove emojis — they may cause ad disapproval",
                    line,
                });
            }
            // Phone numbers in ad text
            if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(line)) {
                issues.push({
                    severity: "warning",
                    category: "Editorial Standards",
                    rule: "Phone number in ad text",
                    detail: "Phone numbers should use call extensions, not ad text",
                    suggestion: "Remove the phone number and set up a call extension instead",
                    line,
                });
            }
        }

        // 4. Trademark check
        for (const tm of COMMON_TRADEMARKS) {
            if (allText.includes(tm)) {
                issues.push({
                    severity: "warning",
                    category: "Trademark",
                    rule: "Potential trademark usage",
                    detail: `"${tm}" is a registered trademark — using this may trigger a trademark complaint`,
                    suggestion: "Only use trademarked terms if you're an authorized reseller or the trademark owner",
                });
            }
        }

        // 5. Restricted content category warnings
        const restrictedKeys = Object.keys(RESTRICTED_CATEGORIES);
        for (const key of restrictedKeys) {
            if (industry.includes(key) || allText.includes(key)) {
                const cat = RESTRICTED_CATEGORIES[key];
                issues.push({
                    severity: "warning",
                    category: "Restricted Content",
                    rule: cat.warning,
                    detail: cat.rules.join("; "),
                    suggestion: "Ensure your ads and landing page comply with these requirements and obtain necessary certifications",
                });
            }
        }

        // 6. URL validation (if provided)
        let urlResult = null;
        if (body.landingPageUrl) {
            urlResult = await validateUrl(body.landingPageUrl);
            for (const urlIssue of urlResult.issues) {
                issues.push({
                    severity: urlResult.valid ? "warning" : "error",
                    category: "Landing Page",
                    rule: "URL Validation",
                    detail: urlIssue,
                    suggestion: "Fix the URL issue to improve ad approval chances and Quality Score",
                });
            }
        }

        // 7. AI-powered deep analysis (supplement rule-based checks)
        let aiAnalysis = null;
        if (OPENAI_API_KEY && body.adCopy.length > 10) {
            try {
                const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content: `You are a Google Ads policy expert. Analyze ad copy for additional policy issues not caught by basic rules. Focus on:
- Misleading claims or deceptive practices
- Implied superiority without evidence ("best", "#1")
- Missing disclaimers (especially for regulated industries)
- Landing page policy alignment concerns
- Sensitive category violations

Return ONLY valid JSON array of additional issues (empty array if none):
[{"severity":"warning","category":"AI Analysis","rule":"Rule name","detail":"Issue detail","suggestion":"Fix suggestion"}]`
                            },
                            {
                                role: "user",
                                content: `Industry: ${industry || "general"}\nCampaign Type: ${campaignType}\nAd Copy:\n${body.adCopy}${body.landingPageUrl ? `\nLanding Page: ${body.landingPageUrl}` : ""}`
                            }
                        ],
                        max_tokens: 1024,
                        temperature: 0.3,
                    }),
                });
                if (aiRes.ok) {
                    const aiData = await aiRes.json();
                    let raw = aiData.choices?.[0]?.message?.content?.trim() || "[]";
                    if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
                    aiAnalysis = JSON.parse(raw);
                    if (Array.isArray(aiAnalysis)) {
                        issues.push(...aiAnalysis);
                    }
                }
            } catch { /* AI supplement failed — rule-based results still valid */ }
        }

        // Calculate overall score
        const errorCount = issues.filter(i => i.severity === "error").length;
        const warningCount = issues.filter(i => i.severity === "warning").length;
        const score = Math.max(0, 100 - (errorCount * 20) - (warningCount * 5));
        const compliant = errorCount === 0;

        return NextResponse.json({
            compliant,
            score,
            issues,
            issueCount: { errors: errorCount, warnings: warningCount, info: issues.filter(i => i.severity === "info").length },
            urlValidation: urlResult,
            characterLimits: limits,
            industry: industry || "general",
            summary: compliant
                ? issues.length === 0
                    ? "Your ad copy looks fully compliant with Google Ads policies!"
                    : `Your ads are compliant but have ${warningCount} warning(s) to review.`
                : `Found ${errorCount} policy violation(s) that must be fixed before publishing.`,
        });
    } catch (error) {
        console.error("[PolicyCheck] Error:", error);
        return NextResponse.json({ error: "Policy check failed" }, { status: 500 });
    }
}
