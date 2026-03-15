/**
 * Shopify OAuth + Product Sync API
 *
 * GET  /api/shopify?action=auth&shop=x.myshopify.com   — Start OAuth
 * GET  /api/shopify?action=products                     — Fetch products
 * GET  /api/shopify?action=orders                       — Fetch orders
 * GET  /api/shopify?action=shop-info                    — Fetch shop info
 * POST /api/shopify  { action: "sync" }                 — Sync products to DB
 * POST /api/shopify  { action: "disconnect" }           — Disconnect Shopify
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionDual } from "@/lib/session";
import { checkCSRF } from "@/lib/csrf";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import {
    getShopifyAuthUrl,
    fetchShopifyProducts,
    fetchShopifyOrders,
    fetchShopInfo,
    decryptShopifyToken,
    isValidShopifyDomain,
} from "@/lib/shopify";
import crypto from "crypto";

/* ── GET — OAuth start, fetch products/orders/shop-info ───────── */
export async function GET(req: NextRequest) {
    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "products";
    const businessId = searchParams.get("businessId");

    try {
        /* ── Start OAuth ─────────────────────────────────────── */
        if (action === "auth") {
            const shop = searchParams.get("shop");
            if (!shop || !isValidShopifyDomain(shop)) {
                return NextResponse.json(
                    { error: "Invalid Shopify domain. Format: your-store.myshopify.com" },
                    { status: 400 }
                );
            }

            const state = crypto.randomBytes(16).toString("hex");
            // Store state in cookie for verification
            const url = getShopifyAuthUrl(shop, state);

            const response = NextResponse.json({ authUrl: url, state });
            response.cookies.set("shopify_state", state, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 600, // 10 minutes
                path: "/",
            });

            return response;
        }

        /* ── Fetch business with Shopify connection ──────────── */
        const business = await getShopifyBusiness(session.id, businessId);
        if (!business || !business.shopifyAccessToken || !business.shopifyDomain) {
            return NextResponse.json({
                connected: false,
                error: "Shopify not connected. Connect your store in Settings or during onboarding.",
            });
        }

        const token = decryptShopifyToken(business.shopifyAccessToken);
        const shop = business.shopifyDomain;

        /* ── Products ────────────────────────────────────────── */
        if (action === "products") {
            const products = await fetchShopifyProducts(shop, token, 100);
            return NextResponse.json({ connected: true, products, shop });
        }

        /* ── Orders ──────────────────────────────────────────── */
        if (action === "orders") {
            const orders = await fetchShopifyOrders(shop, token, 50);
            const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
            const totalOrders = orders.length;
            return NextResponse.json({ connected: true, orders, totalRevenue, totalOrders, shop });
        }

        /* ── Shop Info ───────────────────────────────────────── */
        if (action === "shop-info") {
            const info = await fetchShopInfo(shop, token);
            return NextResponse.json({ connected: true, shop: info });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("[Shopify API] GET error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Shopify request failed" },
            { status: 500 }
        );
    }
}

/* ── POST — Sync products, disconnect ──────────────────────────── */
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
        const { action, businessId } = body;

        /* ── Sync products to DB ─────────────────────────────── */
        if (action === "sync") {
            const business = await getShopifyBusiness(session.id, businessId);
            if (!business?.shopifyAccessToken || !business?.shopifyDomain) {
                return NextResponse.json({ error: "Shopify not connected" }, { status: 400 });
            }

            const token = decryptShopifyToken(business.shopifyAccessToken);
            const products = await fetchShopifyProducts(business.shopifyDomain, token, 250);

            // Upsert all products
            let synced = 0;
            for (const p of products) {
                await prisma.shopifyProduct.upsert({
                    where: {
                        businessId_shopifyId: {
                            businessId: business.id,
                            shopifyId: p.shopifyId,
                        },
                    },
                    create: {
                        businessId: business.id,
                        shopifyId: p.shopifyId,
                        title: p.title,
                        description: p.description,
                        productType: p.productType,
                        vendor: p.vendor,
                        status: p.status,
                        tags: p.tags,
                        handle: p.handle,
                        imageUrl: p.imageUrl,
                        price: p.price,
                        compareAtPrice: p.compareAtPrice,
                        sku: p.sku,
                        inventoryQty: p.inventoryQty,
                        syncedAt: new Date(),
                    },
                    update: {
                        title: p.title,
                        description: p.description,
                        productType: p.productType,
                        vendor: p.vendor,
                        status: p.status,
                        tags: p.tags,
                        handle: p.handle,
                        imageUrl: p.imageUrl,
                        price: p.price,
                        compareAtPrice: p.compareAtPrice,
                        sku: p.sku,
                        inventoryQty: p.inventoryQty,
                        syncedAt: new Date(),
                    },
                });
                synced++;
            }

            return NextResponse.json({ synced, total: products.length });
        }

        /* ── Disconnect Shopify ──────────────────────────────── */
        if (action === "disconnect") {
            const business = await getShopifyBusiness(session.id, businessId);
            if (!business) {
                return NextResponse.json({ error: "Business not found" }, { status: 404 });
            }

            await prisma.business.update({
                where: { id: business.id },
                data: {
                    shopifyDomain: null,
                    shopifyAccessToken: null,
                    shopifyConnected: false,
                },
            });

            // Clean up synced products
            await prisma.shopifyProduct.deleteMany({
                where: { businessId: business.id },
            });

            return NextResponse.json({ disconnected: true });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("[Shopify API] POST error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Shopify request failed" },
            { status: 500 }
        );
    }
}

/* ── Helpers ────────────────────────────────────────────────────── */

async function getShopifyBusiness(userId: string, businessId?: string | null) {
    if (businessId) {
        return prisma.business.findFirst({
            where: { id: businessId, userId },
        });
    }
    return prisma.business.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
}
