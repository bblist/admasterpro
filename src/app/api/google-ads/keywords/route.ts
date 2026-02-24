/**
 * Google Ads Keywords API
 *
 * GET  — List keywords with performance metrics
 * POST — Pause/enable/remove a keyword
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionDual } from "@/lib/session";
import { getKeywords, mutateKeyword, isGoogleAdsConfigured } from "@/lib/google-ads";

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
            return NextResponse.json({ keywords: [], connected: false });
        }

        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");
        const dateRange = searchParams.get("dateRange") || "LAST_30_DAYS";
        const campaignId = searchParams.get("campaignId") || undefined;

        let customerId: string | null = null;

        if (businessId) {
            const business = await prisma.business.findFirst({
                where: { id: businessId, userId: session.id },
                select: { googleAdsId: true },
            });
            customerId = business?.googleAdsId || null;
        } else {
            const business = await prisma.business.findFirst({
                where: { userId: session.id, googleAdsId: { not: null } },
                select: { googleAdsId: true },
            });
            customerId = business?.googleAdsId || null;
        }

        if (!customerId) {
            return NextResponse.json({
                keywords: [],
                connected: true,
                message: "No Google Ads account linked.",
            });
        }

        const keywords = await getKeywords(user.refreshToken, customerId, dateRange, campaignId);

        return NextResponse.json({ keywords, connected: true });
    } catch (error) {
        console.error("[GoogleAds] Keywords error:", error);
        return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { adGroupId, criterionId, operation, businessId } = await req.json();

        if (!adGroupId || !criterionId || !operation || !["pause", "enable", "remove"].includes(operation)) {
            return NextResponse.json({
                error: "adGroupId, criterionId, and operation (pause/enable/remove) required",
            }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { refreshToken: true },
        });

        if (!user?.refreshToken) {
            return NextResponse.json({ error: "Not connected to Google Ads" }, { status: 400 });
        }

        const business = await prisma.business.findFirst({
            where: businessId
                ? { id: businessId, userId: session.id }
                : { userId: session.id, googleAdsId: { not: null } },
            select: { googleAdsId: true },
        });

        if (!business?.googleAdsId) {
            return NextResponse.json({ error: "No Google Ads account linked" }, { status: 400 });
        }

        const success = await mutateKeyword(
            user.refreshToken,
            business.googleAdsId,
            operation,
            adGroupId,
            criterionId
        );

        return NextResponse.json({ success });
    } catch (error) {
        console.error("[GoogleAds] Keyword mutate error:", error);
        return NextResponse.json({ error: "Failed to update keyword" }, { status: 500 });
    }
}
