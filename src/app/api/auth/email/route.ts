/**
 * Email Sign-In API Route
 *
 * Sends a magic link email for secure passwordless authentication.
 * The link contains a short-lived JWT that verifies the user's email ownership.
 */

import { NextRequest, NextResponse } from "next/server";
import { signMagicLinkToken } from "@/lib/jwt";
import { sendMagicLinkEmail } from "@/lib/email";
import { authLimiter, checkRateLimit } from "@/lib/rate-limit";

const emailLoginEnabled = process.env.ENABLE_EMAIL_LOGIN !== "false";
const APP_URL = process.env.NEXTAUTH_URL || "https://admasterai.nobleblocks.com";

export async function POST(req: NextRequest) {
    if (!emailLoginEnabled) {
        return NextResponse.json({
            error: "Email sign-in is disabled",
            message: "Please sign in with Google.",
        }, { status: 403 });
    }

    const rateLimited = checkRateLimit(req, authLimiter);
    if (rateLimited) return rateLimited;

    try {
        const { email, next } = await req.json();

        if (!email || typeof email !== "string" || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)) {
            return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
        }

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim().slice(0, 254);
        const redirectPath = next || "/dashboard/chat";

        // Generate magic link token (expires in 15 minutes)
        const token = await signMagicLinkToken(normalizedEmail);

        // Build magic link URL
        const magicLinkUrl = `${APP_URL}/api/auth/magic-link?token=${encodeURIComponent(token)}&next=${encodeURIComponent(redirectPath)}`;

        // Send the email
        const result = await sendMagicLinkEmail(normalizedEmail, magicLinkUrl);

        if (!result.success) {
            console.error("[Auth/Email] Failed to send magic link:", result.error);
            return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Magic link sent! Check your email.",
        });
    } catch {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
