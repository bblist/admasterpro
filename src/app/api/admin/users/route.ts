/**
 * Admin Users API
 *
 * GET — Returns all users with subscription + usage data from the database
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";

async function isAdmin(req: NextRequest): Promise<boolean> {
    const session = await getSessionDual(req);
    if (!session?.email) return false;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return false;
    return session.email === adminEmail;
}

export async function GET(req: NextRequest) {
    if (!(await isAdmin(req))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { prisma } = await import("@/lib/db");

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get all users with their subscriptions
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                subscription: true,
            },
        });

        // Get this month's usage grouped by user
        const usageByUser = await prisma.usage.groupBy({
            by: ["userId"],
            _sum: { costUsd: true, totalTokens: true, inputTokens: true, outputTokens: true },
            _count: { id: true },
            where: { createdAt: { gte: startOfMonth } },
        });

        const usageMap = new Map<string, {
            queries: number;
            totalTokens: number;
            costUsd: number;
        }>();
        for (const u of usageByUser) {
            usageMap.set(u.userId, {
                queries: u._count.id,
                totalTokens: u._sum.totalTokens || 0,
                costUsd: u._sum.costUsd || 0,
            });
        }

        // Get all-time usage per user
        const allTimeUsage = await prisma.usage.groupBy({
            by: ["userId"],
            _sum: { costUsd: true, totalTokens: true },
            _count: { id: true },
        });
        const allTimeMap = new Map<string, {
            queries: number;
            totalTokens: number;
            costUsd: number;
        }>();
        for (const u of allTimeUsage) {
            allTimeMap.set(u.userId, {
                queries: u._count.id,
                totalTokens: u._sum.totalTokens || 0,
                costUsd: u._sum.costUsd || 0,
            });
        }

        const planPrices: Record<string, number> = { free: 0, trial: 0, starter: 49, pro: 149 };

        const result = users.map((user: any) => {
            const sub = user.subscription;
            const monthUsage = usageMap.get(user.id);
            const lifetime = allTimeMap.get(user.id);
            const plan = sub?.plan || "free";
            const monthCost = monthUsage?.costUsd || 0;
            const monthFee = planPrices[plan] || 0;

            return {
                id: user.id,
                name: user.name || user.email.split("@")[0],
                email: user.email,
                picture: user.picture,
                authMethod: user.authMethod,
                plan,
                status: sub?.status || "active",
                hasAdsAccess: user.hasAdsAccess,
                createdAt: user.createdAt.toISOString(),
                lastActiveAt: user.lastActiveAt.toISOString(),
                // This month
                monthQueries: monthUsage?.queries || 0,
                monthTokens: monthUsage?.totalTokens || 0,
                monthAiCost: Math.round(monthCost * 100) / 100,
                monthRevenue: monthFee,
                monthMargin: Math.round((monthFee - monthCost) * 100) / 100,
                // Subscription details
                aiMessagesUsed: sub?.aiMessagesUsed || 0,
                aiMessagesLimit: sub?.aiMessagesLimit || 10,
                bonusTokens: sub?.bonusTokens || 0,
                // All-time
                totalQueries: lifetime?.queries || 0,
                totalTokens: lifetime?.totalTokens || 0,
                totalAiCost: Math.round((lifetime?.costUsd || 0) * 100) / 100,
            };
        });

        // Summary stats
        const totalUsers = result.length;
        const activeUsers = result.filter((u: any) => u.status === "active").length;
        const paidUsers = result.filter((u: any) => u.plan !== "free" && u.plan !== "trial").length;
        const totalMRR = result.reduce((s: number, u: any) => s + u.monthRevenue, 0);
        const totalMonthCost = result.reduce((s: number, u: any) => s + u.monthAiCost, 0);
        const planDist = {
            free: result.filter((u: any) => u.plan === "free").length,
            trial: result.filter((u: any) => u.plan === "trial").length,
            starter: result.filter((u: any) => u.plan === "starter").length,
            pro: result.filter((u: any) => u.plan === "pro").length,
        };

        return NextResponse.json({
            users: result,
            summary: {
                totalUsers,
                activeUsers,
                paidUsers,
                totalMRR,
                totalMonthCost: Math.round(totalMonthCost * 100) / 100,
                totalMargin: Math.round((totalMRR - totalMonthCost) * 100) / 100,
                planDistribution: planDist,
            },
        });
    } catch (error) {
        console.error("[Admin Users API] Error:", error);
        return NextResponse.json({
            users: [],
            summary: {
                totalUsers: 0, activeUsers: 0, paidUsers: 0,
                totalMRR: 0, totalMonthCost: 0, totalMargin: 0,
                planDistribution: { free: 0, trial: 0, starter: 0, pro: 0 },
            },
            dbError: true,
        });
    }
}
