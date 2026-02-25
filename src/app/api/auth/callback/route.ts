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
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { signToken } from "@/lib/jwt";
import { authLimiter, checkRateLimit } from "@/lib/rate-limit";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = (process.env.NEXTAUTH_URL || "https://admasterai.nobleblocks.com") + "/api/auth/callback";

const SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/adwords",
].join(" ");
const OAUTH_STATE_COOKIE = "oauth_state";
const OAUTH_NEXT_COOKIE = "oauth_next";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    const errorParam = req.nextUrl.searchParams.get("error");
    const stateParam = req.nextUrl.searchParams.get("state");

    // Rate limit the token exchange (when code is present), not the initial redirect
    if (code) {
        const rateLimited = checkRateLimit(req, authLimiter);
        if (rateLimited) return rateLimited;
    }

    if (errorParam) {
        console.error("[Auth] User denied consent:", errorParam);
        const response = NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
        response.cookies.set(OAUTH_STATE_COOKIE, "", {
            path: "/",
            maxAge: 0,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });
        return response;
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
            state: crypto.randomBytes(24).toString("hex"),
            scope: SCOPES,
            access_type: "offline",
            prompt: "consent",
            include_granted_scopes: "true",
        });

        const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
        response.cookies.set(OAUTH_STATE_COOKIE, params.get("state") as string, {
            path: "/",
            maxAge: 60 * 10,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        // Store optional redirect target (e.g., /onboarding)
        const nextPath = req.nextUrl.searchParams.get("next");
        if (nextPath && /^\/[a-zA-Z]/.test(nextPath)) {
            response.cookies.set(OAUTH_NEXT_COOKIE, nextPath, {
                path: "/",
                maxAge: 60 * 10,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            });
        }

        return response;
    }

    const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
    if (!stateParam || !stateCookie || stateParam !== stateCookie) {
        console.warn("[Auth] Invalid OAuth state");
        const response = NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
        response.cookies.set(OAUTH_STATE_COOKIE, "", {
            path: "/",
            maxAge: 0,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });
        return response;
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
            const response = NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
            response.cookies.set(OAUTH_STATE_COOKIE, "", {
                path: "/",
                maxAge: 0,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            });
            return response;
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

            // Ensure subscription record exists — new users get 7-day trial
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 7);

            await prisma.subscription.upsert({
                where: { userId: user.id },
                update: {}, // don't change existing subscription
                create: {
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

        // Redirect to dashboard — JWT passed via short-lived readable cookie (not URL hash)
        const nextCookie = req.cookies.get(OAUTH_NEXT_COOKIE)?.value;
        const redirectPath = (nextCookie && /^\/[a-zA-Z]/.test(nextCookie)) ? nextCookie : "/dashboard/chat";
        const redirectUrl = new URL(redirectPath, req.url);
        const response = NextResponse.redirect(redirectUrl);

        // Short-lived cookie for client-side JS to capture token into localStorage
        response.cookies.set("session_init", jwt, {
            httpOnly: false, // Client JS reads this
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60, // 60 seconds — just enough for redirect
            path: "/",
        });

        // Also set session cookie (dual auth — cookie + token)
        response.cookies.set("session", jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });
        response.cookies.set(OAUTH_STATE_COOKIE, "", {
            path: "/",
            maxAge: 0,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });
        response.cookies.set(OAUTH_NEXT_COOKIE, "", {
            path: "/",
            maxAge: 0,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        return response;
    } catch (error) {
        console.error("[Auth] OAuth error:", error);
        const response = NextResponse.redirect(new URL("/login?error=auth_error", req.url));
        response.cookies.set(OAUTH_STATE_COOKIE, "", {
            path: "/",
            maxAge: 0,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });
        return response;
    }
}
