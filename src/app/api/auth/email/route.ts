/**
 * Email Sign-In API Route
 *
 * Sets an httpOnly session cookie for email-based authentication.
 * This is a lightweight auth method — no password verification (demo mode).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { signToken } from "@/lib/jwt";
import { authLimiter, checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    const rateLimited = checkRateLimit(req, authLimiter);
    if (rateLimited) return rateLimited;

    try {
        const { email } = await req.json();

        if (!email || !email.includes("@")) {
            return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
        }

        // Persist user to database
        let userId = "email_" + email.replace(/[^a-z0-9]/gi, "_");
        try {
            const user = await prisma.user.upsert({
                where: { email },
                update: { lastActiveAt: new Date() },
                create: {
                    email,
                    name: email.split("@")[0],
                    authMethod: "email",
                },
            });

            // Ensure subscription record exists — new users get 7-day trial
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 7);

            await prisma.subscription.upsert({
                where: { userId: user.id },
                update: {},
                create: {
                    userId: user.id,
                    plan: "trial",
                    status: "trialing",
                    aiMessagesLimit: PLANS.trial.aiMessages,
                    campaignsLimit: PLANS.trial.campaigns,
                    adsAccountsLimit: PLANS.trial.adsAccounts,
                    currentPeriodEnd: trialEndDate,
                },
            });

            userId = user.id;
        } catch (dbError) {
            console.warn("[Auth/Email] Database not available:", dbError);
        }

        // Generate JWT token for localStorage-based auth (cookie fallback)
        const sessionData = {
            id: userId,
            email,
            name: email.split("@")[0],
            picture: null,
            method: "email" as const,
            hasAdsAccess: false,
        };
        const jwt = await signToken(sessionData);

        const response = NextResponse.json({ success: true, token: jwt });

        // Also set session cookie (dual auth — cookie + token)
        response.cookies.set("session", JSON.stringify({
            ...sessionData,
            authenticated: true,
        }), {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return response;
    } catch {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
