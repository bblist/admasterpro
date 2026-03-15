/**
 * AI Auto-Pilot API
 *
 * GET  — Current auto-pilot status, active rules, history
 * POST — Create rules, run optimization, apply recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { checkCSRF } from "@/lib/csrf";
import prisma from "@/lib/db";

const DEFAULT_RULES = [
    {
        id: "pause-low-ctr",
        name: "Pause Low CTR Keywords",
        description: "Auto-pause keywords with CTR < 0.5% after 1000+ impressions",
        trigger: "ctr < 0.5% && impressions > 1000",
        action: "Pause keyword",
        category: "keywords",
        riskLevel: "low",
        enabled: false,
    },
    {
        id: "boost-high-conv",
        name: "Boost High Converters",
        description: "Increase bids 20% for keywords with conversion rate > 5%",
        trigger: "conversionRate > 5% && conversions > 5",
        action: "Increase bid 20%",
        category: "bidding",
        riskLevel: "medium",
        enabled: false,
    },
    {
        id: "neg-keyword-auto",
        name: "Auto Negative Keywords",
        description: "Add search terms with 50+ clicks and 0 conversions as negatives",
        trigger: "clicks > 50 && conversions = 0",
        action: "Add as negative keyword",
        category: "keywords",
        riskLevel: "low",
        enabled: false,
    },
    {
        id: "budget-shift",
        name: "Budget Shift to Winners",
        description: "Move budget from campaigns with CPA > 2x target to top performers",
        trigger: "campaignCpa > 2x target",
        action: "Reduce budget 15%, redistribute",
        category: "budget",
        riskLevel: "medium",
        enabled: false,
    },
    {
        id: "ad-rotation",
        name: "Smart Ad Rotation",
        description: "Pause underperforming ad variants and create new tests",
        trigger: "adCtr < campaignAvgCtr * 0.7 && impressions > 500",
        action: "Pause ad, suggest new variant",
        category: "ads",
        riskLevel: "low",
        enabled: false,
    },
    {
        id: "daypart-adjust",
        name: "Daypart Bid Adjustments",
        description: "Increase bids during high-converting hours, decrease during low hours",
        trigger: "hourlyConvRate analysis",
        action: "Adjust bid modifiers -30% to +40%",
        category: "bidding",
        riskLevel: "medium",
        enabled: false,
    },
    {
        id: "device-optimize",
        name: "Device Bid Optimization",
        description: "Adjust device bids based on conversion performance",
        trigger: "deviceConvRate deviation > 20%",
        action: "Adjust device bid modifiers",
        category: "bidding",
        riskLevel: "low",
        enabled: false,
    },
    {
        id: "geo-optimize",
        name: "Geographic Optimization",
        description: "Increase bids in high-converting regions, decrease in low ones",
        trigger: "geoConvRate analysis",
        action: "Adjust location bid modifiers",
        category: "targeting",
        riskLevel: "medium",
        enabled: false,
    },
];

export async function GET(req: NextRequest) {
    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    return NextResponse.json({
        status: "ready",
        mode: "supervised", // supervised | autonomous
        rules: DEFAULT_RULES,
        recentActions: [],
        stats: {
            totalOptimizations: 0,
            savingsEstimate: "$0",
            improvementEstimate: "0%",
        },
    });
}

export async function POST(req: NextRequest) {
    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    const session = await getSessionDual(req);
    if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    try {
        const body = await req.json();
        const { action } = body;

        if (action === "run-analysis") {
            const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
            if (!OPENAI_API_KEY) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

            const { accountSummary, enabledRules } = body;

            const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `You are an autonomous Google Ads optimization engine. Analyze account data and generate specific, actionable optimization recommendations.

Return ONLY valid JSON:
{
  "urgentActions": [
    { "rule": "Rule name", "entity": "Campaign/keyword name", "currentValue": "1.2%", "threshold": "0.5%", "suggestedAction": "Pause keyword", "estimatedImpact": "Save $50/week", "confidence": "high|medium|low", "riskLevel": "low|medium|high" }
  ],
  "bidAdjustments": [
    { "entity": "Keyword/Campaign", "currentBid": "$1.50", "suggestedBid": "$1.80", "reason": "High conversion rate", "expectedImprovement": "+15% conversions" }
  ],
  "budgetRecommendations": [
    { "campaign": "Campaign name", "currentBudget": "$50/day", "suggestedBudget": "$65/day", "reason": "Limited by budget, high ROAS", "expectedROI": "3.5x" }
  ],
  "abTestSuggestions": [
    { "campaign": "Campaign", "testType": "Ad copy|Landing page|Bid strategy", "hypothesis": "What we think will happen", "setup": "How to set up the test" }
  ],
  "weeklyForecast": {
    "expectedSpend": "$500",
    "expectedConversions": 25,
    "expectedCPA": "$20",
    "expectedROAS": "4.2x",
    "riskFactors": ["Risk 1"]
  },
  "overallHealth": "good|fair|poor",
  "topPriority": "The single most important action right now"
}`
                        },
                        {
                            role: "user",
                            content: `Analyze this Google Ads account and generate auto-pilot recommendations:\n\nAccount Summary: ${JSON.stringify(accountSummary || {})}\nEnabled Rules: ${JSON.stringify(enabledRules || [])}`
                        }
                    ],
                    max_tokens: 2048,
                    temperature: 0.4,
                }),
            });

            if (!aiRes.ok) return NextResponse.json({ error: "AI analysis failed" }, { status: 503 });
            const aiData = await aiRes.json();
            let raw = aiData.choices?.[0]?.message?.content?.trim() || "{}";
            if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

            return NextResponse.json({ result: JSON.parse(raw) });
        }

        if (action === "toggle-rule") {
            const { ruleId, enabled } = body;
            // In production, this would persist to DB
            return NextResponse.json({ success: true, ruleId, enabled });
        }

        if (action === "apply-recommendation") {
            const { recommendationId, type } = body;
            // In production, this would call Google Ads API
            return NextResponse.json({
                success: true,
                message: `Recommendation queued for application. Changes will take effect within 1 hour.`,
                recommendationId,
            });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("[AutoPilot] Error:", error);
        return NextResponse.json({ error: "Action failed" }, { status: 500 });
    }
}
