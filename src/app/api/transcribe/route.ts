/**
 * Video Transcription API Route (Deepgram)
 *
 * Accepts video file uploads and returns transcriptions using Deepgram's API.
 * Falls back to a demo transcript when DEEPGRAM_API_KEY is not configured.
 *
 * Environment variables:
 *   DEEPGRAM_API_KEY - Deepgram API key for speech-to-text
 */

import { NextRequest, NextResponse } from "next/server";
import { transcribeLimiter, checkRateLimit } from "@/lib/rate-limit";
import { getSessionDual } from "@/lib/session";
import { checkCSRF } from "@/lib/csrf";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

export async function POST(req: NextRequest) {
    const rateLimited = checkRateLimit(req, transcribeLimiter);
    if (rateLimited) return rateLimited;

    const csrfError = await checkCSRF(req);
    if (csrfError) return csrfError;

    // Require authentication
    const session = await getSessionDual(req);
    if (!session?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Check file type
        const validTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "audio/mpeg", "audio/wav", "audio/mp4"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Supported: MP4, MOV, AVI, WebM, MP3, WAV" }, { status: 400 });
        }

        // Check file size (25MB max for API processing)
        if (file.size > 25 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large. Max 25MB." }, { status: 400 });
        }

        if (!DEEPGRAM_API_KEY) {
            // Demo mode - return simulated transcript
            return NextResponse.json({
                transcript: `[Demo Mode] Transcription of "${file.name}" would appear here. Add DEEPGRAM_API_KEY to your .env to enable real speech-to-text transcription powered by Deepgram.`,
                confidence: 0,
                duration: 0,
                words: 0,
                demo: true,
            });
        }

        // Send to Deepgram
        const audioBuffer = await file.arrayBuffer();

        const res = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&paragraphs=true&punctuate=true&diarize=true", {
            method: "POST",
            headers: {
                Authorization: `Token ${DEEPGRAM_API_KEY}`,
                "Content-Type": file.type || "video/mp4",
            },
            body: audioBuffer,
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("[Deepgram] Error:", res.status, errorText);
            return NextResponse.json(
                { error: "Transcription failed. Check your Deepgram API key." },
                { status: 500 }
            );
        }

        const data = await res.json();
        const channel = data.results?.channels?.[0];
        const alternative = channel?.alternatives?.[0];

        return NextResponse.json({
            transcript: alternative?.transcript || "No speech detected in this file.",
            confidence: alternative?.confidence || 0,
            duration: data.metadata?.duration || 0,
            words: alternative?.words?.length || 0,
            paragraphs: alternative?.paragraphs?.transcript || alternative?.transcript || "",
            demo: false,
        });
    } catch (error) {
        console.error("[Transcribe API] Error:", error);
        return NextResponse.json(
            { error: "Something went wrong during transcription." },
            { status: 500 }
        );
    }
}
