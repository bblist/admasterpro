/**
 * CSRF Protection Library
 *
 * Provides CSRF token generation and validation for API routes.
 * Uses the double-submit cookie pattern combined with a header token.
 *
 * Flow:
 *   1. Server sets a CSRF cookie on page load (via middleware or layout)
 *   2. Client reads the cookie and sends it via X-CSRF-Token header
 *   3. Server validates header === cookie
 *
 * This protects against CSRF because:
 *   - Attacker cannot read cross-origin cookies (same-origin policy)
 *   - Attacker cannot set custom headers on cross-origin requests
 */

import { cookies } from "next/headers";
import crypto from "crypto";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token.
 */
export function generateCSRFToken(): string {
    return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}

/**
 * Get or create a CSRF token for the current session.
 * Call this in Server Components or API routes to ensure a token exists.
 */
export function getOrCreateCSRFToken(): string {
    const cookieStore = cookies();
    const existing = cookieStore.get(CSRF_COOKIE_NAME);

    if (existing?.value) {
        return existing.value;
    }

    // Generate new token — will be set via response
    return generateCSRFToken();
}

/**
 * Validate CSRF token from request headers against cookie.
 * Returns true if valid, false if invalid.
 *
 * @param req - Request with headers.get() method
 */
export function validateCSRFToken(req: { headers: { get(name: string): string | null } }): boolean {
    // Get token from header
    const headerToken = req.headers.get(CSRF_HEADER_NAME);
    if (!headerToken) return false;

    // Get token from cookie
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) return false;

    const match = cookieHeader.match(/csrf_token=([^;]+)/);
    if (!match) return false;

    const cookieToken = decodeURIComponent(match[1]);

    // Constant-time comparison to prevent timing attacks
    if (headerToken.length !== cookieToken.length) return false;

    return crypto.timingSafeEqual(
        Buffer.from(headerToken),
        Buffer.from(cookieToken)
    );
}

/**
 * Check CSRF and return a 403 response if invalid.
 * Returns null if valid.
 *
 * Skip CSRF validation for:
 *   - GET, HEAD, OPTIONS requests (safe methods)
 *   - Requests with valid Stripe webhook signature
 *   - API routes that are purely public (e.g., health check)
 */
export function checkCSRF(
    req: { method?: string; headers: { get(name: string): string | null } },
    options?: { skipMethods?: string[] }
): Response | null {
    const method = req.method || "GET";
    const safeMethods = options?.skipMethods || ["GET", "HEAD", "OPTIONS"];

    // Skip CSRF check for safe methods
    if (safeMethods.includes(method.toUpperCase())) {
        return null;
    }

    // Skip CSRF check for Stripe webhooks (they have their own signature)
    if (req.headers.get("stripe-signature")) {
        return null;
    }

    // Skip CSRF check for requests with valid Bearer token (API clients)
    // API clients use Authorization header, not cookies
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return null;
    }

    // Validate CSRF token
    if (!validateCSRFToken(req)) {
        return new Response(
            JSON.stringify({
                error: "Invalid or missing CSRF token",
                message: "Please refresh the page and try again.",
            }),
            {
                status: 403,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    return null;
}

/**
 * Create headers to set the CSRF cookie.
 * Use this when returning a response to ensure the token cookie is set.
 */
export function createCSRFCookieHeader(token: string): string {
    // SameSite=Lax allows the cookie to be sent on same-site requests and top-level navigations
    // HttpOnly=false so JavaScript can read it to send in header
    // Secure in production
    const isProduction = process.env.NODE_ENV === "production";
    return `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Lax; Max-Age=86400${isProduction ? "; Secure" : ""}`;
}
