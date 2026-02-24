/**
 * AdMaster Pro — WebSocket Server
 *
 * Runs as a separate process alongside Next.js (PM2 managed).
 * Provides real-time updates to connected clients:
 *   - Campaign status changes
 *   - Budget/spend alerts
 *   - Notification pushes
 *   - AI chat streaming (future)
 *
 * Caddy proxies wss://admasterai.nobleblocks.com/ws → localhost:3001
 *
 * Usage:
 *   node ws-server.js          (direct)
 *   pm2 start ws-server.js     (managed)
 */

const { WebSocketServer, WebSocket } = require("ws");
const http = require("http");

const PORT = parseInt(process.env.WS_PORT || "3001", 10);

// ─── HTTP server (for health checks) ────────────────────────────────────────

const server = http.createServer((req, res) => {
    if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            status: "ok",
            clients: wss ? wss.clients.size : 0,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        }));
    } else {
        res.writeHead(404);
        res.end();
    }
});

// ─── WebSocket server ───────────────────────────────────────────────────────

const wss = new WebSocketServer({ server, path: "/ws" });

// Track connected clients with metadata
const clients = new Map();

wss.on("connection", (ws, req) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Parse session from cookie if available
    let userEmail = "anonymous";
    const cookies = req.headers.cookie || "";
    try {
        const sessionMatch = cookies.match(/session=([^;]+)/);
        if (sessionMatch) {
            const session = JSON.parse(decodeURIComponent(sessionMatch[1]));
            userEmail = session.email || "anonymous";
        }
    } catch {
        // ignore parse errors
    }

    clients.set(ws, {
        id: clientId,
        ip: clientIp,
        email: userEmail,
        connectedAt: new Date().toISOString(),
        subscriptions: new Set(),
    });

    console.log(`[WS] Connected: ${clientId} (${userEmail}) — ${wss.clients.size} total`);

    // Send welcome message
    send(ws, {
        type: "connected",
        payload: {
            clientId,
            serverTime: new Date().toISOString(),
            message: "Connected to AdMaster Pro real-time updates",
        },
    });

    // Handle incoming messages
    ws.on("message", (data) => {
        try {
            const msg = JSON.parse(data.toString());
            handleMessage(ws, msg);
        } catch (err) {
            send(ws, { type: "error", payload: { message: "Invalid message format" } });
        }
    });

    ws.on("close", () => {
        const client = clients.get(ws);
        console.log(`[WS] Disconnected: ${client?.id} — ${wss.clients.size - 1} remaining`);
        clients.delete(ws);
    });

    ws.on("error", (err) => {
        console.error(`[WS] Error for ${clientId}:`, err.message);
    });
});

// ─── Message Handler ────────────────────────────────────────────────────────

function handleMessage(ws, msg) {
    const client = clients.get(ws);
    if (!client) return;

    switch (msg.type) {
        case "ping":
            send(ws, { type: "pong", payload: { serverTime: new Date().toISOString() } });
            break;

        case "subscribe":
            // Subscribe to a channel (e.g., "campaigns", "budget_alerts", "notifications")
            if (msg.payload?.channel) {
                client.subscriptions.add(msg.payload.channel);
                send(ws, {
                    type: "subscribed",
                    payload: { channel: msg.payload.channel },
                });
                console.log(`[WS] ${client.id} subscribed to ${msg.payload.channel}`);
            }
            break;

        case "unsubscribe":
            if (msg.payload?.channel) {
                client.subscriptions.delete(msg.payload.channel);
                send(ws, {
                    type: "unsubscribed",
                    payload: { channel: msg.payload.channel },
                });
            }
            break;

        default:
            send(ws, { type: "error", payload: { message: `Unknown message type: ${msg.type}` } });
    }
}

// ─── Broadcasting ───────────────────────────────────────────────────────────

/**
 * Send a message to a specific client
 */
function send(ws, msg) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            ...msg,
            timestamp: new Date().toISOString(),
        }));
    }
}

/**
 * Broadcast to all connected clients
 */
function broadcast(msg) {
    const data = JSON.stringify({
        ...msg,
        timestamp: new Date().toISOString(),
    });
    wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });
}

/**
 * Broadcast to clients subscribed to a specific channel
 */
function broadcastToChannel(channel, msg) {
    const data = JSON.stringify({
        ...msg,
        timestamp: new Date().toISOString(),
    });
    for (const [ws, client] of clients.entries()) {
        if (ws.readyState === WebSocket.OPEN && client.subscriptions.has(channel)) {
            ws.send(data);
        }
    }
}

/**
 * Send to a specific user by email
 */
function sendToUser(email, msg) {
    const data = JSON.stringify({
        ...msg,
        timestamp: new Date().toISOString(),
    });
    for (const [ws, client] of clients.entries()) {
        if (ws.readyState === WebSocket.OPEN && client.email === email) {
            ws.send(data);
        }
    }
}

// ─── Periodic notifications (demonstrates live updates) ─────────────────────

// Send a heartbeat every 30 seconds to keep connections alive
setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        }
    });
}, 30000);

// Log stats every 60 seconds
setInterval(() => {
    const count = wss.clients.size;
    if (count > 0) {
        console.log(`[WS] Active connections: ${count}`);
    }
}, 60000);

// ─── Start server ───────────────────────────────────────────────────────────

server.listen(PORT, () => {
    console.log(`[WS] WebSocket server running on port ${PORT}`);
    console.log(`[WS] Health check: http://localhost:${PORT}/health`);
    console.log(`[WS] WebSocket endpoint: ws://localhost:${PORT}/ws`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("[WS] Shutting down...");
    wss.clients.forEach((ws) => {
        send(ws, { type: "server_shutdown", payload: { message: "Server is restarting" } });
        ws.close(1001, "Server shutdown");
    });
    server.close(() => {
        console.log("[WS] Server closed");
        process.exit(0);
    });
});

// Export for potential programmatic use
module.exports = { broadcast, broadcastToChannel, sendToUser };
