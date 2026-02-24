import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionDual } from "@/lib/session";

async function isAdmin(req: Request): Promise<boolean> {
    const session = await getSessionDual(req);
    if (!session?.email) return false;
    return session.email === process.env.ADMIN_EMAIL || session.email === "admin@nobleblocks.com";
}

export async function GET(req: Request) {
    if (!(await isAdmin(req))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const planPrices: Record<string, number> = { starter: 49, pro: 149 };

    // Current MRR
    const activeSubs = await prisma.subscription.findMany({
        where: { status: "active" },
        include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    });

    const currentMRR = activeSubs.reduce((s: number, sub: any) => s + (planPrices[sub.plan] || 0), 0);
    const paidUsers = activeSubs.length;
    const totalUsers = await prisma.user.count();
    const freeUsers = totalUsers - paidUsers;

    // Plan breakdown
    const planCounts: Record<string, number> = { free: freeUsers, starter: 0, pro: 0 };
    for (const sub of activeSubs) {
        planCounts[sub.plan] = (planCounts[sub.plan] || 0) + 1;
    }

    const planBreakdown = [
        { plan: "Free", users: planCounts.free, revenue: 0, color: "bg-gray-600" },
        { plan: "Starter ($49/mo)", users: planCounts.starter, revenue: planCounts.starter * 49, color: "bg-blue-600" },
        { plan: "Pro ($149/mo)", users: planCounts.pro, revenue: planCounts.pro * 149, color: "bg-purple-600" },
    ];

    // Token purchases
    const tokenPurchases = await prisma.tokenPurchase.findMany({
        where: { createdAt: { gte: monthStart } },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
    });
    const tokenRevenue = tokenPurchases.reduce((s: number, t: any) => s + (t.amount || 0), 0);

    // Top revenue clients (by total subscription time * price)
    const topClients = activeSubs
        .map((sub: any) => {
            const months = Math.max(1, Math.ceil((now.getTime() - new Date(sub.createdAt).getTime()) / (30 * 86400000)));
            const mrr = planPrices[sub.plan] || 0;
            return {
                name: sub.user?.name || "Unknown",
                plan: sub.plan,
                mrr,
                ltv: mrr * months,
                months,
            };
        })
        .sort((a: any, b: any) => b.ltv - a.ltv)
        .slice(0, 8);

    // Recent subscription events — users who signed up this month
    const recentUsers = await prisma.user.findMany({
        where: { createdAt: { gte: monthStart } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { name: true, createdAt: true, subscription: { select: { plan: true } } },
    });

    const recentTransactions = recentUsers.map((u: any) => ({
        date: new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        description: `New ${u.subscription?.plan || "free"} signup — ${u.name}`,
        amount: planPrices[u.subscription?.plan] || 0,
        type: "subscription",
    }));

    // Add token purchase transactions
    for (const tp of tokenPurchases.slice(0, 5)) {
        recentTransactions.push({
            date: new Date(tp.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            description: `Token top-up — ${tp.user?.name || "Unknown"}`,
            amount: tp.amount || 0,
            type: "topup",
        });
    }

    recentTransactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Monthly stats (simple: new users, churned approximation)
    const newSubsThisMonth = await prisma.user.count({
        where: { createdAt: { gte: monthStart } },
    });

    const conversionRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100) : 0;
    const arpu = paidUsers > 0 ? currentMRR / paidUsers : 0;
    const arr = currentMRR * 12;

    return NextResponse.json({
        currentMRR,
        arr,
        paidUsers,
        totalUsers,
        conversionRate,
        arpu,
        planBreakdown,
        topClients,
        recentTransactions: recentTransactions.slice(0, 8),
        tokenRevenue,
        newSubsThisMonth,
    });
}
