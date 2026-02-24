/**
 * Businesses API
 *
 * GET  — List user's businesses
 * POST — Create a new business
 * PUT  — Update a business
 * DELETE — Delete a business
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionDual } from "@/lib/session";
import { checkCSRF } from "@/lib/csrf";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const businesses = await prisma.business.findMany({
            where: { userId: session.id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ businesses });
    } catch (error) {
        console.error("[Business] List error:", error);
        return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const csrfError = checkCSRF(req);
    if (csrfError) return csrfError;

    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name, website, industry, googleAdsId } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Business name required" }, { status: 400 });
        }

        // Check plan limits
        const subscription = await prisma.subscription.findUnique({
            where: { userId: session.id },
        });

        const existingCount = await prisma.business.count({
            where: { userId: session.id },
        });

        const limit = subscription?.adsAccountsLimit || 1;
        if (existingCount >= limit) {
            return NextResponse.json({
                error: `Business limit reached (${limit}). Upgrade your plan to add more.`,
            }, { status: 403 });
        }

        const business = await prisma.business.create({
            data: {
                userId: session.id,
                name,
                website: website || null,
                industry: industry || null,
                googleAdsId: googleAdsId || null,
            },
        });

        return NextResponse.json({ business }, { status: 201 });
    } catch (error) {
        console.error("[Business] Create error:", error);
        return NextResponse.json({ error: "Failed to create business" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const csrfError = checkCSRF(req);
    if (csrfError) return csrfError;

    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id, name, website, industry, googleAdsId } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Business ID required" }, { status: 400 });
        }

        // Verify ownership
        const existing = await prisma.business.findFirst({
            where: { id, userId: session.id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const business = await prisma.business.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(website !== undefined && { website }),
                ...(industry !== undefined && { industry }),
                ...(googleAdsId !== undefined && { googleAdsId }),
            },
        });

        return NextResponse.json({ business });
    } catch (error) {
        console.error("[Business] Update error:", error);
        return NextResponse.json({ error: "Failed to update business" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const csrfError = checkCSRF(req);
    if (csrfError) return csrfError;

    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Business ID required" }, { status: 400 });
        }

        // Verify ownership
        const existing = await prisma.business.findFirst({
            where: { id, userId: session.id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        await prisma.business.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Business] Delete error:", error);
        return NextResponse.json({ error: "Failed to delete business" }, { status: 500 });
    }
}
