import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    // Parse user from session cookie
    let userId: string | null = null;
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
        const match = cookieHeader.match(/session=([^;]+)/);
        if (match) {
            try {
                const session = JSON.parse(decodeURIComponent(match[1]));
                userId = session.id || null;
            } catch { /* ignore */ }
        }
    }

    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const { prisma } = await import("@/lib/db");

        const subscription = await prisma.subscription.findUnique({
            where: { userId },
        });

        if (!subscription) {
            // Return free plan defaults
            return NextResponse.json({
                plan: "free",
                status: "active",
                aiMessagesUsed: 0,
                aiMessagesLimit: 10,
                bonusTokens: 0,
                currentPeriodEnd: null,
            });
        }

        return NextResponse.json({
            plan: subscription.plan,
            status: subscription.status,
            aiMessagesUsed: subscription.aiMessagesUsed,
            aiMessagesLimit: subscription.aiMessagesLimit,
            bonusTokens: subscription.bonusTokens,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
        });
    } catch (error) {
        console.error("[Subscription API] Error:", error);
        // Graceful fallback when DB is unavailable
        return NextResponse.json({
            plan: "free",
            status: "active",
            aiMessagesUsed: 0,
            aiMessagesLimit: 10,
            bonusTokens: 0,
            currentPeriodEnd: null,
        });
    }
}
