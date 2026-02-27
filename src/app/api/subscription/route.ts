import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);

    if (!session?.id) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const { prisma } = await import("@/lib/db");

        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { name: true, picture: true },
        });

        const subscription = await prisma.subscription.findUnique({
            where: { userId: session.id },
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
                trialEndsAt: null,
                userName: user?.name || session.name || "",
                userPicture: user?.picture || session.picture || null,
            });
        }

        return NextResponse.json({
            plan: subscription.plan,
            status: subscription.status,
            aiMessagesUsed: subscription.aiMessagesUsed,
            aiMessagesLimit: subscription.aiMessagesLimit,
            bonusTokens: subscription.bonusTokens,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
            trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
            userName: user?.name || session.name || "",
            userPicture: user?.picture || session.picture || null,
        });
    } catch (error) {
        console.error("[Subscription API] Error:", error);
        // Return 503 when DB is unavailable — don't return fake free-plan data
        return NextResponse.json(
            { error: "Service temporarily unavailable" },
            { status: 503 }
        );
    }
}
