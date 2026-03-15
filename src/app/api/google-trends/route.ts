/**
 * Google Trends & Market Intelligence API
 *
 * GET  — Trending topics, seasonal predictions
 * POST — AI trend analysis, keyword opportunity discovery
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { checkCSRF } from "@/lib/csrf";

export async function GET(req: NextRequest) {
    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    return NextResponse.json({
        available: true,
        message: "AI-powered trend analysis and seasonal prediction engine",
        capabilities: [
            "Trending search topics in your industry",
            "Seasonal demand forecasting",
            "Rising/declining keyword detection",
            "Regional interest heatmap",
            "Related queries and topic clusters",
            "Competition trend comparison",
            "Best timing recommendations for campaigns",
        ],
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

        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        if (!OPENAI_API_KEY) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

        if (action === "analyze-trends") {
            const { keywords, industry, region } = body;

            const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `You are a market trend and search demand expert. Analyze keyword trends and seasonal patterns.

Return ONLY valid JSON:
{
  "trendingTopics": [
    { "topic": "Topic name", "trend": "rising|stable|declining", "volume": "high|medium|low", "seasonality": "Q1/Q2/Q3/Q4/year-round", "opportunity": "Opportunity description" }
  ],
  "seasonalPredictions": [
    { "month": "January", "expectedDemand": "high|medium|low", "recommendation": "What to do" }
  ],
  "risingKeywords": [
    { "keyword": "keyword", "growthRate": "+150%", "competitionLevel": "low|medium|high", "suggestedBid": "$0.50-$1.20" }
  ],
  "decliningKeywords": [
    { "keyword": "keyword", "declineRate": "-30%", "recommendation": "Reduce bids / reallocate budget" }
  ],
  "regionalInsights": [
    { "region": "Region name", "interest": "high|medium|low", "recommendation": "Geo-target this region" }
  ],
  "campaignTimingRecommendations": [
    { "action": "What to do", "timing": "When", "reason": "Why" }
  ],
  "overallOutlook": "Summary of market conditions",
  "topOpportunity": "The single best opportunity right now"
}`
                        },
                        {
                            role: "user",
                            content: `Analyze trends for:\nKeywords: ${keywords || "general"}\nIndustry: ${industry || "general"}\nRegion: ${region || "Global"}\n\nProvide current trend analysis and seasonal predictions.`
                        }
                    ],
                    max_tokens: 2048,
                    temperature: 0.6,
                }),
            });

            if (!aiRes.ok) return NextResponse.json({ error: "AI analysis failed" }, { status: 503 });
            const aiData = await aiRes.json();
            let raw = aiData.choices?.[0]?.message?.content?.trim() || "{}";
            if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

            return NextResponse.json({ result: JSON.parse(raw) });
        }

        if (action === "discover-opportunities") {
            const { businessDescription, currentKeywords } = body;

            const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `You are a keyword opportunity discovery expert. Find untapped keyword opportunities based on business context.

Return ONLY valid JSON:
{
  "opportunities": [
    {
      "keyword": "keyword phrase",
      "monthlySearches": "1K-10K",
      "competition": "low|medium|high",
      "estimatedCpc": "$0.50",
      "relevanceScore": 9,
      "reason": "Why this is a good opportunity"
    }
  ],
  "longTailGems": ["long-tail keyword 1", "long-tail keyword 2"],
  "negativeKeywordSuggestions": ["irrelevant term 1"],
  "contentIdeas": [
    { "title": "Blog/landing page idea", "targetKeywords": ["kw1", "kw2"], "estimatedTraffic": "500/mo" }
  ],
  "quickWins": ["Immediate action 1", "Immediate action 2"]
}`
                        },
                        {
                            role: "user",
                            content: `Business: ${businessDescription || "N/A"}\nCurrent Keywords: ${currentKeywords || "None provided"}\n\nFind untapped keyword opportunities.`
                        }
                    ],
                    max_tokens: 2048,
                    temperature: 0.7,
                }),
            });

            if (!aiRes.ok) return NextResponse.json({ error: "AI discovery failed" }, { status: 503 });
            const aiData = await aiRes.json();
            let raw = aiData.choices?.[0]?.message?.content?.trim() || "{}";
            if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

            return NextResponse.json({ result: JSON.parse(raw) });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("[GoogleTrends] Error:", error);
        return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }
}
