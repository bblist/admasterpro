/**
 * Etsy Intelligence API
 *
 * GET  — Platform status & capabilities
 * POST — AI competitor research, pricing intelligence, listing optimization
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
        message: "AI-powered Etsy marketplace intelligence",
        features: [
            "Competitor product research & analysis",
            "Pricing intelligence & market positioning",
            "SEO tag optimization for Etsy search",
            "Listing quality scoring",
            "Seasonal demand predictions for handmade/vintage",
            "Shop performance benchmarking",
            "Review sentiment analysis",
            "Etsy Ads optimization suggestions",
        ],
        categories: [
            "Handmade", "Vintage", "Craft Supplies", "Jewelry", "Clothing",
            "Home & Living", "Art & Collectibles", "Toys & Games",
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

        if (action === "analyze-niche") {
            const { niche, priceRange, shopUrl } = body;

            const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `You are an Etsy marketplace intelligence expert. Analyze niches and provide actionable selling insights.

Return ONLY valid JSON:
{
  "nicheOverview": {
    "demandLevel": "high|medium|low",
    "competitionLevel": "high|medium|low",
    "profitPotential": "high|medium|low",
    "trendDirection": "growing|stable|declining",
    "summary": "Brief overview"
  },
  "pricingInsights": {
    "averagePrice": "$25-$45",
    "priceRange": "$10-$120",
    "sweetSpot": "$30-$40",
    "premiumTier": "$80+",
    "strategy": "Pricing recommendation"
  },
  "topCompetitors": [
    { "shopName": "Shop name", "estimatedSales": "500+/mo", "avgPrice": "$35", "strength": "What they do well", "weakness": "Gap you can exploit" }
  ],
  "seoTags": {
    "primary": ["tag1", "tag2"],
    "longTail": ["long tail tag 1"],
    "seasonal": ["holiday tag 1"],
    "avoid": ["overused tag"]
  },
  "listingTips": [
    { "tip": "Tip text", "impact": "high|medium|low", "effort": "easy|medium|hard" }
  ],
  "seasonalOpportunities": [
    { "event": "Holiday/Season", "timing": "When to list", "expectedDemand": "+200%", "tips": "What to prepare" }
  ],
  "differentiators": ["Unique angle 1", "Unique angle 2"],
  "overallScore": 78
}`
                        },
                        {
                            role: "user",
                            content: `Analyze Etsy niche:\nNiche: ${niche}\nPrice Range: ${priceRange || "Any"}\n${shopUrl ? `Shop: ${shopUrl}` : ""}`
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

        if (action === "optimize-listing") {
            const { title, description, tags, price, category } = body;

            const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `You are an Etsy listing optimization expert. Optimize listings for maximum visibility and conversions.

Return ONLY valid JSON:
{
  "optimizedTitle": "SEO-optimized title (140 chars max)",
  "optimizedDescription": "Compelling description with keywords woven naturally",
  "optimizedTags": ["tag1", "tag2"],
  "priceSuggestion": { "recommended": "$35", "reason": "Market positioning" },
  "qualityScore": 85,
  "improvements": [
    { "area": "Title|Description|Tags|Photos|Price", "current": "What's wrong", "suggestion": "What to fix", "priority": "high|medium|low" }
  ],
  "photoTips": ["Tip 1", "Tip 2"],
  "seoNotes": "Overall SEO strategy"
}`
                        },
                        {
                            role: "user",
                            content: `Optimize this Etsy listing:\nTitle: ${title}\nDescription: ${description || "N/A"}\nTags: ${tags || "None"}\nPrice: ${price || "N/A"}\nCategory: ${category || "N/A"}`
                        }
                    ],
                    max_tokens: 2048,
                    temperature: 0.5,
                }),
            });

            if (!aiRes.ok) return NextResponse.json({ error: "AI optimization failed" }, { status: 503 });
            const aiData = await aiRes.json();
            let raw = aiData.choices?.[0]?.message?.content?.trim() || "{}";
            if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

            return NextResponse.json({ result: JSON.parse(raw) });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("[EtsyIntelligence] Error:", error);
        return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }
}
