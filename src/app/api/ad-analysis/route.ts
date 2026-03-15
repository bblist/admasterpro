/**
 * Existing Ad Analysis API
 *
 * GET — Pull and analyze all existing campaigns, ad groups, ads from connected Google Ads account.
 *       Returns Quality Score analysis, ad strength, CTR/CPC/CPA benchmarks, wasted spend,
 *       negative keyword gaps, and ad extension coverage.
 *
 * POST — Request a deep AI analysis of specific campaigns or the full account.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { checkCSRF } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import {
    getCampaigns, getKeywords, getSearchTerms, getAccountSummary,
    isGoogleAdsConfigured, queryGoogleAds
} from "@/lib/google-ads";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ─── Industry Benchmarks ────────────────────────────────────────────────────

const INDUSTRY_BENCHMARKS: Record<string, { avgCtr: number; avgCpc: number; avgCpa: number; avgConvRate: number }> = {
    "General": { avgCtr: 3.17, avgCpc: 2.69, avgCpa: 48.96, avgConvRate: 3.75 },
    "Automotive": { avgCtr: 4.0, avgCpc: 2.46, avgCpa: 33.52, avgConvRate: 6.03 },
    "B2B": { avgCtr: 2.41, avgCpc: 3.33, avgCpa: 116.13, avgConvRate: 3.04 },
    "Consumer Services": { avgCtr: 2.41, avgCpc: 6.40, avgCpa: 90.70, avgConvRate: 6.64 },
    "E-Commerce": { avgCtr: 2.69, avgCpc: 1.16, avgCpa: 45.27, avgConvRate: 2.81 },
    "Education": { avgCtr: 3.78, avgCpc: 2.40, avgCpa: 72.70, avgConvRate: 3.39 },
    "Finance": { avgCtr: 2.91, avgCpc: 3.44, avgCpa: 81.93, avgConvRate: 5.10 },
    "Healthcare": { avgCtr: 3.27, avgCpc: 2.62, avgCpa: 78.09, avgConvRate: 3.36 },
    "Home Services": { avgCtr: 2.35, avgCpc: 6.55, avgCpa: 66.02, avgConvRate: 10.22 },
    "Legal": { avgCtr: 2.93, avgCpc: 6.75, avgCpa: 86.02, avgConvRate: 6.98 },
    "Real Estate": { avgCtr: 3.71, avgCpc: 2.37, avgCpa: 116.61, avgConvRate: 2.47 },
    "Restaurants": { avgCtr: 8.65, avgCpc: 1.95, avgCpa: 21.56, avgConvRate: 5.06 },
    "Retail": { avgCtr: 4.76, avgCpc: 1.35, avgCpa: 38.87, avgConvRate: 3.08 },
    "Technology": { avgCtr: 2.09, avgCpc: 3.80, avgCpa: 133.52, avgConvRate: 2.92 },
    "Travel": { avgCtr: 4.68, avgCpc: 1.53, avgCpa: 44.73, avgConvRate: 3.55 },
};

function getBenchmark(industry?: string | null) {
    if (!industry) return INDUSTRY_BENCHMARKS["General"];
    const key = Object.keys(INDUSTRY_BENCHMARKS).find(k =>
        k.toLowerCase().includes(industry.toLowerCase()) ||
        industry.toLowerCase().includes(k.toLowerCase())
    );
    return INDUSTRY_BENCHMARKS[key || "General"];
}

// ─── GET: Pull existing ads analysis ────────────────────────────────────────

export async function GET(req: NextRequest) {
    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!isGoogleAdsConfigured()) {
        return NextResponse.json({ error: "Google Ads not configured" }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const dateRange = searchParams.get("dateRange") || "LAST_30_DAYS";

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { refreshToken: true },
        });
        if (!user?.refreshToken) {
            return NextResponse.json({ error: "Google Ads not connected" }, { status: 400 });
        }

        const business = businessId
            ? await prisma.business.findFirst({ where: { id: businessId, userId: session.id } })
            : await prisma.business.findFirst({ where: { userId: session.id, googleAdsId: { not: null } } });

        if (!business?.googleAdsId) {
            return NextResponse.json({ error: "No Google Ads account linked" }, { status: 400 });
        }

        const benchmark = getBenchmark(business.industry);

        // Fetch all data in parallel
        const [campaigns, keywords, searchTerms, summary] = await Promise.all([
            getCampaigns(user.refreshToken, business.googleAdsId, dateRange),
            getKeywords(user.refreshToken, business.googleAdsId, dateRange),
            getSearchTerms(user.refreshToken, business.googleAdsId, dateRange),
            getAccountSummary(user.refreshToken, business.googleAdsId, dateRange),
        ]);

        // Quality Score analysis
        const qualityScoreAnalysis = {
            avgScore: keywords.length > 0
                ? Math.round(keywords.reduce((sum, k) => sum + k.qualityScore, 0) / keywords.length * 10) / 10
                : 0,
            distribution: {
                excellent: keywords.filter(k => k.qualityScore >= 8).length,
                good: keywords.filter(k => k.qualityScore >= 6 && k.qualityScore < 8).length,
                average: keywords.filter(k => k.qualityScore >= 4 && k.qualityScore < 6).length,
                poor: keywords.filter(k => k.qualityScore > 0 && k.qualityScore < 4).length,
                unrated: keywords.filter(k => k.qualityScore === 0).length,
            },
            lowScoreKeywords: keywords
                .filter(k => k.qualityScore > 0 && k.qualityScore < 4)
                .sort((a, b) => a.qualityScore - b.qualityScore)
                .slice(0, 10)
                .map(k => ({ keyword: k.keyword, qScore: k.qualityScore, cost: k.cost, clicks: k.clicks })),
        };

        // CTR/CPC/CPA benchmarking
        const benchmarkComparison = {
            benchmark,
            actual: {
                ctr: summary.ctr * 100,
                cpc: summary.avgCpc,
                cpa: summary.costPerConversion,
                convRate: summary.clicks > 0 ? (summary.conversions / summary.clicks) * 100 : 0,
            },
            verdict: {
                ctr: summary.ctr * 100 >= benchmark.avgCtr ? "above" : "below",
                cpc: summary.avgCpc <= benchmark.avgCpc ? "better" : "worse",
                cpa: summary.costPerConversion <= benchmark.avgCpa ? "better" : "worse",
            },
        };

        // Wasted spend identification
        const wastedSpend = {
            lowQualityKeywords: keywords
                .filter(k => k.qualityScore > 0 && k.qualityScore < 4 && k.cost > 0)
                .reduce((sum, k) => sum + k.cost, 0),
            zeroConversionKeywords: keywords
                .filter(k => k.clicks > 5 && k.conversions === 0 && k.cost > 10)
                .sort((a, b) => b.cost - a.cost)
                .slice(0, 15)
                .map(k => ({ keyword: k.keyword, cost: k.cost, clicks: k.clicks, ctr: k.ctr })),
            irrelevantSearchTerms: searchTerms
                .filter(st => st.clicks > 0 && st.conversions === 0 && st.cost > 5)
                .sort((a, b) => b.cost - a.cost)
                .slice(0, 15)
                .map(st => ({ term: st.searchTerm, cost: st.cost, clicks: st.clicks })),
            totalWasted: 0,
        };
        wastedSpend.totalWasted = wastedSpend.lowQualityKeywords +
            wastedSpend.zeroConversionKeywords.reduce((s, k) => s + k.cost, 0);

        // Negative keyword gap analysis
        const negativeKeywordSuggestions = searchTerms
            .filter(st => st.conversions === 0 && st.clicks > 2)
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 20)
            .map(st => ({
                term: st.searchTerm,
                cost: st.cost,
                clicks: st.clicks,
                reason: st.cost > 20 ? "High spend, zero conversions" : "Low relevance, no conversions",
            }));

        // Ad extension coverage analysis
        let extensionCoverage = { sitelinks: false, callouts: false, snippets: false, calls: false, locations: false };
        try {
            const extRows = await queryGoogleAds(
                user.refreshToken,
                business.googleAdsId,
                `SELECT campaign_extension_setting.extension_type FROM campaign_extension_setting LIMIT 50`
            );
            const types = new Set(extRows.map(r => {
                const ext = r.campaignExtensionSetting as Record<string, unknown>;
                return String(ext?.extensionType || "");
            }));
            extensionCoverage = {
                sitelinks: types.has("SITELINK"),
                callouts: types.has("CALLOUT"),
                snippets: types.has("STRUCTURED_SNIPPET"),
                calls: types.has("CALL"),
                locations: types.has("LOCATION"),
            };
        } catch { /* extensions query may not be available */ }

        // Campaign performance summary
        const campaignAnalysis = campaigns.map(c => ({
            ...c,
            performance: c.conversions > 0 && c.cost > 0
                ? c.cost / c.conversions <= benchmark.avgCpa ? "strong" : "needs improvement"
                : c.clicks > 0 ? "generating traffic but no conversions" : "inactive",
            suggestion: c.conversions === 0 && c.clicks > 20
                ? "Consider reviewing landing page or targeting"
                : c.ctr < benchmark.avgCtr / 100 && c.impressions > 100
                    ? "CTR below benchmark — consider refreshing ad copy"
                    : null,
        }));

        return NextResponse.json({
            summary,
            campaigns: campaignAnalysis,
            qualityScore: qualityScoreAnalysis,
            benchmark: benchmarkComparison,
            wastedSpend,
            negativeKeywordSuggestions,
            extensionCoverage,
            keywordCount: keywords.length,
            campaignCount: campaigns.length,
        });
    } catch (error) {
        console.error("[AdAnalysis] Error:", error);
        return NextResponse.json({ error: "Failed to analyze ads" }, { status: 500 });
    }
}

