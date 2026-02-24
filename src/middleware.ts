import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Parse session cookie
    const sessionCookie = request.cookies.get("session");
    let session: { id?: string; email?: string; authenticated?: boolean } | null = null;

    if (sessionCookie?.value) {
        try {
            session = JSON.parse(decodeURIComponent(sessionCookie.value));
        } catch {
            session = null;
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
