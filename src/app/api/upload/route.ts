/**
 * Image Upload API
 * 
 * Handles image uploads for ad creatives.
 * Stores images locally with option for S3 integration.
 * 
 * POST - Upload image(s)
 * GET  - List uploaded images for user
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { checkCSRF } from "@/lib/csrf";
import { apiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MIME_EXT: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
};

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
        const formData = await req.formData();
        const files = formData.getAll("images") as File[];

        if (!files.length) {
            return NextResponse.json({ error: "No images provided" }, { status: 400 });
        }

        // Ensure upload directory exists
        if (!existsSync(UPLOAD_DIR)) {
            await mkdir(UPLOAD_DIR, { recursive: true });
        }

        const uploaded: { id: string; url: string; filename: string; size: number }[] = [];
        const errors: string[] = [];

        for (const file of files) {
            // Validate file type
            if (!ALLOWED_TYPES.includes(file.type)) {
                errors.push(`${file.name}: Invalid file type. Allowed: JPEG, PNG, GIF, WebP`);
                continue;
            }

            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                errors.push(`${file.name}: File too large. Max 5MB.`);
                continue;
            }

            // Generate unique filename
            const ext = MIME_EXT[file.type] || "jpg";
            const id = crypto.randomUUID();
            const filename = `${session.id}_${id}.${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);

            // Write file
            const buffer = Buffer.from(await file.arrayBuffer());
            await writeFile(filepath, buffer);

            // Store in database
            await prisma.adImage.create({
                data: {
                    id,
                    userId: session.id,
                    filename,
                    originalName: file.name,
                    mimeType: file.type,
                    size: file.size,
                    url: `/uploads/${filename}`,
                },
            });

            uploaded.push({
                id,
                url: `/uploads/${filename}`,
                filename: file.name,
                size: file.size,
            });
        }

        return NextResponse.json({
            success: true,
            uploaded,
            errors: errors.length ? errors : undefined,
        });
    } catch (error) {
        console.error("[Upload] Error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const images = await prisma.adImage.findMany({
            where: { userId: session.id },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json({ images });
    } catch (error) {
        console.error("[Upload] Error fetching images:", error);
        return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
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
        const { imageId } = await req.json();

        if (!imageId) {
            return NextResponse.json({ error: "Image ID required" }, { status: 400 });
        }

        // Verify ownership and delete
        const image = await prisma.adImage.findFirst({
            where: { id: imageId, userId: session.id },
        });

        if (!image) {
            return NextResponse.json({ error: "Image not found" }, { status: 404 });
        }

        // Delete from database
        await prisma.adImage.delete({ where: { id: imageId } });

        // Delete file (optional - keep for CDN caching)
        // const filepath = path.join(UPLOAD_DIR, image.filename);
        // if (existsSync(filepath)) await unlink(filepath);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Upload] Delete error:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
