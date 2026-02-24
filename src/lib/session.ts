/**
 * Session Helper
 *
 * Gets the current user from the session cookie.
 * Works server-side in API routes and Server Components.
 */

import { cookies } from "next/headers";

export interface SessionUser {
    id: string;
    email: string;
    name: string;
    picture: string | null;
    authenticated: boolean;
    method: "google" | "email";
    hasAdsAccess: boolean;
    adsTokenPresent?: boolean;
}

export function getSession(): SessionUser | null {
    try {
        const cookieStore = cookies();
        const sessionCookie = cookieStore.get("session");
        if (!sessionCookie?.value) return null;

        const session = JSON.parse(decodeURIComponent(sessionCookie.value));
        if (!session?.authenticated) return null;

        return {
            id: session.id || "",
            email: session.email || "",
            name: session.name || "",
            picture: session.picture || null,
            authenticated: true,
            method: session.method || "email",
            hasAdsAccess: session.hasAdsAccess || false,
            adsTokenPresent: session.adsTokenPresent || false,
        };
    } catch {
        return null;
    }
}

/**
 * Parse session from cookie header string (for API routes using NextRequest)
 */
export function getSessionFromRequest(cookieHeader: string | null): SessionUser | null {
    if (!cookieHeader) return null;

    try {
        const match = cookieHeader.match(/session=([^;]+)/);
        if (!match) return null;

        const session = JSON.parse(decodeURIComponent(match[1]));
        if (!session?.authenticated) return null;

        return {
            id: session.id || "",
            email: session.email || "",
            name: session.name || "",
            picture: session.picture || null,
            authenticated: true,
            method: session.method || "email",
            hasAdsAccess: session.hasAdsAccess || false,
            adsTokenPresent: session.adsTokenPresent || false,
        };
    } catch {
        return null;
    }
}
