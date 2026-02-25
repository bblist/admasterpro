import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
const secret = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null;

async function getSessionFromToken(token: string): Promise<{ id?: string; email?: string; authenticated?: boolean } | null> {
    if (!secret) return null;
    try {
        const { payload } = await jwtVerify(token, secret, { issuer: "admasterpro" });
        return { id: payload.id as string, email: payload.email as string, authenticated: true };
    } catch {
        return null;
    }
}

/**
 * Generate a CSRF token using Web Crypto API (Edge-compatible).
 */
function generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Try session cookie first (JWT format)
    const sessionCookie = request.cookies.get("session");
    let session: { id?: string; email?: string; authenticated?: boolean } | null = null;

    if (sessionCookie?.value) {
        session = await getSessionFromToken(decodeURIComponent(sessionCookie.value));
    }

    // 2. Fallback: check Authorization header for JWT token
    if (!session?.authenticated || !session?.id) {
        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.slice(7).trim();
            if (token) {
                session = await getSessionFromToken(token);
            }
        }
    }

    // 3. Fallback: check x-auth-token header (sent by client fetch wrapper)
    if (!session?.authenticated || !session?.id) {
        const tokenHeader = request.headers.get("x-auth-token");
        if (tokenHeader) {
            session = await getSessionFromToken(tokenHeader);
        }
    }

    const isAuthenticated = session?.authenticated === true && !!session?.id;

    // ─── Protect /dashboard routes ──────────────────────────────────────
    if (pathname.startsWith("/dashboard")) {
        if (!isAuthenticated) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("next", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // ─── Protect /admin routes ──────────────────────────────────────────
    if (pathname.startsWith("/admin")) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail || session?.email !== adminEmail) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    // ─── Set CSRF cookie if not present ─────────────────────────────────
    const response = NextResponse.next();
    const csrfCookie = request.cookies.get("csrf_token");

    if (!csrfCookie?.value) {
        const token = generateCSRFToken();
        const isProduction = process.env.NODE_ENV === "production";
        response.cookies.set("csrf_token", token, {
            path: "/",
            sameSite: "lax",
            secure: isProduction,
            httpOnly: false, // Must be readable by JavaScript
            maxAge: 86400, // 24 hours
        });
    }

    return response;
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/admin/:path*",
        "/login",
        "/signup",
        "/pricing",
        "/audit",
    ],
};
