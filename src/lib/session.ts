/**
 * Session Helper
 *
 * Gets the current user from the session cookie or JWT token.
 * Works server-side in API routes and Server Components.
 * Supports dual auth: httpOnly cookie + Authorization header (JWT fallback).
 */

import { cookies } from "next/headers";
import { verifyToken, extractBearerToken } from "@/lib/jwt";

export interface SessionUser {
    id: string;
    email: string;
    name: string;
    picture: string | null;
    authenticated: boolean;
    method: "google" | "email";
    hasAdsAccess: boolean;
    role?: string;
    adsTokenPresent?: boolean;
}

export async function getSession(): Promise<SessionUser | null> {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) return null;
    return getSessionFromToken(decodeURIComponent(sessionCookie.value));
}

/**
 * Parse session from cookie header string (for API routes using NextRequest)
 */
export async function getSessionFromRequest(cookieHeader: string | null): Promise<SessionUser | null> {
    if (!cookieHeader) return null;

    try {
        const match = cookieHeader.match(/session=([^;]+)/);
        if (!match) return null;
        return getSessionFromToken(decodeURIComponent(match[1]));
    } catch {
        return null;
    }
}

/**
 * Get session from JWT token (Authorization header or x-auth-token).
 * Call this as a fallback when cookie-based session returns null.
 */
export async function getSessionFromToken(token: string): Promise<SessionUser | null> {
    const payload = await verifyToken(token);
    if (!payload) return null;

    return {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        authenticated: true,
        method: payload.method,
        hasAdsAccess: payload.hasAdsAccess,
        role: (payload as { role?: string }).role,
        adsTokenPresent: payload.adsTokenPresent || false,
    };
}

/**
 * Get session from NextRequest — tries cookie first, then Authorization header.
 * Use this in API routes for dual auth support.
 */
export async function getSessionDual(req: { headers: { get(name: string): string | null } }): Promise<SessionUser | null> {
    // 1. Try cookie
    const cookieHeader = req.headers.get("cookie");
    const cookieSession = await getSessionFromRequest(cookieHeader);
    if (cookieSession) return cookieSession;

    // 2. Try Authorization: Bearer <token>
    const authHeader = req.headers.get("authorization");
    const bearerToken = extractBearerToken(authHeader);
    if (bearerToken) {
        const tokenSession = await getSessionFromToken(bearerToken);
        if (tokenSession) return tokenSession;
    }

    // 3. Try x-auth-token header
    const tokenHeader = req.headers.get("x-auth-token");
    if (tokenHeader) {
        const tokenSession = await getSessionFromToken(tokenHeader);
        if (tokenSession) return tokenSession;
    }

    return null;
}
