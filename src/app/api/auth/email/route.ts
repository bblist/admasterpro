/**
 * Email Sign-In API Route
 *
 * Sets an httpOnly session cookie for email-based authentication.
 * This is a lightweight auth method — no password verification (demo mode).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/plans";

export async function POST(req: NextRequest) {
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

            // Ensure subscription record exists
            await prisma.subscription.upsert({
                where: { userId: user.id },
                update: {},
                create: {
                    userId: user.id,
                    plan: "free",
                    status: "active",
                    aiMessagesLimit: PLANS.free.aiMessages,
                    campaignsLimit: PLANS.free.campaigns,
                    adsAccountsLimit: PLANS.free.adsAccounts,
                },
            });

            userId = user.id;
        } catch (dbError) {
            console.warn("[Auth/Email] Database not available:", dbError);
        }

        const response = NextResponse.json({ success: true });

        response.cookies.set("session", JSON.stringify({
            id: userId,
            email,
            name: email.split("@")[0],
            picture: null,
            authenticated: true,
            method: "email",
            hasAdsAccess: false,
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
