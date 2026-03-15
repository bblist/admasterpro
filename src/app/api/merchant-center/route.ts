/**
 * Google Merchant Center / Shopping Integration API
 *
 * GET  — Product feed status, disapproved items, price competitiveness
 * POST — AI product feed optimization, title rewriting, bid optimization
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { checkCSRF } from "@/lib/csrf";

const MERCHANT_ID = process.env.GOOGLE_MERCHANT_ID || "";

export async function GET(req: NextRequest) {
    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "status";

    if (!MERCHANT_ID) {
        return NextResponse.json({
            configured: false,
            message: "Google Merchant Center integration coming soon. Optimize product feeds and Shopping campaigns.",
            features: [
                "Product feed health monitoring",
                "Disapproved product alerts & auto-fix suggestions",
                "Price competitiveness benchmarking",
                "Shopping campaign bid optimization",
                "Product title & description AI rewriting",
                "Category mapping assistance",
                "Supplemental feed generation",
                "Buy on Google / Free Listings optimization",
            ],
            feedMetrics: [
                { name: "Active Products", description: "Products currently shown in Shopping" },
                { name: "Disapproved", description: "Products with policy or data issues" },
                { name: "Pending Review", description: "Newly submitted products" },
                { name: "Expiring", description: "Products needing data refresh" },
            ],
            optimizations: [
                { name: "Title Optimization", description: "AI-rewritten titles with search-term front-loading" },
                { name: "GTIN Coverage", description: "Find missing GTINs to improve ad eligibility" },
                { name: "Image Quality", description: "Check images meet Shopping requirements" },
                { name: "Price Competitiveness", description: "Compare your prices vs market" },
            ],
            comingSoon: true,
        });
    }

    return NextResponse.json({ configured: true, merchantId: MERCHANT_ID });
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

        if (action === "optimize-titles") {
            const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
            if (!OPENAI_API_KEY) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

            const { products } = body;

            const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `You are a Google Shopping product feed optimization expert.

Rules for optimized titles:
- Front-load the primary search keyword
- Include brand, product type, key attributes (color, size, material)
- Max 150 characters
- No promotional text (sale, free shipping)
- No ALL CAPS

Return ONLY valid JSON:
{
  "optimizedProducts": [
    {
      "original": "Original title",
      "optimized": "Optimized title",
      "changes": ["Front-loaded keyword", "Added brand"],
      "estimatedImpact": "high|medium|low"
    }
  ],
  "feedHealthSuggestions": ["suggestion 1"],
  "overallScore": 85
}`
                        },
                        {
                            role: "user",
                            content: `Optimize these product titles for Google Shopping:\n${JSON.stringify(products?.slice(0, 20) || [])}`
                        }
                    ],
                    max_tokens: 2048,
                    temperature: 0.4,
                }),
            });

            if (!aiRes.ok) return NextResponse.json({ error: "AI optimization failed" }, { status: 503 });
            const aiData = await aiRes.json();
            let raw = aiData.choices?.[0]?.message?.content?.trim() || "{}";
            if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

            return NextResponse.json({ result: JSON.parse(raw) });
        }

        if (action === "diagnose-disapprovals") {
            const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
            if (!OPENAI_API_KEY) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

            const { disapprovedProducts } = body;

            const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `You are a Google Merchant Center policy expert. Diagnose product disapprovals and provide fix instructions.

Return ONLY valid JSON:
{
  "diagnoses": [
    {
      "product": "Product name",
      "issue": "Disapproval reason",
      "severity": "critical|warning|info",
      "fix": "Step by step fix instructions",
      "commonCause": "Most likely root cause",
      "timeToFix": "Estimated time"
    }
  ],
  "summary": { "critical": 0, "warning": 0, "info": 0 },
  "prioritizedActions": ["Action 1", "Action 2"]
}`
                        },
                        {
                            role: "user",
                            content: `Diagnose these disapproved products:\n${JSON.stringify(disapprovedProducts?.slice(0, 15) || [])}`
                        }
                    ],
                    max_tokens: 2048,
                    temperature: 0.3,
                }),
            });

            if (!aiRes.ok) return NextResponse.json({ error: "AI analysis failed" }, { status: 503 });
            const aiData = await aiRes.json();
            let raw = aiData.choices?.[0]?.message?.content?.trim() || "{}";
            if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

            return NextResponse.json({ result: JSON.parse(raw) });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("[MerchantCenter] Error:", error);
        return NextResponse.json({ error: "Action failed" }, { status: 500 });
    }
}
