/**
 * Plan Configuration — Single Source of Truth
 *
 * ALL plan features, limits, and pricing are defined here.
 * Referenced by: pricing page, sidebar, usage checks, Stripe webhooks, admin dashboard.
 *
 * Pricing:
 *   Free   — $0/mo  (ad audit only, 10 AI messages)
 *   Starter — $49/mo  ($9 AI budget, $40 profit)
 *   Pro    — $149/mo (unlimited everything, all premium features)
 *
 * Top-ups: $30 (50 messages), $50 (100 messages), $100 (250 messages)
 */

export interface PlanFeature {
    text: string;
    included: boolean;
    highlight?: boolean; // makes the feature bold/emphasized
}

export interface PlanConfig {
    id: string;
    name: string;
    price: number; // monthly USD
    priceLabel: string;
    period: string;
    description: string;
    popular?: boolean;
    cta: string;
    ctaVariant: "outline" | "primary" | "accent";

    // Limits
    aiMessages: number; // monthly AI chat messages (0 = unlimited)
    campaigns: number; // campaign drafts (0 = unlimited)
    adsAccounts: number; // connected Google Ads accounts
    knowledgeBaseItems: number; // KB uploads (0 = unlimited)
    transcriptionMinutes: number; // video transcription minutes (0 = unlimited)

    // Feature flags
    features: PlanFeature[];
    featureFlags: {
        freeAudit: boolean;
        aiChat: boolean;
        campaignCreation: boolean;
        keywordResearch: boolean;
        adCopyGeneration: boolean;
        policyCompliance: boolean;
        autoPilot: boolean;
        shoppingAds: boolean;
        displayAds: boolean;
        videoAds: boolean;
        performanceMax: boolean;
        competitorAnalysis: boolean;
        bulkOperations: boolean;
        customBrandVoice: boolean;
        advancedReporting: boolean;
        prioritySupport: boolean;
        dedicatedManager: boolean;
        apiAccess: boolean;
        whiteLabel: boolean;
        videoTranscription: boolean;
        dailyReports: boolean;
        weeklyReports: boolean;
    };
}

export interface TopUpConfig {
    id: string;
    amount: number; // USD
    messages: number; // AI messages
    label: string;
    popular?: boolean;
    savings?: string; // e.g., "Save 20%"
}

// ─── Plan Definitions ───────────────────────────────────────────────────────

