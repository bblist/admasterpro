/**
 * Campaign Drafts API
 *
 * GET    — List drafts (optional ?businessId filter)
 * POST   — Create a new draft
 * PUT    — Update an existing draft
 * DELETE — Delete a draft (?id=...)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionDual } from "@/lib/session";
import { checkCSRF } from "@/lib/csrf";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";

/* ── GET — List drafts ──────────────────────────────────────────── */
export async function GET(req: NextRequest) {
    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");

        const where: Record<string, unknown> = { userId: session.id };
        if (businessId) where.businessId = businessId;

        const drafts = await prisma.campaignDraft.findMany({
            where,
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json({ drafts });
    } catch (error) {
        console.error("[Drafts] List error:", error);
        return NextResponse.json({ error: "Failed to fetch drafts" }, { status: 500 });
    }
}

/* ── POST — Create draft ────────────────────────────────────────── */
export async function POST(req: NextRequest) {
    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, type, content, budget, notes, businessId } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: "Draft name is required" }, { status: 400 });
        }

        const validTypes = ["search", "display", "shopping", "pmax", "video"];
        if (type && !validTypes.includes(type)) {
            return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(", ")}` }, { status: 400 });
        }

        const draft = await prisma.campaignDraft.create({
            data: {
                userId: session.id,
                businessId: businessId || null,
                name: name.trim(),
                type: type || "search",
                status: "draft",
                content: typeof content === "string" ? content : JSON.stringify(content || {}),
                budget: budget ? parseFloat(budget) : null,
                notes: notes || null,
            },
        });

        return NextResponse.json({ draft }, { status: 201 });
    } catch (error) {
        console.error("[Drafts] Create error:", error);
        return NextResponse.json({ error: "Failed to create draft" }, { status: 500 });
    }
}

/* ── PUT — Update draft ─────────────────────────────────────────── */
export async function PUT(req: NextRequest) {
    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, name, type, status, content, budget, notes } = body;

        if (!id) {
            return NextResponse.json({ error: "Draft id is required" }, { status: 400 });
        }

        // Verify ownership
        const existing = await prisma.campaignDraft.findFirst({
            where: { id, userId: session.id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Draft not found" }, { status: 404 });
        }

        const validStatuses = ["draft", "ready", "published", "paused"];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
        }

        const data: Record<string, unknown> = {};
        if (name !== undefined) data.name = name.trim();
        if (type !== undefined) data.type = type;
        if (status !== undefined) data.status = status;
        if (content !== undefined) data.content = typeof content === "string" ? content : JSON.stringify(content);
        if (budget !== undefined) data.budget = budget ? parseFloat(budget) : null;
        if (notes !== undefined) data.notes = notes;

        const draft = await prisma.campaignDraft.update({
            where: { id },
            data,
        });

        return NextResponse.json({ draft });
    } catch (error) {
        console.error("[Drafts] Update error:", error);
        return NextResponse.json({ error: "Failed to update draft" }, { status: 500 });
    }
}

/* ── DELETE — Remove draft ──────────────────────────────────────── */
export async function DELETE(req: NextRequest) {
    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Draft id is required" }, { status: 400 });
        }

        // Verify ownership
        const existing = await prisma.campaignDraft.findFirst({
            where: { id, userId: session.id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Draft not found" }, { status: 404 });
        }

        await prisma.campaignDraft.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Drafts] Delete error:", error);
        return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 });
    }
}
