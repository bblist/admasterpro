/**
 * Shopify Analytics API
 *
 * GET — Revenue attribution, ROAS per campaign, product-level performance,
 *       cart abandonment insights, CAC tracking, order feed
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { fetchShopifyOrders, fetchShopifyProducts, decryptShopifyToken } from "@/lib/shopify";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function GET(req: NextRequest) {
    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const type = searchParams.get("type") || "overview";

    try {
        const business = businessId
            ? await prisma.business.findFirst({ where: { id: businessId, userId: session.id, shopifyConnected: true } })
            : await prisma.business.findFirst({ where: { userId: session.id, shopifyConnected: true } });

        if (!business || !business.shopifyDomain || !business.shopifyAccessToken) {
            return NextResponse.json({ error: "Shopify not connected", connected: false }, { status: 400 });
        }

        const shopDomain = business.shopifyDomain;
        const accessToken = decryptShopifyToken(business.shopifyAccessToken);

        switch (type) {
            case "overview": {
                // Get recent orders + products for overview
                const [orders, products] = await Promise.all([
                    fetchShopifyOrders(shopDomain, accessToken, 50),
                    fetchShopifyProducts(shopDomain, accessToken, 50),
                ]);

                // Revenue calculations
                const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
                const totalOrders = orders.length;
                const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

                // Last 30 days revenue
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const recentOrders = orders.filter((o) => new Date(o.createdAt) > thirtyDaysAgo);
                const recentRevenue = recentOrders.reduce((sum, o) => sum + o.totalPrice, 0);

                // Product performance
                const productPerf = products.slice(0, 20).map((p) => ({
                    id: p.shopifyId,
                    title: p.title,
                    status: p.status,
                    price: p.price || 0,
                    inventory: p.inventoryQty,
                    productType: p.productType,
                    imageUrl: p.imageUrl,
                }));

                // Daily revenue breakdown
                const dailyRevenue: Record<string, number> = {};
                for (const order of recentOrders) {
                    const date = new Date(order.createdAt).toISOString().split("T")[0];
                    dailyRevenue[date] = (dailyRevenue[date] || 0) + order.totalPrice;
                }
                const dailyChart = Object.entries(dailyRevenue)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, revenue]) => ({ date, revenue }));

                // Order status breakdown
                const statusBreakdown = {
                    fulfilled: orders.filter((o) => o.fulfillmentStatus === "fulfilled").length,
                    unfulfilled: orders.filter((o) => !o.fulfillmentStatus || o.fulfillmentStatus === null).length,
                    partial: orders.filter((o) => o.fulfillmentStatus === "partial").length,
                    refunded: orders.filter((o) => o.financialStatus === "refunded").length,
                };

                return NextResponse.json({
                    connected: true,
                    overview: {
                        totalRevenue,
                        recentRevenue,
                        totalOrders,
                        avgOrderValue,
                        productCount: products.length,
                    },
                    dailyChart,
                    statusBreakdown,
                    topProducts: productPerf,
                    recentOrders: recentOrders.slice(0, 10).map((o) => ({
                        id: o.shopifyId,
                        name: o.orderNumber,
                        total: o.totalPrice,
                        currency: o.currency,
                        createdAt: o.createdAt,
                        fulfillmentStatus: o.fulfillmentStatus,
                        financialStatus: o.financialStatus,
                        itemCount: o.itemCount,
                    })),
                });
            }

            case "roas": {
                // ROAS calculation requires cross-referencing with Google Ads spend
                const orders = await fetchShopifyOrders(shopDomain, accessToken, 50);
                const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

                // Pull ad spend from database (from synced Google Ads data)
                const user = await prisma.user.findUnique({ where: { id: session.id }, select: { refreshToken: true } });
                let adSpend = 0;
                if (user?.refreshToken && business.googleAdsId) {
                    try {
                        const { getAccountSummary } = await import("@/lib/google-ads");
                        const summary = await getAccountSummary(user.refreshToken, business.googleAdsId);
                        adSpend = summary.cost;
                    } catch { /* no ads data */ }
                }

                const roas = adSpend > 0 ? totalRevenue / adSpend : 0;
                const cac = orders.length > 0 && adSpend > 0 ? adSpend / orders.length : 0;

                return NextResponse.json({
                    connected: true,
                    roas: {
                        totalRevenue,
                        adSpend,
                        roas: Math.round(roas * 100) / 100,
                        cac: Math.round(cac * 100) / 100,
                        orderCount: orders.length,
                        revenuePerOrder: orders.length > 0 ? Math.round(totalRevenue / orders.length * 100) / 100 : 0,
                    },
                });
            }

            default:
                return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }
    } catch (error) {
        console.error("[ShopifyAnalytics] Error:", error);
        return NextResponse.json({ error: "Failed to fetch Shopify analytics" }, { status: 500 });
    }
}

// ─── POST: AI analysis of Shopify data ──────────────────────────────────────

export async function POST(req: NextRequest) {
    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!OPENAI_API_KEY) {
        return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }

    try {
        const body = await req.json();
        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are an e-commerce analytics expert. Analyze the Shopify store data and provide actionable insights.
Return ONLY valid JSON:
{
  "insights": [{"type":"revenue|product|pricing|inventory","title":"Insight title","description":"Detail","action":"Recommended action"}],
  "productRecommendations": [{"product":"Product name","recommendation":"What to do"}],
  "pricingOptimization": "Pricing strategy advice",
  "adSuggestions": [{"product":"Best product to advertise","reason":"Why","campaignType":"search|shopping|pmax"}]
}`
                    },
                    { role: "user", content: `Analyze this Shopify data:\n${JSON.stringify(body).slice(0, 4000)}` }
                ],
                max_tokens: 2048,
                temperature: 0.5,
            }),
        });

        if (!aiRes.ok) return NextResponse.json({ error: "AI analysis failed" }, { status: 503 });
        const aiData = await aiRes.json();
        let raw = aiData.choices?.[0]?.message?.content?.trim() || "{}";
        if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

        return NextResponse.json({ analysis: JSON.parse(raw) });
    } catch (error) {
        console.error("[ShopifyAnalytics] AI Error:", error);
        return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }
}
