/**
 * Settings API
 *
 * GET  — Fetch user settings
 * POST — Update user settings
 *
 * Settings are stored as a JSON blob in the user's subscription record.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionDual } from "@/lib/session";
import { checkCSRF } from "@/lib/csrf";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";

interface UserSettings {
    autoPilot: boolean;
    budgetLimit: number;
    notifications: {
        email: boolean;
        budgetAlerts: boolean;
        weeklyReports: boolean;
        performanceAlerts: boolean;
        dailySummary: boolean;
        summaryTime: string;
    };
    safetyRules: {
        requireApproval: boolean;
        maxDailyBudget: number;
        pauseLowPerformers: boolean;
    };
}

const DEFAULT_SETTINGS: UserSettings = {
    autoPilot: false,
    budgetLimit: 0,
    notifications: {
        email: true,
        budgetAlerts: true,
        weeklyReports: true,
        performanceAlerts: true,
        dailySummary: false,
        summaryTime: "09:00",
    },
    safetyRules: {
        requireApproval: true,
        maxDailyBudget: 500,
        pauseLowPerformers: false,
    },
};

export async function GET(req: NextRequest) {
    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: {
                id: true,
                email: true,
                name: true,
                hasAdsAccess: true,
                subscription: {
                    select: {
                        plan: true,
                        status: true,
                        aiMessagesUsed: true,
                        aiMessagesLimit: true,
                        bonusTokens: true,
                        currentPeriodStart: true,
                        currentPeriodEnd: true,
                        cancelAtPeriodEnd: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get businesses
        const businesses = await prisma.business.findMany({
            where: { userId: session.id },
            select: { id: true, name: true, googleAdsId: true, website: true, industry: true },
        });

        // Parse settings from user's metadata or use defaults
        // Store settings as a Usage record with type="settings" and metadata=JSON
        let settings = DEFAULT_SETTINGS;
        try {
            const settingsRecord = await prisma.usage.findFirst({
                where: { userId: session.id, type: "settings" },
                orderBy: { createdAt: "desc" },
            });
            if (settingsRecord?.metadata) {
                settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settingsRecord.metadata) };
            }
        } catch { /* use defaults */ }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                hasAdsAccess: user.hasAdsAccess,
            },
            subscription: user.subscription || {
                plan: "free",
                status: "active",
                aiMessagesUsed: 0,
                aiMessagesLimit: 10,
                bonusTokens: 0,
            },
            businesses,
            settings,
        });
    } catch (error) {
        console.error("[Settings] GET error:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
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
        const updates = await req.json();

        // Validate settings
        const budgetLimit = Number(updates.budgetLimit) || 0;
        const maxDailyBudget = Number(updates.safetyRules?.maxDailyBudget) || 500;

        const settings: UserSettings = {
            autoPilot: Boolean(updates.autoPilot),
            budgetLimit: Math.max(0, Math.min(1_000_000, budgetLimit)),
            notifications: {
                email: updates.notifications?.email !== false,
                budgetAlerts: updates.notifications?.budgetAlerts !== false,
                weeklyReports: (updates.notifications?.weeklyReports ?? updates.notifications?.weeklyReport) !== false,
                performanceAlerts: (updates.notifications?.performanceAlerts ?? updates.notifications?.instantAlerts) !== false,
                dailySummary: updates.notifications?.dailySummary !== false,
                summaryTime: updates.notifications?.summaryTime || "09:00",
            },
            safetyRules: {
                requireApproval: updates.safetyRules?.requireApproval !== false,
                maxDailyBudget: Math.max(0, Math.min(100_000, maxDailyBudget)),
                pauseLowPerformers: Boolean(updates.safetyRules?.pauseLowPerformers),
            },
        };

        // Upsert settings — find existing or create, preventing row accumulation
        const existing = await prisma.usage.findFirst({
            where: { userId: session.id, type: "settings" },
            select: { id: true },
        });

        if (existing) {
            await prisma.usage.update({
                where: { id: existing.id },
                data: { metadata: JSON.stringify(settings) },
            });
        } else {
            await prisma.usage.create({
                data: {
                    userId: session.id,
                    type: "settings",
                    metadata: JSON.stringify(settings),
                },
            });
        }

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        console.error("[Settings] POST error:", error);
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
