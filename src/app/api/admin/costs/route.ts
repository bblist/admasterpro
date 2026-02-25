import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionDual } from "@/lib/session";

async function isAdmin(req: Request): Promise<boolean> {
    const session = await getSessionDual(req);
    if (!session?.email) return false;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return false;
    return session.email === adminEmail;
}

export async function GET(req: Request) {
    if (!(await isAdmin(req))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Per-user costs this month with model breakdown
    const usageByUser = await prisma.usage.groupBy({
        by: ["userId", "model"],
        where: { createdAt: { gte: monthStart } },
        _sum: { costUsd: true, totalTokens: true },
        _count: { id: true },
    });

    // Daily costs for last 14 days (limit to prevent OOM)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
    const dailyUsage = await prisma.usage.findMany({
        where: { createdAt: { gte: twoWeeksAgo } },
        select: { createdAt: true, costUsd: true, model: true, totalTokens: true },
        take: 10000,
    });

    // Get user info
    const userIds = [...new Set(usageByUser.map((u: any) => u.userId))];
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
    });
    const userMap: Map<string, any> = new Map(users.map((u: any) => [u.id, u]));

    // Get subscriptions for revenue calc
    const subs = await prisma.subscription.findMany({
        where: { userId: { in: userIds }, status: "active" },
        select: { userId: true, plan: true },
    });
    const subMap: Map<string, any> = new Map(subs.map((s: any) => [s.userId, s]));

    const planPrices: Record<string, number> = { free: 0, trial: 0, starter: 49, pro: 149 };

    // Build per-client cost data
    const clientMap = new Map<string, any>();
    for (const row of usageByUser) {
        const uid = row.userId;
        if (!clientMap.has(uid)) {
            const user = userMap.get(uid);
            const sub = subMap.get(uid);
            const plan = sub?.plan || "free";
            const planPrice = planPrices[plan] || 0;
            clientMap.set(uid, {
                id: uid,
                name: user?.name || "Unknown",
                email: user?.email || "",
                plan,
                models: {} as Record<string, { queries: number; tokens: number; cost: number }>,
                totalCost: 0,
                totalQueries: 0,
                totalTokens: 0,
                platformFee: planPrice,
                margin: planPrice,
            });
        }
        const client = clientMap.get(uid)!;
        const model = row.model || "unknown";
        if (!client.models[model]) {
            client.models[model] = { queries: 0, tokens: 0, cost: 0 };
        }
        client.models[model].queries += row._count.id;
        client.models[model].tokens += row._sum.totalTokens || 0;
        client.models[model].cost += row._sum.costUsd || 0;
        client.totalCost += row._sum.costUsd || 0;
        client.totalQueries += row._count.id;
        client.totalTokens += row._sum.totalTokens || 0;
        client.margin = client.platformFee - client.totalCost;
    }

    const clients = Array.from(clientMap.values()).sort((a: any, b: any) => b.totalCost - a.totalCost);

    // Build daily cost data
    const dailyMap = new Map<string, { date: string; cost: number; queries: number; tokens: number; models: Record<string, number> }>();
    for (const u of dailyUsage) {
        const dateKey = u.createdAt.toISOString().slice(0, 10);
        if (!dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, { date: dateKey, cost: 0, queries: 0, tokens: 0, models: {} });
        }
        const day = dailyMap.get(dateKey)!;
        day.cost += u.costUsd || 0;
        day.queries += 1;
        day.tokens += u.totalTokens || 0;
        const model = u.model || "unknown";
        day.models[model] = (day.models[model] || 0) + (u.costUsd || 0);
    }
    const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Totals
    const totalCost = clients.reduce((s: number, c: any) => s + c.totalCost, 0);
    const totalRevenue = clients.reduce((s: number, c: any) => s + c.platformFee, 0);
    const totalMargin = clients.reduce((s: number, c: any) => s + c.margin, 0);
    const totalQueries = clients.reduce((s: number, c: any) => s + c.totalQueries, 0);
    const totalTokens = clients.reduce((s: number, c: any) => s + c.totalTokens, 0);

    // Model breakdown
    const modelTotals: Record<string, { queries: number; tokens: number; cost: number }> = {};
    for (const c of clients) {
        for (const [model, data] of Object.entries(c.models) as [string, any][]) {
            if (!modelTotals[model]) modelTotals[model] = { queries: 0, tokens: 0, cost: 0 };
            modelTotals[model].queries += data.queries;
            modelTotals[model].tokens += data.tokens;
            modelTotals[model].cost += data.cost;
        }
    }

    const unprofitable = clients.filter((c: any) => c.margin < 0);

    return NextResponse.json({
        clients,
        daily,
        totals: {
            totalCost,
            totalRevenue,
            totalMargin,
            totalQueries,
            totalTokens,
            marginPct: totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100) : 0,
            avgCostPerQuery: totalQueries > 0 ? totalCost / totalQueries : 0,
        },
        modelBreakdown: modelTotals,
        unprofitableCount: unprofitable.length,
    });
}
