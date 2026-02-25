/**
 * Google Ads Campaigns API
 *
 * GET  — List campaigns with performance metrics
 * POST — Pause/enable a campaign
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionDual } from "@/lib/session";
import { checkCSRF } from "@/lib/csrf";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { getCampaigns, mutateCampaign, isGoogleAdsConfigured } from "@/lib/google-ads";

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
            return NextResponse.json({ campaigns: [], connected: false });
        }

        // Get Google Ads customer ID from the active business
        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");
        const dateRange = searchParams.get("dateRange") || "LAST_30_DAYS";

        let customerId: string | null = null;

        if (businessId) {
            const business = await prisma.business.findFirst({
                where: { id: businessId, userId: session.id },
                select: { googleAdsId: true },
            });
            customerId = business?.googleAdsId || null;
        } else {
            // Try first business with a Google Ads ID
            const business = await prisma.business.findFirst({
                where: { userId: session.id, googleAdsId: { not: null } },
                select: { googleAdsId: true },
            });
            customerId = business?.googleAdsId || null;
        }

        if (!customerId) {
            return NextResponse.json({
                campaigns: [],
                connected: true,
                message: "No Google Ads account linked. Go to Settings to connect one.",
            });
        }

        const campaigns = await getCampaigns(user.refreshToken, customerId, dateRange);

        return NextResponse.json({ campaigns, connected: true });
    } catch (error) {
        console.error("[GoogleAds] Campaigns error:", error);
        return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
    }
}

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
        const { campaignId, operation, businessId } = await req.json();

        if (!campaignId || !operation || !["pause", "enable"].includes(operation)) {
            return NextResponse.json({ error: "campaignId and operation (pause/enable) required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { refreshToken: true },
        });

        if (!user?.refreshToken) {
            return NextResponse.json({ error: "Not connected to Google Ads" }, { status: 400 });
        }

        // Get customer ID
        const business = await prisma.business.findFirst({
            where: businessId
                ? { id: businessId, userId: session.id }
                : { userId: session.id, googleAdsId: { not: null } },
            select: { googleAdsId: true },
        });

        if (!business?.googleAdsId) {
            return NextResponse.json({ error: "No Google Ads account linked" }, { status: 400 });
        }

        const success = await mutateCampaign(
            user.refreshToken,
            business.googleAdsId,
            operation,
            campaignId
        );

        return NextResponse.json({ success });
    } catch (error) {
        console.error("[GoogleAds] Campaign mutate error:", error);
        return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
    }
}
