/**
 * Sign-Out API Route
 *
 * Clears the session cookie and the session_init cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkCSRF } from "@/lib/csrf";
import { authLimiter, checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    const rateLimited = checkRateLimit(req, authLimiter);
    if (rateLimited) return rateLimited;

    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    const response = NextResponse.json({ success: true });

    // Clear session cookie
    response.cookies.set("session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
    });

    // Clear the session_init cookie (used during OAuth redirect)
    response.cookies.set("session_init", "", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
    });

    // Clear the CSRF cookie
    response.cookies.set("csrf_token", "", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
    });

    return response;
}
