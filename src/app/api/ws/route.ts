/**
 * WebSocket API Route Handler
 *
 * This is a placeholder for the WebSocket upgrade endpoint.
 * In production, this will be handled by a separate WebSocket server
 * (Node.js ws library) running alongside the Next.js app, or by
 * an API Gateway WebSocket endpoint.
 *
 * Current implementation: Returns connection info and status.
 * When WS server is deployed, this serves as the health check endpoint.
 */

import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        status: "ok",
        websocket: {
            url: process.env.NEXT_PUBLIC_WS_URL || "wss://admasterai.nobleblocks.com/ws",
            protocol: "admasterpro-v1",
            features: [
                "chat_streaming",
                "campaign_updates",
                "budget_alerts",
                "competitor_alerts",
            ],
        },
        models: {
            primary: "gpt-4o",
            fallback: "claude-4.6",
        },
        timestamp: new Date().toISOString(),
    });
}
