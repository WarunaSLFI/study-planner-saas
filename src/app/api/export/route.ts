import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";

export async function GET(request: Request) {
    const ip = getClientIp(request);
    const result = rateLimit(ip);

    if (!result.allowed) {
        return rateLimitResponse(result.resetAt);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [subjectsRes, assignmentsRes] = await Promise.all([
        supabase.from("subjects").select("id, subject_name, subject_code, created_at").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("assignments").select("id, subject_id, title, due_date, is_completed, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
        subjects: subjectsRes.data || [],
        assignments: assignmentsRes.data || [],
        exportedAt: new Date().toISOString(),
    });
}
