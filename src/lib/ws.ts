/**
 * WebSocket Client Hook for AdMaster Pro
 *
 * Provides real-time communication for:
 * - AI chat streaming (token-by-token response rendering)
 * - Live campaign status updates
 * - Real-time budget/spend alerts
 * - Competitor activity notifications
 *
 * Usage:
 *   const { send, lastMessage, status } = useWebSocket();
 *   send({ type: "chat", payload: { message: "Create 3 ads" } });
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type WSStatus = "connecting" | "connected" | "disconnected" | "error";

export interface WSMessage {
    type:
    | "chat_response"
    | "chat_stream"
    | "chat_done"
    | "campaign_update"
    | "budget_alert"
    | "competitor_alert"
    | "error"
    | "pong";
    payload: Record<string, unknown>;
    timestamp: string;
    model?: "gpt-4o" | "claude-4.6";
}

export interface WSSendMessage {
    type: "chat" | "subscribe" | "unsubscribe" | "ping";
    payload: Record<string, unknown>;
}

// ─── Configuration ──────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://admasterai.nobleblocks.com/ws";
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 30000;

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useWebSocket(autoConnect = true) {
    const [status, setStatus] = useState<WSStatus>("disconnected");
    const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
    const [messageHistory, setMessageHistory] = useState<WSMessage[]>([]);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
    const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        // Don't connect if WS_URL is the default placeholder in dev
        if (!process.env.NEXT_PUBLIC_WS_URL && typeof window !== "undefined" && window.location.hostname === "localhost") {
            console.log("[WS] Dev mode — WebSocket disabled. Set NEXT_PUBLIC_WS_URL to enable.");
            return;
        }

        try {
            setStatus("connecting");
            const ws = new WebSocket(WS_URL);

            ws.onopen = () => {
                setStatus("connected");
                reconnectAttempts.current = 0;
                console.log("[WS] Connected to", WS_URL);

                // Start heartbeat
                heartbeatTimer.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: "ping", payload: {} }));
                    }
                }, HEARTBEAT_INTERVAL);
            };

            ws.onmessage = (event) => {
                try {
                    const msg: WSMessage = JSON.parse(event.data);
                    setLastMessage(msg);
                    setMessageHistory((prev) => [...prev.slice(-100), msg]); // Keep last 100
                } catch {
                    console.error("[WS] Failed to parse message:", event.data);
                }
            };

            ws.onclose = (event) => {
                setStatus("disconnected");
                cleanup();

                if (!event.wasClean && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts.current++;
                    const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current - 1);
                    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})...`);
                    reconnectTimer.current = setTimeout(connect, delay);
                }
            };

            ws.onerror = () => {
                setStatus("error");
            };

            wsRef.current = ws;
        } catch (err) {
            console.error("[WS] Connection error:", err);
            setStatus("error");
        }
    }, []);

    const cleanup = () => {
        if (heartbeatTimer.current) {
            clearInterval(heartbeatTimer.current);
            heartbeatTimer.current = null;
        }
    };

    const disconnect = useCallback(() => {
        if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current);
            reconnectTimer.current = null;
        }
        cleanup();
        reconnectAttempts.current = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect
        if (wsRef.current) {
            wsRef.current.close(1000, "Client disconnect");
            wsRef.current = null;
        }
        setStatus("disconnected");
    }, []);

    const send = useCallback((msg: WSSendMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
            return true;
        }
        console.warn("[WS] Cannot send — not connected");
        return false;
    }, []);

    useEffect(() => {
        if (autoConnect) {
            connect();
        }
        return () => {
            disconnect();
        };
    }, [autoConnect, connect, disconnect]);

    return {
        status,
        lastMessage,
        messageHistory,
        send,
        connect,
        disconnect,
    };
}

// ─── Message Builders ───────────────────────────────────────────────────────

export const wsMessages = {
    chat: (message: string, model?: "gpt-4o" | "claude-4.6"): WSSendMessage => ({
        type: "chat",
        payload: { message, model: model || "gpt-4o" },
    }),

    subscribe: (channel: string): WSSendMessage => ({
        type: "subscribe",
        payload: { channel },
    }),

    unsubscribe: (channel: string): WSSendMessage => ({
        type: "unsubscribe",
        payload: { channel },
    }),
};
