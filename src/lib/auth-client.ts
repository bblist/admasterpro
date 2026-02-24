/**
 * Client-Side Auth Utility
 *
 * Stores JWT token in localStorage and provides:
 *   - Token capture from URL hash (Google OAuth redirect) or API response (email sign-in)
 *   - authFetch() wrapper that adds Authorization header to all API calls
 *   - getAuthUser() to read user info from stored token
 *   - clearAuth() to sign out
 *
 * This works alongside httpOnly cookies as a fallback for:
 *   - Safari ITP (kills cookies after 7 days)
 *   - Privacy browsers that block cookies
 *   - Mobile browsers with aggressive cookie policies
 */

const TOKEN_KEY = "amp_token";
const USER_KEY = "amp_user";

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    picture: string | null;
    method: "google" | "email";
    hasAdsAccess: boolean;
    adsTokenPresent?: boolean;
}

/**
 * Store auth token and user data in localStorage.
 */
export function setAuth(token: string, user?: AuthUser): void {
    try {
        localStorage.setItem(TOKEN_KEY, token);
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
    } catch {
        // localStorage unavailable (private mode on some browsers)
        console.warn("[Auth] localStorage unavailable");
    }
}

/**
 * Get stored auth token.
 */
export function getToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

/**
 * Get stored user info (parsed from token on login).
 */
export function getAuthUser(): AuthUser | null {
    try {
        const data = localStorage.getItem(USER_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

/**
 * Clear auth data (sign out).
 */
export function clearAuth(): void {
    try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    } catch {
        // ignore
    }
}

/**
 * Check if user is authenticated (has a stored token).
 */
export function isAuthenticated(): boolean {
    return !!getToken();
}

/**
 * Decode JWT payload without verification (client-side display only).
 * The server always verifies the token properly.
 */
export function decodeTokenPayload(token: string): AuthUser | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        return {
            id: payload.id,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            method: payload.method,
            hasAdsAccess: payload.hasAdsAccess,
            adsTokenPresent: payload.adsTokenPresent,
        };
    } catch {
        return null;
    }
}

/**
 * Capture JWT token from URL hash (after Google OAuth redirect).
 * Call this on page load in the dashboard layout.
 * The hash fragment is never sent to the server, so it's secure.
 */
export function captureTokenFromHash(): boolean {
    if (typeof window === "undefined") return false;

    const hash = window.location.hash;
    if (!hash.includes("token=")) return false;

    const match = hash.match(/token=([^&]+)/);
    if (!match) return false;

    const token = match[1];
    const user = decodeTokenPayload(token);

    setAuth(token, user || undefined);

    // Clean the hash from URL without triggering a navigation
    const cleanUrl = window.location.href.split("#")[0];
    window.history.replaceState(null, "", cleanUrl);

    return true;
}

/**
 * Fetch wrapper that adds Authorization header with stored token.
 * Falls back to regular fetch if no token is stored (cookies will be used).
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getToken();

    if (token) {
        const headers = new Headers(options.headers || {});
        if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        options = { ...options, headers };
    }

    return fetch(url, options);
}
