/**
 * Knowledge Base API
 *
 * GET    — List user's KB items (optionally filtered by businessId)
 * POST   — Create a new KB item (text entry, URL, etc.)
 * PUT    — Update an existing KB item
 * DELETE — Delete a KB item
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
        const businessId = req.nextUrl.searchParams.get("businessId") || undefined;

        const items = await prisma.knowledgeBaseItem.findMany({
            where: {
                userId: session.id,
                ...(businessId ? { businessId } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return NextResponse.json({ items });
    } catch (error) {
        console.error("[KB] List error:", error);
        return NextResponse.json({ error: "Failed to fetch knowledge base items" }, { status: 500 });
    }
}

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
        const { type, title, content, fileUrl, mimeType, sizeBytes, businessId } = body;

        if (!type || !title || !content) {
            return NextResponse.json(
                { error: "type, title, and content are required" },
                { status: 400 }
            );
        }

        // Limit content size to prevent abuse (500KB max)
        if (typeof content === "string" && content.length > 500_000) {
            return NextResponse.json(
                { error: "Content is too large. Maximum 500KB." },
                { status: 400 }
            );
        }

        const validTypes = ["file", "text", "url", "transcript", "brand_profile"];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: `type must be one of: ${validTypes.join(", ")}` },
                { status: 400 }
            );
        }

        // If businessId provided, verify ownership
        if (businessId) {
            const biz = await prisma.business.findFirst({
                where: { id: businessId, userId: session.id },
            });
            if (!biz) {
                return NextResponse.json({ error: "Business not found" }, { status: 404 });
            }
        }

        const item = await prisma.knowledgeBaseItem.create({
            data: {
                userId: session.id,
                businessId: businessId || null,
                type,
                title: title.slice(0, 500),
                content,
                fileUrl: fileUrl || null,
                mimeType: mimeType || null,
                sizeBytes: sizeBytes ? (parseInt(sizeBytes) || null) : null,
            },
        });

        return NextResponse.json({ item }, { status: 201 });
    } catch (error) {
        console.error("[KB] Create error:", error);
        return NextResponse.json({ error: "Failed to create knowledge base item" }, { status: 500 });
    }
}

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
        const { id, title, content } = body;

        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        // Limit content size to prevent abuse (500KB max) — same as POST
        if (typeof content === "string" && content.length > 500_000) {
            return NextResponse.json(
                { error: "Content is too large. Maximum 500KB." },
                { status: 400 }
            );
        }

        // Verify ownership
        const existing = await prisma.knowledgeBaseItem.findFirst({
            where: { id, userId: session.id },
        });
        if (!existing) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        const item = await prisma.knowledgeBaseItem.update({
            where: { id },
            data: {
                ...(title !== undefined ? { title: title.slice(0, 500) } : {}),
                ...(content !== undefined ? { content: content.slice(0, 500_000) } : {}),
            },
        });

        return NextResponse.json({ item });
    } catch (error) {
        console.error("[KB] Update error:", error);
        return NextResponse.json({ error: "Failed to update knowledge base item" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    const rateLimited = checkRateLimit(req, apiLimiter);
    if (rateLimited) return rateLimited;

    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const id = req.nextUrl.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        // Verify ownership
        const existing = await prisma.knowledgeBaseItem.findFirst({
            where: { id, userId: session.id },
        });
        if (!existing) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        await prisma.knowledgeBaseItem.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[KB] Delete error:", error);
        return NextResponse.json({ error: "Failed to delete knowledge base item" }, { status: 500 });
    }
}
