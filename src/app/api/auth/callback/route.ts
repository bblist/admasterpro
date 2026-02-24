/**
 * Google OAuth Callback Handler
 *
 * Multi-tenant SaaS OAuth flow:
 *   1. User clicks "Sign in with Google" → redirected here (no code param)
 *   2. We redirect to Google OAuth with openid + email + profile + Google Ads scope
 *   3. Google redirects back here with ?code=xxx
 *   4. We exchange code for tokens, fetch user info, store in database
 *   5. Redirect to dashboard with session cookie
 *
 * The refresh_token is stored in the database (encrypted in production).
 * Combined with our platform's Developer Token, this enables full multi-tenant
 * Google Ads management.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { signToken } from "@/lib/jwt";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = (process.env.NEXTAUTH_URL || "https://admasterai.nobleblocks.com") + "/api/auth/callback";

const SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/adwords",
].join(" ");

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    const errorParam = req.nextUrl.searchParams.get("error");

    if (errorParam) {
        console.error("[Auth] User denied consent:", errorParam);
        return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
    }

    if (!code) {
        // Step 1: Redirect to Google OAuth consent screen
        if (!GOOGLE_CLIENT_ID) {
            return NextResponse.json({
                error: "Google OAuth not configured",
                message: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.",
            }, { status: 503 });
        }

        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            response_type: "code",
            scope: SCOPES,
            access_type: "offline",
            prompt: "consent",
            include_granted_scopes: "true",
        });

        return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
    }

    // Step 2: Exchange authorization code for tokens
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
        console.log("[Auth] Token exchange successful. Scopes granted:", tokens.scope);
        console.log("[Auth] Refresh token received:", !!tokens.refresh_token);

        const hasAdsAccess = tokens.scope?.includes("adwords") || false;

        // Get user profile info
        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userInfo = await userRes.json();

        // ─── Persist to Database ────────────────────────────────────────────
        let user;
        try {
            user = await prisma.user.upsert({
                where: { email: userInfo.email },
                update: {
                    name: userInfo.name,
                    picture: userInfo.picture,
                    googleId: userInfo.id,
                    authMethod: "google",
                    hasAdsAccess,
                    refreshToken: tokens.refresh_token || undefined,
                    lastActiveAt: new Date(),
                },
                create: {
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture,
                    googleId: userInfo.id,
                    authMethod: "google",
                    hasAdsAccess,
                    refreshToken: tokens.refresh_token || undefined,
                },
            });

            // Ensure subscription record exists
            await prisma.subscription.upsert({
                where: { userId: user.id },
                update: {}, // don't change existing subscription
                create: {
                    userId: user.id,
                    plan: "free",
                    status: "active",
                    aiMessagesLimit: PLANS.free.aiMessages,
                    campaignsLimit: PLANS.free.campaigns,
                    adsAccountsLimit: PLANS.free.adsAccounts,
                },
            });

            console.log(`[Auth] User persisted: ${user.email} (${user.id})`);
        } catch (dbError) {
            // Database might not be set up yet — continue with cookie-only auth
            console.warn("[Auth] Database not available, using cookie-only auth:", dbError);
        }

        // Generate JWT token for localStorage-based auth (cookie fallback)
        const sessionData = {
            id: user?.id || userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            method: "google" as const,
            hasAdsAccess,
            adsTokenPresent: !!tokens.refresh_token,
        };
        const jwt = await signToken(sessionData);

        // Redirect with JWT in URL fragment (not sent to server, client reads it)
        const redirectUrl = new URL("/dashboard/chat", req.url);
        redirectUrl.hash = `token=${jwt}`;
        const response = NextResponse.redirect(redirectUrl);

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
    } catch (error) {
        console.error("[Auth] OAuth error:", error);
        return NextResponse.redirect(new URL("/login?error=auth_error", req.url));
    }
}
