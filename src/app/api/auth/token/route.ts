/**
 * Token Refresh API Route
 *
 * Returns a fresh JWT token for the currently authenticated user.
 * The client can call this periodically to keep the token fresh.
 * Works with either cookie or existing JWT auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { signToken } from "@/lib/jwt";
import { authLimiter, checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
    const rateLimited = checkRateLimit(req, authLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);

    if (!session?.id) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = await signToken({
        id: session.id,
        email: session.email,
        name: session.name,
        picture: session.picture,
        method: session.method,
        hasAdsAccess: session.hasAdsAccess,
        adsTokenPresent: session.adsTokenPresent,
    });

    return NextResponse.json({ token });
}
