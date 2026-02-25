/**
 * Auth-gated file serving endpoint.
 * 
 * Serves uploaded files from private-uploads/ only to authenticated users
 * who own the file.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDual } from "@/lib/session";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "private-uploads");

const MIME_TYPES: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
};

export async function GET(
    req: NextRequest,
    { params }: { params: { filename: string } }
) {
    const session = await getSessionDual(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename } = params;

    // Security: prevent path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
        return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Verify the file belongs to this user (filename format: userId_uuid.ext)
    if (!filename.startsWith(`${session.id}_`)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filepath = path.join(UPLOAD_DIR, filename);
    if (!existsSync(filepath)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        const buffer = await readFile(filepath);
        const ext = filename.split(".").pop()?.toLowerCase() || "";
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "private, max-age=86400",
                "Content-Disposition": "inline",
            },
        });
    } catch {
        return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
    }
}