export const PLANS: Record<string, PlanConfig> = {
    // TRIAL MODE: All new users get full Pro access for 7 days
    trial: {
        id: "trial",
        name: "7-Day Trial",
        price: 0,
        priceLabel: "FREE",
        period: "for 7 days",
        description: "Full access to all features — no credit card required",
        cta: "Start Free Trial",
        ctaVariant: "primary",

        // Full Pro-level access during trial
        aiMessages: 500, // Generous but not unlimited to prevent abuse
        campaigns: 0, // unlimited
        adsAccounts: 10,
        knowledgeBaseItems: 0, // unlimited
        transcriptionMinutes: 60,

        features: [
            { text: "Full AI assistant access", included: true, highlight: true },
            { text: "500 AI messages", included: true, highlight: true },
            { text: "Unlimited campaign drafts", included: true },
            { text: "All ad types (Search, Display, Shopping, Video)", included: true },
            { text: "Performance Max campaigns", included: true },
            { text: "Keyword research & ad copy generation", included: true },
            { text: "Website scraping & analysis", included: true },
            { text: "Image uploads for ads", included: true },
            { text: "Video transcription (60 min)", included: true },
            { text: "10 Google Ads accounts", included: true },
            { text: "No credit card required", included: true, highlight: true },
        ],
        featureFlags: {
            freeAudit: true,
            aiChat: true,
            campaignCreation: true,
            keywordResearch: true,
            adCopyGeneration: true,
            policyCompliance: true,
            autoPilot: true,
            shoppingAds: true,
            displayAds: true,
            videoAds: true,
            performanceMax: true,
            competitorAnalysis: true,
            bulkOperations: true,
            customBrandVoice: true,
            advancedReporting: true,
            prioritySupport: true,
            dedicatedManager: false,
            apiAccess: true,
            whiteLabel: false,
            videoTranscription: true,
            dailyReports: true,
            weeklyReports: true,
        },
    },

    free: {
        id: "free",
        name: "Free",
        price: 0,
        priceLabel: "$0",
        period: "forever",
        description: "Try AdMaster Pro with a free Google Ads audit",
        cta: "Start Free",
        ctaVariant: "outline",

        aiMessages: 10,
        campaigns: 1,
        adsAccounts: 1,
        knowledgeBaseItems: 3,
        transcriptionMinutes: 0,

        features: [
            { text: "Free Google Ads audit", included: true, highlight: true },
            { text: "10 AI messages/month", included: true },
            { text: "1 campaign draft", included: true },
            { text: "Basic keyword research", included: true },
            { text: "3 Knowledge Base uploads", included: true },
            { text: "Email support", included: true },
            { text: "Auto-Pilot mode", included: false },
            { text: "Ad copy generation", included: false },
            { text: "Shopping & Display ads", included: false },
            { text: "Video transcription", included: false },
        ],
        featureFlags: {
            freeAudit: true,
            aiChat: true,
            campaignCreation: true,
            keywordResearch: true,
            adCopyGeneration: false,
            policyCompliance: true,
            autoPilot: false,
            shoppingAds: false,
            displayAds: false,
            videoAds: false,
            performanceMax: false,
            competitorAnalysis: false,
            bulkOperations: false,
            customBrandVoice: false,
            advancedReporting: false,
            prioritySupport: false,
            dedicatedManager: false,
            apiAccess: false,
            whiteLabel: false,
            videoTranscription: false,
            dailyReports: false,
            weeklyReports: false,
        },
    },

    starter: {
        id: "starter",
        name: "Starter",
        price: 49,
        priceLabel: "$49",
        period: "/month",
        description: "Everything you need to run profitable Google Ads",
        popular: true,
        cta: "Start 7-Day Free Trial",
        ctaVariant: "primary",

        aiMessages: 200,
        campaigns: 10,
        adsAccounts: 2,
        knowledgeBaseItems: 25,
        transcriptionMinutes: 30,

        features: [
            { text: "Everything in Free", included: true },
            { text: "200 AI messages/month", included: true, highlight: true },
            { text: "10 campaign drafts", included: true },
            { text: "Full keyword research & suggestions", included: true },
            { text: "AI ad copy generation (RSA, RDA)", included: true, highlight: true },
            { text: "Auto-Pilot mode", included: true, highlight: true },
            { text: "Policy compliance checks", included: true },
            { text: "25 Knowledge Base uploads", included: true },
            { text: "30 min video transcription/mo", included: true },
            { text: "2 Google Ads accounts", included: true },
            { text: "Daily email reports", included: true },
            { text: "Priority email support", included: true },
            { text: "Shopping & Display ads", included: false },
            { text: "Performance Max campaigns", included: false },
            { text: "Competitor analysis", included: false },
        ],
        featureFlags: {
            freeAudit: true,
            aiChat: true,
            campaignCreation: true,
            keywordResearch: true,
            adCopyGeneration: true,
            policyCompliance: true,
            autoPilot: true,
            shoppingAds: false,
            displayAds: false,
            videoAds: false,
            performanceMax: false,
            competitorAnalysis: false,
            bulkOperations: false,
            customBrandVoice: false,
            advancedReporting: false,
            prioritySupport: true,
            dedicatedManager: false,
            apiAccess: false,
            whiteLabel: false,
            videoTranscription: true,
            dailyReports: true,
            weeklyReports: false,
        },
    },

    pro: {
        id: "pro",
        name: "Pro",
        price: 149,
        priceLabel: "$149",
        period: "/month",
        description: "Full power — every feature, unlimited usage, premium support",
        cta: "Start 7-Day Free Trial",
        ctaVariant: "accent",

        aiMessages: 0, // unlimited
        campaigns: 0, // unlimited
        adsAccounts: 10,
        knowledgeBaseItems: 0, // unlimited
        transcriptionMinutes: 0, // unlimited

        features: [
            { text: "Everything in Starter", included: true },
            { text: "Unlimited AI messages", included: true, highlight: true },
            { text: "Unlimited campaign drafts", included: true, highlight: true },
            { text: "Unlimited Knowledge Base", included: true },
            { text: "Unlimited video transcription", included: true },
            { text: "10 Google Ads accounts", included: true, highlight: true },
            { text: "Shopping ads management", included: true, highlight: true },
            { text: "Display & Video ads", included: true },
            { text: "Performance Max campaigns", included: true, highlight: true },
            { text: "Competitor analysis", included: true },
            { text: "Custom brand voice", included: true },
            { text: "Advanced reporting & analytics", included: true },
            { text: "Bulk operations", included: true },
            { text: "Daily & weekly reports", included: true },
            { text: "Priority support + dedicated manager", included: true, highlight: true },
            { text: "API access", included: true },
        ],
        featureFlags: {
            freeAudit: true,
            aiChat: true,
            campaignCreation: true,
            keywordResearch: true,
            adCopyGeneration: true,
            policyCompliance: true,
            autoPilot: true,
            shoppingAds: true,
            displayAds: true,
            videoAds: true,
            performanceMax: true,
            competitorAnalysis: true,
            bulkOperations: true,
            customBrandVoice: true,
            advancedReporting: true,
            prioritySupport: true,
            dedicatedManager: true,
            apiAccess: true,
            whiteLabel: true,
            videoTranscription: true,
            dailyReports: true,
            weeklyReports: true,
        },
    },
};

