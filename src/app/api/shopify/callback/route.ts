/**
 * Shopify OAuth Callback
 *
 * GET /api/shopify/callback?code=...&shop=...&hmac=...&state=...
 *
 * Handles the OAuth redirect from Shopify, exchanges the code for an
 * access token, saves it encrypted to the Business record, and redirects
 * the user back to the dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionDual } from "@/lib/session";
import {
    exchangeShopifyCode,
    encryptShopifyToken,
    verifyShopifyHmac,
    fetchShopInfo,
} from "@/lib/shopify";

export async function GET(req: NextRequest) {
    const session = await getSessionDual(req);
    const { searchParams } = new URL(req.url);

    const code = searchParams.get("code");
    const shop = searchParams.get("shop");
    const state = searchParams.get("state");
    const savedState = req.cookies.get("shopify_state")?.value;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Validate session
    if (!session) {
        return NextResponse.redirect(
            `${appUrl}/login?error=session_expired&redirect=/dashboard/settings`
        );
    }

    // Validate required params
    if (!code || !shop) {
        return NextResponse.redirect(
            `${appUrl}/dashboard/settings?shopify=error&reason=missing_params`
        );
    }

    // Validate state (CSRF protection)
    if (!state || state !== savedState) {
        return NextResponse.redirect(
            `${appUrl}/dashboard/settings?shopify=error&reason=invalid_state`
        );
    }

    // Verify HMAC
    if (!verifyShopifyHmac(searchParams)) {
        console.warn("[Shopify Callback] HMAC verification failed for shop:", shop);
        // Don't block in dev — HMAC might fail without proper secret
        if (process.env.NODE_ENV === "production") {
            return NextResponse.redirect(
                `${appUrl}/dashboard/settings?shopify=error&reason=hmac_failed`
            );
        }
    }

    try {
        // Exchange code for access token
        const accessToken = await exchangeShopifyCode(shop, code);

        // Fetch shop info to get the myshopify domain
        const shopInfo = await fetchShopInfo(shop, accessToken);

        // Find the user's active business (most recent)
        const business = await prisma.business.findFirst({
            where: { userId: session.id },
            orderBy: { createdAt: "desc" },
        });

        if (!business) {
            return NextResponse.redirect(
                `${appUrl}/dashboard/settings?shopify=error&reason=no_business`
            );
        }

        // Save encrypted token and shop domain
        await prisma.business.update({
            where: { id: business.id },
            data: {
                shopifyDomain: shopInfo.myshopifyDomain || shop,
                shopifyAccessToken: encryptShopifyToken(accessToken),
                shopifyConnected: true,
            },
        });

        // Clear the state cookie
        const response = NextResponse.redirect(
            `${appUrl}/dashboard/settings?shopify=connected&shop=${encodeURIComponent(shopInfo.name || shop)}`
        );
        response.cookies.delete("shopify_state");

        return response;
    } catch (error) {
        console.error("[Shopify Callback] Error:", error);
        return NextResponse.redirect(
            `${appUrl}/dashboard/settings?shopify=error&reason=token_exchange_failed`
        );
    }
}
