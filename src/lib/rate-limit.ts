/**
 * Rate Limiter — In-Memory Sliding Window
 *
 * Provides per-IP and per-key rate limiting for API routes.
 * Uses a sliding window algorithm with automatic cleanup of stale entries.
 *
 * Usage:
 *   const limiter = rateLimit({ interval: 60_000, limit: 10 });
 *   const result = limiter.check(ip);
 *   if (!result.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimitEntry {
    timestamps: number[];
}

interface RateLimitConfig {
    /** Time window in milliseconds (default: 60 000 = 1 minute) */
    interval: number;
    /** Maximum requests allowed within the interval */
    limit: number;
}

interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    /** Unix timestamp (seconds) when the rate limit resets */
    reset: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Periodic cleanup every 5 minutes to prevent memory leaks
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
    if (cleanupTimer) return;
    cleanupTimer = setInterval(() => {
        const now = Date.now();
        for (const [, store] of stores) {
            for (const [key, entry] of store) {
                // Remove entries with no recent activity (> 10 min stale)
                if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < now - 600_000) {
                    store.delete(key);
                }
            }
        }
    }, 300_000); // 5 minutes

    // Don't prevent Node.js from exiting
    if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
        cleanupTimer.unref();
    }
}

/**
 * Create a rate limiter instance.
 *
 * @example
 *   // 10 requests per minute
 *   const limiter = rateLimit({ interval: 60_000, limit: 10 });
 *
 *   // In your API route:
 *   const ip = getClientIP(req);
 *   const { success, remaining, reset } = limiter.check(ip);
 *   if (!success) {
 *     return NextResponse.json(
 *       { error: "Too many requests" },
 *       { status: 429, headers: { "Retry-After": String(reset - Math.floor(Date.now() / 1000)) } }
 *     );
 *   }
 */
export function rateLimit(config: RateLimitConfig) {
    const storeKey = `${config.interval}-${config.limit}`;
    if (!stores.has(storeKey)) {
        stores.set(storeKey, new Map());
    }
    const store = stores.get(storeKey)!;
    startCleanup();

    return {
        check(key: string): RateLimitResult {
            const now = Date.now();
            const windowStart = now - config.interval;

            let entry = store.get(key);
            if (!entry) {
                entry = { timestamps: [] };
                store.set(key, entry);
            }

            // Remove timestamps outside the current window
            entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

            const remaining = Math.max(0, config.limit - entry.timestamps.length);
            const reset = Math.ceil((now + config.interval) / 1000);

            if (entry.timestamps.length >= config.limit) {
                return { success: false, limit: config.limit, remaining: 0, reset };
            }

            entry.timestamps.push(now);
            return { success: true, limit: config.limit, remaining: remaining - 1, reset };
        },
    };
}

/**
 * Extract client IP address from a Next.js request.
 * Checks x-forwarded-for (reverse proxy), x-real-ip, then falls back.
 */
export function getClientIP(req: { headers: { get(name: string): string | null } }): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return req.headers.get("x-real-ip") || "unknown";
}

// ─── Pre-configured limiters for different route types ─────────────────────

/** Auth routes: 5 requests per minute (prevent brute force) */
export const authLimiter = rateLimit({ interval: 60_000, limit: 5 });

/** Chat / AI routes: 20 requests per minute */
export const chatLimiter = rateLimit({ interval: 60_000, limit: 20 });

/** Audit tool: 3 requests per minute (expensive AI call) */
export const auditLimiter = rateLimit({ interval: 60_000, limit: 3 });

/** General API routes: 60 requests per minute */
export const apiLimiter = rateLimit({ interval: 60_000, limit: 60 });

/** Stripe routes: 10 requests per minute */
export const stripeLimiter = rateLimit({ interval: 60_000, limit: 10 });

/** Transcription: 5 requests per minute (expensive) */
export const transcribeLimiter = rateLimit({ interval: 60_000, limit: 5 });

/**
 * Helper: Apply rate limiting and return a 429 response if exceeded.
 * Returns null if the request is within limits.
 */
export function checkRateLimit(
    req: { headers: { get(name: string): string | null } },
    limiter: ReturnType<typeof rateLimit>
): Response | null {
    const ip = getClientIP(req);
    const result = limiter.check(ip);

    if (!result.success) {
        const retryAfter = Math.max(1, result.reset - Math.floor(Date.now() / 1000));
        return new Response(
            JSON.stringify({
                error: "Too many requests. Please try again later.",
                retryAfter,
            }),
            {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Retry-After": String(retryAfter),
                    "X-RateLimit-Limit": String(result.limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": String(result.reset),
                },
            }
        );
    }

    return null;
}
