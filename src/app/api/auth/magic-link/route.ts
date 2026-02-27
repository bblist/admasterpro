/**
 * Magic Link Verification API Route
 *
 * GET /api/auth/magic-link?token=xxx&next=/dashboard/chat
 *
 * Verifies the magic link token, creates/finds the user, sets session,
 * and redirects to the app.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { signToken, verifyMagicLinkToken } from "@/lib/jwt";
import { sendWelcomeEmail } from "@/lib/email";
import { authLimiter, checkRateLimit } from "@/lib/rate-limit";

const APP_URL = process.env.NEXTAUTH_URL || "https://admasterai.nobleblocks.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function GET(req: NextRequest) {
    const rateLimited = checkRateLimit(req, authLimiter);
    if (rateLimited) return rateLimited;

    const token = req.nextUrl.searchParams.get("token");
    const next = req.nextUrl.searchParams.get("next") || "/dashboard/chat";

    if (!token) {
        return NextResponse.redirect(new URL("/login?error=missing_token", APP_URL));
    }

    // Verify the magic link token
    const email = await verifyMagicLinkToken(token);
    if (!email) {
        return NextResponse.redirect(new URL("/login?error=invalid_link", APP_URL));
    }

    try {
        // Upsert user
        const user = await prisma.user.upsert({
            where: { email },
            update: { lastActiveAt: new Date() },
            create: {
                email,
                name: email.split("@")[0],
                authMethod: "email",
                role: email === ADMIN_EMAIL ? "admin" : "user",
            },
        });

        // Ensure subscription exists
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);

        const existingSub = await prisma.subscription.findUnique({ where: { userId: user.id } });
        if (!existingSub) {
            await prisma.subscription.create({
                data: {
                    userId: user.id,
                    plan: "trial",
                    status: "trialing",
                    aiMessagesLimit: PLANS.trial.aiMessages,
                    campaignsLimit: PLANS.trial.campaigns,
                    adsAccountsLimit: PLANS.trial.adsAccounts,
                    currentPeriodEnd: trialEndDate,
                    trialEndsAt: trialEndDate,
                },
            });

            // Send welcome email for new users
            sendWelcomeEmail(email, user.name || email.split("@")[0]).catch(console.warn);
        }

        // Generate JWT session token
        const jwt = await signToken({
            id: user.id,
            email: user.email,
            name: user.name || email.split("@")[0],
            picture: user.picture || null,
            method: "email",
            hasAdsAccess: false,
        });

        // Validate redirect path
        const isSafeRedirect = /^\/[a-zA-Z]/.test(next) && !next.includes(":");
        const redirectTo = isSafeRedirect ? next : "/dashboard/chat";

        // Redirect — session cookie and session_init cookie handle auth transfer
        const response = NextResponse.redirect(new URL(redirectTo, APP_URL));

        response.cookies.set("session", jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/",
        });

        // Also set a non-httpOnly cookie so the client JS can pick up the token
        response.cookies.set("session_init", jwt, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60, // Very short-lived — just for client to capture
            path: "/",
        });

        return response;
    } catch (err) {
        console.error("[Auth/MagicLink] Error:", err);
        return NextResponse.redirect(new URL("/login?error=server_error", APP_URL));
    }
}
