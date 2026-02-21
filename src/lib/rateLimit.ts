/**
 * Simple in-memory fixed-window rate limiter.
 * 
 * Note: In-memory state resets between serverless cold starts (Vercel lambdas).
 * Acceptable for v1; upgrade to Redis/Upstash for production scale.
 */

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks
const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    for (const [key, entry] of store) {
        if (now > entry.resetAt) {
            store.delete(key);
        }
    }
}

type RateLimitConfig = {
    /** Max requests allowed in the window */
    limit?: number;
    /** Window duration in milliseconds */
    windowMs?: number;
};

type RateLimitResult = {
    allowed: boolean;
    remaining: number;
    resetAt: number;
};

export function rateLimit(
    ip: string,
    config: RateLimitConfig = {}
): RateLimitResult {
    const { limit = 30, windowMs = 10 * 60 * 1000 } = config; // 30 req / 10 min
    const now = Date.now();

    cleanup();

    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
        // New window
        store.set(ip, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    if (entry.count < limit) {
        entry.count++;
        return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
    }

    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
}

/**
 * Helper: extract client IP from a Next.js request.
 */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Helper: create a 429 JSON response with rate limit headers.
 */
export function rateLimitResponse(resetAt: number): Response {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    return new Response(
        JSON.stringify({ error: "Too many requests" }),
        {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "Retry-After": String(Math.max(retryAfter, 1)),
            },
        }
    );
}
