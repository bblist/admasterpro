/**
 * Google OAuth Callback Handler
 *
 * Multi-tenant SaaS OAuth flow:
 *   1. User clicks "Sign in with Google" → redirected here (no code param)
 *   2. We redirect to Google OAuth with openid + email + profile + Google Ads scope
 *   3. Google redirects back here with ?code=xxx
 *   4. We exchange code for tokens, fetch user info, store refresh_token
 *   5. Redirect to dashboard with session cookie
 *
 * The refresh_token is critical — it lets us call the Google Ads API on behalf
 * of each user without them being present. Combined with our platform's Developer
 * Token, this enables full multi-tenant Google Ads management.
 *
 * Environment variables needed:
 *   GOOGLE_CLIENT_ID      - Google OAuth Client ID
 *   GOOGLE_CLIENT_SECRET  - Google OAuth Client Secret
 *   NEXTAUTH_SECRET       - Random secret for session encryption
 *   NEXTAUTH_URL          - Base URL (https://admasterai.nobleblocks.com)
 *   GOOGLE_ADS_DEVELOPER_TOKEN - (future) Developer Token from MCC account
 */

import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = (process.env.NEXTAUTH_URL || "https://admasterai.nobleblocks.com") + "/api/auth/callback";

// Scopes: identity + Google Ads API access
// The adwords scope lets us manage their Google Ads account via API
const SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/adwords",
].join(" ");

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    const errorParam = req.nextUrl.searchParams.get("error");

    // Handle user denying consent
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
            scope: SCOPES,
            access_type: "offline",   // Required to get refresh_token
            prompt: "consent",        // Force consent to always get refresh_token
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

        // tokens contains:
        //   access_token  - short-lived (~1hr), for immediate API calls
        //   refresh_token - long-lived, for offline API access (only on first consent)
        //   id_token      - JWT with user identity
        //   expires_in    - seconds until access_token expires
        //   scope         - granted scopes (may or may not include adwords)

        console.log("[Auth] Token exchange successful. Scopes granted:", tokens.scope);
        console.log("[Auth] Refresh token received:", !!tokens.refresh_token);

        // Check if the user granted Google Ads access
        const hasAdsAccess = tokens.scope?.includes("adwords") || false;

        // Get user profile info
        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const user = await userRes.json();

        // TODO: Store in database:
        //   - user.id, user.email, user.name, user.picture
        //   - tokens.refresh_token (encrypted!) for Google Ads API calls
        //   - tokens.access_token + tokens.expires_in for short-term use
        //   - hasAdsAccess flag
        // For now, storing essential session data in cookie

        const response = NextResponse.redirect(new URL("/dashboard/chat", req.url));

        // Session cookie with user info + auth metadata
        response.cookies.set("session", JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            authenticated: true,
            method: "google",
            hasAdsAccess,
            // NOTE: In production, refresh_token should be stored server-side in a database,
            // NOT in a cookie. This is here temporarily until we add a database layer.
            adsTokenPresent: !!tokens.refresh_token,
        }), {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        // Store refresh token in a separate httpOnly cookie for now
        // TODO: Move to encrypted database storage
        if (tokens.refresh_token) {
            response.cookies.set("ads_refresh_token", tokens.refresh_token, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 365, // 1 year
                path: "/",
            });
        }

        return response;
    } catch (error) {
        console.error("[Auth] OAuth error:", error);
        return NextResponse.redirect(new URL("/login?error=auth_error", req.url));
    }
}
