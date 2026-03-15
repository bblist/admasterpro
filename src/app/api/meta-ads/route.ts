/**
 * Facebook/Meta Ads Integration API
 *
 * GET  — List connected accounts, pull campaign performance
 * POST — Connect account via OAuth, create campaigns/ads
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { checkCSRF } from "@/lib/csrf";
import { prisma } from "@/lib/db";

const META_APP_ID = process.env.META_APP_ID || "";
const META_APP_SECRET = process.env.META_APP_SECRET || "";

// ─── GET: Fetch Meta Ads data ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "status";
    const businessId = searchParams.get("businessId");

    try {
        const business = businessId
            ? await prisma.business.findFirst({ where: { id: businessId, userId: session.id } })
            : await prisma.business.findFirst({ where: { userId: session.id } });

        if (!business) {
            return NextResponse.json({ error: "No business found" }, { status: 400 });
        }

        // Check if Meta is configured
        if (!META_APP_ID || !META_APP_SECRET) {
            return NextResponse.json({
                configured: false,
                message: "Facebook/Meta Ads integration coming soon. Connect your account to manage ads across Facebook, Instagram, Messenger, and Audience Network.",
                features: [
                    "Create Facebook & Instagram ads",
                    "Carousel, Stories, Reels, Feed formats",
                    "Audience targeting with AI suggestions",
                    "Cross-platform performance comparison",
                    "Lookalike audience recommendations",
                    "Auto-sync product catalog for dynamic ads",
                ],
                supportedFormats: [
                    { name: "Feed Ads", platforms: ["Facebook", "Instagram"], description: "Standard image/video ads in the news feed" },
                    { name: "Stories Ads", platforms: ["Facebook", "Instagram"], description: "Full-screen vertical ads between Stories" },
                    { name: "Reels Ads", platforms: ["Instagram", "Facebook"], description: "Short-form video ads in Reels" },
                    { name: "Carousel Ads", platforms: ["Facebook", "Instagram"], description: "Multi-image/video swipeable ads" },
                    { name: "Collection Ads", platforms: ["Facebook", "Instagram"], description: "Shoppable product catalog ads" },
                    { name: "Messenger Ads", platforms: ["Messenger"], description: "Ads that open conversation in Messenger" },
                ],
                comingSoon: true,
            });
        }

        // When configured, fetch actual Meta data
        switch (type) {
            case "status":
                return NextResponse.json({ configured: true, connected: false, message: "Ready to connect" });
            case "campaigns":
                return NextResponse.json({ campaigns: [], message: "Connect your Meta Ads account first" });
            default:
                return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }
    } catch (error) {
        console.error("[MetaAds] Error:", error);
        return NextResponse.json({ error: "Failed to fetch Meta Ads data" }, { status: 500 });
    }
}

// ─── POST: Actions (connect, create ad, etc.) ──────────────────────────────

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
        const body = await req.json();
        const { action } = body;

        switch (action) {
            case "get-oauth-url": {
                if (!META_APP_ID) {
                    return NextResponse.json({ error: "Meta App not configured" }, { status: 503 });
                }
                const redirectUri = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/meta-ads/callback`;
                const scopes = "ads_management,ads_read,business_management,pages_read_engagement";
                const state = `${session.id}_${Date.now()}`;
                const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}`;
                return NextResponse.json({ url });
            }

            case "generate-ad": {
                // AI-generate Meta ad creative
                const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
                if (!OPENAI_API_KEY) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

                const { format, productDescription, targetAudience, tone } = body;

                const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content: `You are a Facebook/Instagram Ads expert. Generate ad creative for the specified format.

Return ONLY valid JSON:
{
  "primaryText": "Main ad text (125 chars for feed, 40 for stories)",
  "headline": "Headline (40 chars)",
  "description": "Link description (30 chars)",
  "callToAction": "SHOP_NOW|LEARN_MORE|SIGN_UP|GET_OFFER|BOOK_NOW",
  "variations": [{"primaryText":"","headline":"","description":""}],
  "audienceSuggestions": {
    "interests": ["Interest 1"],
    "demographics": {"age":"25-54","gender":"All"},
    "lookalike": "Website visitors, past purchasers"
  },
  "imageSuggestions": [{"concept":"Image description","aspectRatio":"1:1 or 9:16"}],
  "notes": "Strategy notes"
}`
                            },
                            {
                                role: "user",
                                content: `Format: ${format || "Feed"}\nProduct: ${productDescription}\nTarget Audience: ${targetAudience || "General"}\nTone: ${tone || "Professional"}`
                            }
                        ],
                        max_tokens: 1536,
                        temperature: 0.7,
                    }),
                });

                if (!aiRes.ok) return NextResponse.json({ error: "AI generation failed" }, { status: 503 });
                const aiData = await aiRes.json();
                let raw = aiData.choices?.[0]?.message?.content?.trim() || "{}";
                if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

                return NextResponse.json({ result: JSON.parse(raw), format });
            }

            default:
                return NextResponse.json({ error: "Unknown action" }, { status: 400 });
        }
    } catch (error) {
        console.error("[MetaAds] POST Error:", error);
        return NextResponse.json({ error: "Action failed" }, { status: 500 });
    }
}
