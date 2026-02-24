/**
 * Google Ads Accounts API
 *
 * GET  — List accessible Google Ads accounts for the current user
 * POST — Link a Google Ads account to a business
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionDual } from "@/lib/session";
import { listAccessibleAccounts, isGoogleAdsConfigured } from "@/lib/google-ads";

export async function GET(req: NextRequest) {
    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isGoogleAdsConfigured()) {
        return NextResponse.json({ error: "Google Ads API not configured" }, { status: 503 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { refreshToken: true },
        });

        if (!user?.refreshToken) {
            return NextResponse.json({
                accounts: [],
                connected: false,
                message: "No Google Ads account connected. Please sign in with Google to connect your account.",
            });
        }

        const accounts = await listAccessibleAccounts(user.refreshToken);

        // Also fetch user's linked businesses
        const businesses = await prisma.business.findMany({
            where: { userId: session.id },
            select: { id: true, name: true, googleAdsId: true },
        });

        return NextResponse.json({
            accounts,
            businesses,
            connected: true,
        });
    } catch (error) {
        console.error("[GoogleAds] Accounts error:", error);
        return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { businessId, googleAdsCustomerId } = await req.json();

        if (!businessId || !googleAdsCustomerId) {
            return NextResponse.json({ error: "businessId and googleAdsCustomerId required" }, { status: 400 });
        }

        // Verify business belongs to user
        const business = await prisma.business.findFirst({
            where: { id: businessId, userId: session.id },
        });

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Link Google Ads account
        await prisma.business.update({
            where: { id: businessId },
            data: { googleAdsId: googleAdsCustomerId },
        });

        // Update user hasAdsAccess flag
        await prisma.user.update({
            where: { id: session.id },
            data: { hasAdsAccess: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[GoogleAds] Link error:", error);
        return NextResponse.json({ error: "Failed to link account" }, { status: 500 });
    }
}
