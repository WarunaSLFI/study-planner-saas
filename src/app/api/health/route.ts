import { NextResponse } from "next/server";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";

export async function GET(request: Request) {
    const ip = getClientIp(request);
    const result = rateLimit(ip, { limit: 30, windowMs: 10 * 60 * 1000 });

    if (!result.allowed) {
        return rateLimitResponse(result.resetAt);
    }

    return NextResponse.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        rateLimit: {
            remaining: result.remaining,
            resetsIn: `${Math.ceil((result.resetAt - Date.now()) / 1000)}s`,
        },
    });
}
