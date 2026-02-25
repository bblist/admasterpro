import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionDual } from "@/lib/session";

async function isAdmin(req: Request): Promise<boolean> {
    const session = await getSessionDual(req) as { email?: string } | null;
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
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    // Today's queries
    const todayQueries = await prisma.usage.count({
        where: { createdAt: { gte: todayStart } },
    });

    // Avg queries per user (this week)
    const weekQueries = await prisma.usage.count({
        where: { createdAt: { gte: weekAgo } },
    });
    const activeUsersWeek = await prisma.usage.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: weekAgo } },
    });
    const avgPerUser = activeUsersWeek.length > 0 ? (weekQueries / activeUsersWeek.length) : 0;

    // Usage by model (this week)
    const modelUsage = await prisma.usage.groupBy({
        by: ["model"],
        where: { createdAt: { gte: weekAgo } },
        _count: { id: true },
        _sum: { totalTokens: true, costUsd: true },
    });

    // Usage by type (feature usage this week)
    const typeUsage = await prisma.usage.groupBy({
        by: ["type"],
        where: { createdAt: { gte: weekAgo } },
        _count: { id: true },
    });
    const maxTypeCount = Math.max(1, ...typeUsage.map((t: any) => t._count.id));
    const featureUsage = typeUsage
        .map((t: any) => ({
            feature: formatType(t.type),
            usage: t._count.id,
            pct: Math.round((t._count.id / maxTypeCount) * 100),
        }))
        .sort((a: any, b: any) => b.usage - a.usage);

    // Top queries from ChatMessage (user role, last week)
    const recentMessages = await prisma.chatMessage.findMany({
        where: { role: "user", createdAt: { gte: weekAgo } },
        select: { content: true },
        orderBy: { createdAt: "desc" },
        take: 500,
    });

    // Simple frequency count of first 50 chars
    const queryFreq = new Map<string, number>();
    for (const msg of recentMessages) {
        const key = (msg.content || "").slice(0, 80).trim().toLowerCase();
        if (key.length > 5) {
            queryFreq.set(key, (queryFreq.get(key) || 0) + 1);
        }
    }
    const topQueries = Array.from(queryFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([query, count]) => ({ query, count }));

    // User engagement: total users, active this week, active today
    const totalUsers = await prisma.user.count();
    const activeToday = await prisma.usage.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: todayStart } },
    });

    // AI metrics
    const weekCost = modelUsage.reduce((s: number, m: any) => s + (m._sum.costUsd || 0), 0);
    const weekTokens = modelUsage.reduce((s: number, m: any) => s + (m._sum.totalTokens || 0), 0);

    return NextResponse.json({
        todayQueries,
        weekQueries,
        avgPerUser: Math.round(avgPerUser * 10) / 10,
        activeUsersWeek: activeUsersWeek.length,
        activeTodayCount: activeToday.length,
        totalUsers,
        modelUsage: modelUsage.map((m: any) => ({
            model: m.model,
            queries: m._count.id,
            tokens: m._sum.totalTokens || 0,
            cost: m._sum.costUsd || 0,
        })),
        featureUsage,
        topQueries,
        weekCost,
        weekTokens,
    });
}

function formatType(type: string): string {
    const map: Record<string, string> = {
        chat: "AI Chat / Ask Questions",
        campaign: "Campaign Analysis",
        keyword: "Keyword Analysis",
        draft: "Ad Drafts",
        autopilot: "Auto-Pilot Actions",
        audit: "Ad Audit",
    };
    return map[type] || type.charAt(0).toUpperCase() + type.slice(1);
}
