/**
 * Notification Cron API
 *
 * GET /api/admin/notifications/cron?type=weekly&secret=...
 *
 * Triggered by a server cron job (PM2 or system crontab).
 * Reads user notification preferences and sends emails accordingly.
 *
 * Types:
 *   - weekly  → sends weekly performance reports to opted-in users
 *
 * Secured by CRON_SECRET env var.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWeeklyReport, WeeklyReportData } from "@/lib/email";

const CRON_SECRET = process.env.CRON_SECRET || process.env.ADMIN_SECRET || "";

export async function GET(req: NextRequest) {
    // Verify secret
    const secret = req.nextUrl.searchParams.get("secret");
    if (!secret || secret !== CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const type = req.nextUrl.searchParams.get("type") || "weekly";

    if (type === "weekly") {
        return handleWeeklyReports();
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

async function handleWeeklyReports() {
    try {
        // 1. Get all users who have settings with weeklyReport enabled
        const settingsRecords = await prisma.usage.findMany({
            where: { type: "settings" },
            select: { userId: true, metadata: true },
        });

        // Filter to users with weeklyReport enabled (or default on)
        const eligibleUserIds: string[] = [];
        for (const rec of settingsRecords) {
            try {
                const settings = JSON.parse(rec.metadata || "{}");
                // Default is true, so only skip if explicitly false
                if (settings.notifications?.weeklyReports === false ||
                    settings.notifications?.weeklyReport === false) {
                    continue;
                }
                if (settings.notifications?.email === false) {
                    continue; // email notifications disabled entirely
                }
                eligibleUserIds.push(rec.userId);
            } catch {
                // Parse error — include user (defaults to on)
                eligibleUserIds.push(rec.userId);
            }
        }

        // 2. Also include users who have NO settings record (defaults are all-on)
        const usersWithSettings = new Set(settingsRecords.map(r => r.userId));
        const allUsers = await prisma.user.findMany({
            select: { id: true },
        });
        for (const u of allUsers) {
            if (!usersWithSettings.has(u.id)) {
                eligibleUserIds.push(u.id);
            }
        }

        // Deduplicate
        const userIds = [...new Set(eligibleUserIds)];

        // 3. Get users with Google Ads connected (has business with googleAdsId)
        const usersWithAds = await prisma.user.findMany({
            where: {
                id: { in: userIds },
                businesses: { some: { googleAdsId: { not: null } } },
            },
            select: {
                id: true,
                email: true,
                name: true,
                businesses: {
                    where: { googleAdsId: { not: null } },
                    select: { googleAdsId: true, name: true },
                    take: 1,
                },
            },
        });

        let sent = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const user of usersWithAds) {
            try {
                const biz = user.businesses[0];
                if (!biz?.googleAdsId) continue;

                // Fetch 7-day performance from Google Ads
                const perfData = await fetchWeeklyPerformance(biz.googleAdsId);
                if (!perfData) continue;

                await sendWeeklyReport(user.email, user.name || "there", perfData);
                sent++;
            } catch (err: any) {
                failed++;
                errors.push(`${user.email}: ${err.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            type: "weekly",
            eligible: userIds.length,
            withAds: usersWithAds.length,
            sent,
            failed,
            errors: errors.slice(0, 5),
            timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        console.error("[Cron] Weekly reports error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * Fetch 7-day Google Ads performance for a given customer ID.
 * Returns null if unavailable.
 */
async function fetchWeeklyPerformance(googleAdsId: string): Promise<WeeklyReportData | null> {
    try {
        // Use internal API to get performance data
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
        const secret = CRON_SECRET;

        // Fetch this week
        const thisWeekRes = await fetch(
            `${baseUrl}/api/google-ads/performance?type=summary&dateRange=LAST_7_DAYS&customerId=${googleAdsId}&cronSecret=${secret}`,
            { cache: "no-store" }
        );

        if (!thisWeekRes.ok) return null;
        const thisWeek = await thisWeekRes.json();
        const data = thisWeek.data;
        if (!data) return null;

        // Build report data with safe fallbacks
        const report: WeeklyReportData = {
            impressions: data.impressions || 0,
            clicks: data.clicks || 0,
            cost: data.cost || 0,
            conversions: data.conversions || 0,
            ctr: data.clicks && data.impressions ? data.clicks / data.impressions : 0,
            costPerConversion: data.conversions ? (data.cost || 0) / data.conversions : 0,
            topCampaign: data.topCampaign || "N/A",
            topKeyword: data.topKeyword || "N/A",
            weekOverWeekCost: data.weekOverWeekCost || 0,
        };

        return report;
    } catch (err) {
        console.error(`[Cron] Failed to fetch performance for ${googleAdsId}:`, err);
        return null;
    }
}
