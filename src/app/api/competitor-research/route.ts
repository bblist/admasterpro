/**
 * Competitor Research API
 *
 * GET  — Identify competitors, analyze their ad copy patterns, auction insights
 * POST — Deep AI competitor analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { checkCSRF } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { isGoogleAdsConfigured, queryGoogleAds } from "@/lib/google-ads";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ─── GET: Auction insights + competitor data ────────────────────────────────

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

        // Auction insights query
        let auctionInsights: { domain: string; overlapRate: number; positionAboveRate: number; topOfPageRate: number; impressionShare: number }[] = [];
        try {
            const rows = await queryGoogleAds(
                user.refreshToken,
                business.googleAdsId,
                `SELECT
                    auction_insight.display_domain,
                    metrics.auction_insight_search_overlap_rate,
                    metrics.auction_insight_search_position_above_rate,
                    metrics.auction_insight_search_top_impression_percentage,
                    metrics.auction_insight_search_impression_share
                FROM campaign_auction_insight
                WHERE segments.date DURING LAST_30_DAYS
                ORDER BY metrics.auction_insight_search_impression_share DESC
                LIMIT 20`
            );

            auctionInsights = rows.map(row => {
                const ai = row.auctionInsight as Record<string, unknown>;
                const m = row.metrics as Record<string, unknown>;
                return {
                    domain: String(ai?.displayDomain || "Unknown"),
                    overlapRate: Number(m?.auctionInsightSearchOverlapRate || 0),
                    positionAboveRate: Number(m?.auctionInsightSearchPositionAboveRate || 0),
                    topOfPageRate: Number(m?.auctionInsightSearchTopImpressionPercentage || 0),
                    impressionShare: Number(m?.auctionInsightSearchImpressionShare || 0),
                };
            });
        } catch {
            // Auction insights may not be available for all accounts
        }

        return NextResponse.json({
            auctionInsights,
            business: { name: business.name, industry: business.industry, website: business.website },
        });
    } catch (error) {
        console.error("[CompetitorResearch] Error:", error);
        return NextResponse.json({ error: "Failed to fetch competitor data" }, { status: 500 });
    }
}

// ─── POST: Deep AI competitor analysis ──────────────────────────────────────

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
        const { businessName, industry, website, keywords, auctionInsights, competitorUrls } = body;

        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert competitive intelligence analyst for Google Ads. Analyze competitors and provide actionable insights.

Respond with ONLY valid JSON:
{
  "competitors": [
    {
      "domain": "competitor.com",
      "threatLevel": "high|medium|low",
      "estimatedBudget": "$X,XXX/mo",
      "strengths": ["strength 1"],
      "weaknesses": ["weakness 1"],
      "adCopyPatterns": ["Uses urgency CTAs", "Focuses on price"],
      "keywordOverlap": ["shared keyword 1"],
      "missingKeywords": ["keyword they target that you don't"]
    }
  ],
  "gapAnalysis": {
    "keywordsYouMiss": ["keyword 1", "keyword 2"],
    "messagingGaps": ["Competitors emphasize X which you don't"],
    "formatGaps": ["Competitors use video ads, you only use search"]
  },
  "shareOfVoice": {
    "yourShare": "X%",
    "topCompetitorShare": "Y%",
    "assessment": "You're 3rd in impression share for this market"
  },
  "recommendations": [
    {"priority":1,"action":"Specific action","expectedImpact":"Impact estimate"}
  ],
  "landingPageComparison": {
    "yourStrengths": ["Clear CTA"],
    "competitorAdvantages": ["Social proof, testimonials"],
    "suggestions": ["Add customer reviews"]
  }
}`
                    },
                    {
                        role: "user",
                        content: `Analyze competitors for this business:
Business: ${businessName || "Unknown"} (${industry || "General"})
Website: ${website || "N/A"}
${keywords?.length ? `Your Keywords: ${keywords.join(", ")}` : ""}
${auctionInsights?.length ? `\nAuction Insights (competitors by impression share):\n${JSON.stringify(auctionInsights)}` : ""}
${competitorUrls?.length ? `\nCompetitor URLs to analyze: ${competitorUrls.join(", ")}` : ""}`
                    }
                ],
                max_tokens: 3000,
                temperature: 0.6,
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
        console.error("[CompetitorResearch] AI Error:", error);
        return NextResponse.json({ error: "Competitor analysis failed" }, { status: 500 });
    }
}
