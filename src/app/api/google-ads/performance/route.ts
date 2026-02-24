/**
 * Google Ads Performance API
 *
 * GET — Fetch performance data (daily metrics, account summary, search terms, calls)
 *
 * Query params:
 *   type       — "daily" | "summary" | "search-terms" | "calls" (default: "daily")
 *   businessId — optional business ID
 *   days       — number of days for daily metrics (default: 30)
 *   dateRange  — GAQL date range (default: LAST_30_DAYS)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionDual } from "@/lib/session";
import {
    getDailyPerformance,
    getAccountSummary,
    getSearchTerms,
    getCallDetails,
    isGoogleAdsConfigured,
} from "@/lib/google-ads";

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
            return NextResponse.json({ data: null, connected: false });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "daily";
        const businessId = searchParams.get("businessId");
        const days = parseInt(searchParams.get("days") || "30");
        const dateRange = searchParams.get("dateRange") || "LAST_30_DAYS";

        // Resolve customer ID
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
                data: null,
                connected: true,
                message: "No Google Ads account linked.",
            });
        }

        switch (type) {
            case "daily": {
                const data = await getDailyPerformance(user.refreshToken, customerId, days);
                return NextResponse.json({ data, connected: true });
            }
            case "summary": {
                const data = await getAccountSummary(user.refreshToken, customerId, dateRange);
                return NextResponse.json({ data, connected: true });
            }
            case "search-terms": {
                const data = await getSearchTerms(user.refreshToken, customerId, dateRange);
                return NextResponse.json({ data, connected: true });
            }
            case "calls": {
                const data = await getCallDetails(user.refreshToken, customerId, dateRange);
                return NextResponse.json({ data, connected: true });
            }
            default:
                return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }
    } catch (error) {
        console.error("[GoogleAds] Performance error:", error);
        return NextResponse.json({ error: "Failed to fetch performance data" }, { status: 500 });
    }
}