// ─── Top-Up Packages ────────────────────────────────────────────────────────

export const TOP_UPS: TopUpConfig[] = [
    {
        id: "topup_30",
        amount: 30,
        messages: 50,
        label: "50 Messages",
    },
    {
        id: "topup_50",
        amount: 50,
        messages: 100,
        label: "100 Messages",
        popular: true,
        savings: "Save 17%",
    },
    {
        id: "topup_100",
        amount: 100,
        messages: 250,
        label: "250 Messages",
        savings: "Save 33%",
    },
];

// ─── AI Cost Estimates ──────────────────────────────────────────────────────
// Used for admin dashboard margin calculations

export const AI_COSTS: Record<string, { inputPer1kTokens: number; outputPer1kTokens: number; avgInputTokensPerMsg: number; avgOutputTokensPerMsg: number; avgCostPerMessage: number }> = {
    "gpt-4o-mini": {
        inputPer1kTokens: 0.00015,  // $0.15 per 1M input tokens
        outputPer1kTokens: 0.0006,  // $0.60 per 1M output tokens
        avgInputTokensPerMsg: 2500, // typical chat message
        avgOutputTokensPerMsg: 800,
        avgCostPerMessage: 0.000855, // ~$0.0009 per message
    },
    // Legacy reference — kept for backward compat if any old records reference gpt-4o
    "gpt-4o": {
        inputPer1kTokens: 0.0025,   // $2.50 per 1M input tokens
        outputPer1kTokens: 0.01,    // $10 per 1M output tokens
        avgInputTokensPerMsg: 2500,
        avgOutputTokensPerMsg: 800,
        avgCostPerMessage: 0.014,
    },
    "claude-sonnet": {
        inputPer1kTokens: 0.003,    // $3 per 1M input tokens
        outputPer1kTokens: 0.015,   // $15 per 1M output tokens
        avgInputTokensPerMsg: 2500,
        avgOutputTokensPerMsg: 800,
        avgCostPerMessage: 0.0195,  // ~$0.02 per message
    },
    // Alias for backward compat
    "claude-4.6": {
        inputPer1kTokens: 0.003,
        outputPer1kTokens: 0.015,
        avgInputTokensPerMsg: 2500,
        avgOutputTokensPerMsg: 800,
        avgCostPerMessage: 0.0195,
    },
};

// At $49/mo with $9 AI budget:
//   GPT-4o-mini: $9 / $0.0009 = ~10,000 messages (we give 200, huge margin)
//   Claude:      $9 / $0.02   = ~450 messages
// At $149/mo "unlimited" actually means we cover more, but cost per message stays same

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getPlan(planId: string): PlanConfig {
    return PLANS[planId] || PLANS.free;
}

export function canUseFeature(planId: string, feature: keyof PlanConfig["featureFlags"]): boolean {
    const plan = getPlan(planId);
    return plan.featureFlags[feature];
}

export function isAtMessageLimit(planId: string, messagesUsed: number, bonusTokens: number = 0): boolean {
    const plan = getPlan(planId);
    if (plan.aiMessages === 0) return false; // unlimited
    return messagesUsed >= (plan.aiMessages + bonusTokens);
}

export function getMessageUsagePercent(planId: string, messagesUsed: number, bonusTokens: number = 0): number {
    const plan = getPlan(planId);
    if (plan.aiMessages === 0) return 0; // unlimited shows as 0%
    const total = plan.aiMessages + bonusTokens;
    return Math.min(100, Math.round((messagesUsed / total) * 100));
}

export function getRemainingMessages(planId: string, messagesUsed: number, bonusTokens: number = 0): number | "unlimited" {
    const plan = getPlan(planId);
    if (plan.aiMessages === 0) return "unlimited";
    const total = plan.aiMessages + bonusTokens;
    return Math.max(0, total - messagesUsed);
}