// ─── POST: Deep AI analysis of account ──────────────────────────────────────

export async function POST(req: NextRequest) {
    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!OPENAI_API_KEY) {
        return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    try {
        const body = await req.json();
        const { businessId, campaignData, keywordData, wastedSpend, benchmark } = body;

        const business = businessId
            ? await prisma.business.findFirst({ where: { id: businessId, userId: session.id } })
            : null;

        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert Google Ads strategist. Analyze the account data and provide actionable recommendations. Be specific with numbers and percentages. Prioritize quick wins.

Respond with ONLY valid JSON:
{
  "overallGrade": "A"-"F",
  "summary": "2-3 sentence executive summary",
  "quickWins": [{"action":"specific action","impact":"estimated impact","effort":"low/medium/high"}],
  "strengths": ["what's working well"],
  "weaknesses": ["what needs improvement"],
  "prioritizedActions": [
    {"priority":1,"title":"Action title","description":"Detailed steps","expectedImpact":"$X saved or Y% improvement","category":"budget|targeting|creative|bidding|structure"}
  ],
  "budgetRecommendation": "Budget allocation advice",
  "competitivePosition": "Assessment of competitive standing"
}`
                    },
                    {
                        role: "user",
                        content: `Analyze this Google Ads account:
Business: ${business?.name || "Unknown"} (${business?.industry || "General"})
${campaignData ? `\nCampaigns:\n${JSON.stringify(campaignData).slice(0, 3000)}` : ""}
${keywordData ? `\nTop Keywords:\n${JSON.stringify(keywordData).slice(0, 2000)}` : ""}
${wastedSpend ? `\nWasted Spend:\n${JSON.stringify(wastedSpend).slice(0, 1500)}` : ""}
${benchmark ? `\nBenchmark Comparison:\n${JSON.stringify(benchmark)}` : ""}`
                    }
                ],
                max_tokens: 2048,
                temperature: 0.5,
            }),
        });

        if (!aiRes.ok) {
            return NextResponse.json({ error: "AI analysis failed" }, { status: 503 });
        }

        const aiData = await aiRes.json();
        let raw = aiData.choices?.[0]?.message?.content?.trim() || "{}";
        if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

        let analysis;
        try { analysis = JSON.parse(raw); } catch { analysis = { raw, parseError: true }; }

        return NextResponse.json({ analysis });
    } catch (error) {
        console.error("[AdAnalysis] AI Error:", error);
        return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }
}
