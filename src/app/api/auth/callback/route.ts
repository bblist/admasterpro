/**
 * Google OAuth Callback Handler
 *
 * Handles the OAuth 2.0 callback from Google Sign-In.
 * When credentials are provided via environment variables, this becomes functional.
 *
 * Environment variables needed:
 *   GOOGLE_CLIENT_ID      - Google OAuth Client ID
 *   GOOGLE_CLIENT_SECRET  - Google OAuth Client Secret
 *   NEXTAUTH_SECRET       - Random secret for session encryption
 *   NEXTAUTH_URL          - Base URL (https://admasterai.nobleblocks.com)
 */

import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = (process.env.NEXTAUTH_URL || "https://admasterai.nobleblocks.com") + "/api/auth/callback";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
        // Step 1: Redirect to Google OAuth
        if (!GOOGLE_CLIENT_ID) {
            return NextResponse.json({
                error: "Google OAuth not configured",
                message: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.",
                setup: {
                    GOOGLE_CLIENT_ID: "Get from https://console.cloud.google.com/apis/credentials",
                    GOOGLE_CLIENT_SECRET: "Same page as above",
                    NEXTAUTH_URL: "https://admasterai.nobleblocks.com",
                    NEXTAUTH_SECRET: "Run: openssl rand -base64 32",
                },
            }, { status: 503 });
        }

        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            response_type: "code",
            scope: "openid email profile",
            access_type: "offline",
            prompt: "consent",
        });

        return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
    }

    // Step 2: Exchange code for tokens
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return NextResponse.json({ error: "OAuth credentials not configured" }, { status: 503 });
    }

    try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenRes.ok) {
            const err = await tokenRes.text();
            console.error("[Auth] Token exchange failed:", err);
            return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
        }

        const tokens = await tokenRes.json();

        // Get user info
        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const user = await userRes.json();

        // TODO: Create/update user in database
        // TODO: Create session token (JWT)
        // For now, redirect to dashboard with user info in cookie
        const response = NextResponse.redirect(new URL("/dashboard", req.url));

        // Set a simple session cookie (replace with proper JWT in production)
        response.cookies.set("session", JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            authenticated: true,
        }), {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("[Auth] OAuth error:", error);
        return NextResponse.redirect(new URL("/login?error=auth_error", req.url));
    }
}
