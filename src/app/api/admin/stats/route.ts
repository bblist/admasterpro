import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";

// Admin API — returns real data from DB when available, demo fallback otherwise

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
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);

        // Run queries in parallel
        const [
            totalUsers,
            usersThisWeek,
            subscriptions,
            usageThisMonth,
            recentUsers,
            topCostUsers,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
            prisma.subscription.findMany(),
            prisma.usage.findMany({ where: { createdAt: { gte: startOfMonth } } }),
            prisma.user.findMany({
                orderBy: { createdAt: "desc" },
                take: 10,
                include: { subscription: true },
            }),
            prisma.usage.groupBy({
                by: ["userId"],
                _sum: { costUsd: true, totalTokens: true },
                _count: { id: true },
                where: { createdAt: { gte: startOfMonth } },
                orderBy: { _sum: { costUsd: "desc" } },
                take: 15,
            }),
        ]);

        // Calculate MRR
        const planPrices: Record<string, number> = { free: 0, trial: 0, starter: 49, pro: 149 };
        const mrr = subscriptions
            .filter((s: any) => s.status === "active" && s.plan !== "free" && s.plan !== "trial")
            .reduce((sum: number, s: any) => sum + (planPrices[s.plan] || 0), 0);

        // AI costs this month
        const totalAICost = usageThisMonth.reduce((sum: number, u: any) => sum + (u.costUsd || 0), 0);
        const totalQueries = usageThisMonth.length;
        const totalTokens = usageThisMonth.reduce((sum: number, u: any) => sum + u.totalTokens, 0);

        // Plan distribution
        const planCounts = { free: 0, trial: 0, starter: 0, pro: 0 };
        subscriptions.forEach((s: any) => {
            if (s.plan in planCounts) planCounts[s.plan as keyof typeof planCounts]++;
        });

        // Per-user cost breakdown for top spenders
        const userIds = topCostUsers.map((u: any) => u.userId);
        const usersForCosts = userIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: userIds } },
                include: { subscription: true },
            })
            : [];
        const userMap = new Map<string, (typeof usersForCosts)[number]>();
        for (const u of usersForCosts) userMap.set(u.id, u);

        const topSpenders = topCostUsers.map((tc: any) => {
            const user = userMap.get(tc.userId);
            const sub = user?.subscription;
            return {
                name: user?.name || user?.email || tc.userId,
                email: user?.email || "",
                plan: sub?.plan || "free",
                aiCost: tc._sum.costUsd || 0,
                queries: tc._count.id,
                totalTokens: tc._sum.totalTokens || 0,
                platformFee: planPrices[sub?.plan || "free"] || 0,
                margin: (planPrices[sub?.plan || "free"] || 0) - (tc._sum.costUsd || 0),
            };
        });

        // Recent signups
        const recentSignups = recentUsers.map((u: any) => ({
            name: u.name || u.email,
            email: u.email,
            plan: u.subscription?.plan || "free",
            joined: u.createdAt.toISOString(),
            status: u.subscription?.status || "active",
        }));

        return NextResponse.json({
            overview: {
                totalUsers,
                usersThisWeek,
                mrr,
                arr: mrr * 12,
                totalAICost: Math.round(totalAICost * 100) / 100,
                totalQueries,
                totalTokens,
                avgCostPerQuery: totalQueries > 0 ? Math.round((totalAICost / totalQueries) * 1000) / 1000 : 0,
                margin: Math.round((mrr - totalAICost) * 100) / 100,
            },
            planDistribution: planCounts,
            recentSignups,
            topSpenders,
        });
    } catch (error) {
        console.error("[Admin Stats] DB error:", error);
        // Return empty structure so UI can show "no data" instead of crash
        return NextResponse.json({
            overview: {
                totalUsers: 0, usersThisWeek: 0, mrr: 0, arr: 0,
                totalAICost: 0, totalQueries: 0, totalTokens: 0,
                avgCostPerQuery: 0, margin: 0,
            },
            planDistribution: { free: 0, trial: 0, starter: 0, pro: 0 },
            recentSignups: [],
            topSpenders: [],
            dbError: true,
        });
    }
}
