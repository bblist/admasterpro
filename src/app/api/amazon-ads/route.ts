/**
 * Amazon Ads Integration API
 *
 * GET  — Status, campaigns, product performance
 * POST — Connect account, generate ad content, optimize bids
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { checkCSRF } from "@/lib/csrf";

const AMAZON_CLIENT_ID = process.env.AMAZON_ADS_CLIENT_ID || "";

export async function GET(req: NextRequest) {
    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "status";

    if (!AMAZON_CLIENT_ID) {
        return NextResponse.json({
            configured: false,
            message: "Amazon Ads integration coming soon. Manage Sponsored Products, Sponsored Brands, and Sponsored Display from one dashboard.",
            features: [
                "Sponsored Products campaign management",
                "Sponsored Brands with custom store pages",
                "Sponsored Display for retargeting",
                "ACOS (Advertising Cost of Sales) tracking",
                "Product targeting optimization",
                "Amazon-specific keyword research",
                "Cross-platform view: Google + Facebook + Amazon",
            ],
            supportedCampaignTypes: [
                { name: "Sponsored Products", description: "Promote individual product listings in search results and product pages" },
                { name: "Sponsored Brands", description: "Showcase your brand logo, headline, and products at top of search" },
                { name: "Sponsored Display", description: "Reach audiences on and off Amazon with display ads" },
            ],
            metrics: ["ACOS", "ROAS", "TACoS", "Impressions", "Clicks", "Orders", "Revenue"],
            comingSoon: true,
        });
    }

    return NextResponse.json({ configured: true, connected: false });
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

        if (action === "generate-listing") {
            const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
            if (!OPENAI_API_KEY) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

            const { productName, category, features, competitorAsins } = body;

            const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `You are an Amazon listing optimization expert. Generate optimized product listing content.

Return ONLY valid JSON:
{
  "title": "Optimized product title (200 chars max, keyword-rich)",
  "bulletPoints": ["Bullet 1 (500 chars max)", "Bullet 2", "Bullet 3", "Bullet 4", "Bullet 5"],
  "description": "Full product description (2000 chars, HTML-formatted for A+ Content)",
  "backendKeywords": ["keyword 1", "keyword 2"],
  "searchTerms": "Comma-separated search terms for backend (250 chars max)",
  "ppcKeywords": {
    "exact": ["exact match keywords for Sponsored Products"],
    "phrase": ["phrase match keywords"],
    "broad": ["broad match keywords"],
    "negative": ["negative keywords"]
  },
  "bidSuggestions": {
    "sponsoredProducts": {"defaultBid":"$0.75","topOfSearch":"$1.25"},
    "sponsoredBrands": {"defaultBid":"$1.00"}
  },
  "notes": "Listing optimization strategy"
}`
                        },
                        {
                            role: "user",
                            content: `Product: ${productName}\nCategory: ${category || "General"}\nFeatures: ${features || "N/A"}\n${competitorAsins ? `Competitor ASINs: ${competitorAsins}` : ""}`
                        }
                    ],
                    max_tokens: 2048,
                    temperature: 0.6,
                }),
            });

            if (!aiRes.ok) return NextResponse.json({ error: "AI generation failed" }, { status: 503 });
            const aiData = await aiRes.json();
            let raw = aiData.choices?.[0]?.message?.content?.trim() || "{}";
            if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

            return NextResponse.json({ result: JSON.parse(raw) });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("[AmazonAds] Error:", error);
        return NextResponse.json({ error: "Action failed" }, { status: 500 });
    }
}
