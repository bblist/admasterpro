import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "admasterpro-fallback-secret-change-me";
const secret = new TextEncoder().encode(JWT_SECRET);

async function getSessionFromToken(token: string): Promise<{ id?: string; email?: string; authenticated?: boolean } | null> {
    try {
        const { payload } = await jwtVerify(token, secret, { issuer: "admasterpro" });
        return { id: payload.id as string, email: payload.email as string, authenticated: true };
    } catch {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Try session cookie first
    const sessionCookie = request.cookies.get("session");
    let session: { id?: string; email?: string; authenticated?: boolean } | null = null;

    if (sessionCookie?.value) {
        try {
            session = JSON.parse(decodeURIComponent(sessionCookie.value));
        } catch {
            session = null;
        }
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
        if (adminEmail && session?.email !== adminEmail) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*"],
};
