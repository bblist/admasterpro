/**
 * AI Insights API
 *
 * GET    — Fetch active insights for a business
 * POST   — Generate new AI insights (analyzes account data)
 * PUT    — Dismiss or resolve an insight
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionDual } from "@/lib/session";
import { checkCSRF } from "@/lib/csrf";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

/* ── GET — Fetch insights ───────────────────────────────────────── */
export async function GET(req: NextRequest) {
    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    try {
        const business = businessId
            ? await prisma.business.findFirst({ where: { id: businessId, userId: session.id } })
            : await prisma.business.findFirst({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });

        if (!business) {
            return NextResponse.json({ insights: [] });
        }

        const insights = await prisma.aiInsight.findMany({
            where: {
                businessId: business.id,
                dismissed: false,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
            orderBy: [
                { priority: "asc" }, // critical first
                { createdAt: "desc" },
            ],
            take: 20,
        });

        return NextResponse.json({ insights });
    } catch (error) {
        console.error("[AI Insights] GET error:", error);
        return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 });
    }
}

/* ── POST — Generate insights ───────────────────────────────────── */
export async function POST(req: NextRequest) {
    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { businessId, campaignData, keywordData, performanceData } = body;

        const business = businessId
            ? await prisma.business.findFirst({ where: { id: businessId, userId: session.id } })
            : await prisma.business.findFirst({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Build context for AI analysis
        const context: string[] = [];
        context.push(`Business: ${business.name} (${business.industry || "Unknown industry"})`);
        if (business.website) context.push(`Website: ${business.website}`);

        if (campaignData) {
            context.push(`\nCampaign Data:\n${JSON.stringify(campaignData, null, 2)}`);
        }
        if (keywordData) {
            context.push(`\nKeyword Data:\n${JSON.stringify(keywordData, null, 2)}`);
        }
        if (performanceData) {
            context.push(`\nPerformance Data:\n${JSON.stringify(performanceData, null, 2)}`);
        }

        // Check for Shopify products
        const shopifyProducts = await prisma.shopifyProduct.findMany({
            where: { businessId: business.id },
            take: 20,
        });
        if (shopifyProducts.length > 0) {
            context.push(`\nShopify Products (${shopifyProducts.length} total):`);
            shopifyProducts.forEach((p: { title: string; price: number | null; inventoryQty: number }) => {
                context.push(`  - ${p.title}: $${p.price} (inventory: ${p.inventoryQty})`);
            });
        }

        // Call GPT for proactive insights
        const prompt = `You are an expert Google Ads consultant analyzing an advertiser's account. Based on the data below, generate 3-6 actionable insights. Each insight should be proactive — something the advertiser hasn't thought of yet.

Focus on:
- Budget optimization opportunities
- Underperforming keywords that should be paused
- New keyword opportunities based on the business
- Ad copy improvements
- Competitor threats
- Seasonal trends
- Landing page recommendations
- Shopping feed issues (if e-commerce)

${context.join("\n")}

Respond ONLY with valid JSON — an array of objects with these fields:
- type: "opportunity" | "warning" | "performance" | "competitor" | "budget"
- priority: "critical" | "high" | "medium" | "low"
- title: short title (max 60 chars)
- description: detailed explanation with specific numbers (max 300 chars)
- actionLabel: CTA button text like "Fix Now" or "Review" (max 20 chars)
- actionType: "pause_keyword" | "increase_budget" | "decrease_budget" | "create_ad" | "review_keywords" | "check_landing" | "review_campaign" | "add_negatives"

Respond with JSON array only, no markdown or explanation.`;

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 2000,
            }),
        });

        if (!aiResponse.ok) {
            throw new Error("AI analysis failed");
        }

        const aiData = await aiResponse.json();
        const raw = aiData.choices?.[0]?.message?.content || "[]";

        let insights: Array<{
            type: string;
            priority: string;
            title: string;
            description: string;
            actionLabel?: string;
            actionType?: string;
        }>;

        try {
            // Strip markdown code fences if present
            const cleaned = raw.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
            insights = JSON.parse(cleaned);
        } catch {
            console.error("[AI Insights] Failed to parse AI response:", raw);
            insights = [{
                type: "opportunity",
                priority: "medium",
                title: "Review your account",
                description: "Our AI analyzed your account but couldn't generate structured insights right now. Try again in a few minutes.",
                actionLabel: "Retry",
                actionType: "review_campaign",
            }];
        }

        // Save insights to DB
        const created = [];
        for (const insight of insights) {
            const record = await prisma.aiInsight.create({
                data: {
                    businessId: business.id,
                    type: insight.type || "opportunity",
                    priority: insight.priority || "medium",
                    title: insight.title,
                    description: insight.description,
                    actionLabel: insight.actionLabel || null,
                    actionType: insight.actionType || null,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                },
            });
            created.push(record);
        }

        return NextResponse.json({ insights: created, generated: created.length });
    } catch (error) {
        console.error("[AI Insights] POST error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate insights" },
            { status: 500 }
        );
    }
}

/* ── PUT — Dismiss or resolve an insight ────────────────────────── */
export async function PUT(req: NextRequest) {
    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, action } = body;

        if (!id) {
            return NextResponse.json({ error: "Insight ID required" }, { status: 400 });
        }

        // Verify ownership
        const insight = await prisma.aiInsight.findUnique({ where: { id } });
        if (!insight) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const business = await prisma.business.findFirst({
            where: { id: insight.businessId, userId: session.id },
        });
        if (!business) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const update: Record<string, boolean> = {};
        if (action === "dismiss") update.dismissed = true;
        if (action === "resolve") update.resolved = true;

        await prisma.aiInsight.update({ where: { id }, data: update });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[AI Insights] PUT error:", error);
        return NextResponse.json({ error: "Failed to update insight" }, { status: 500 });
    }
}
