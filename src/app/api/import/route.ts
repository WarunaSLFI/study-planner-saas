import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(request: Request) {
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

    try {
        const body = await request.json();
        const { subjects, assignments } = body;

        if (!Array.isArray(subjects) || !Array.isArray(assignments)) {
            return NextResponse.json({ error: "Invalid data format. Expected { subjects: [], assignments: [] }" }, { status: 400 });
        }

        // Delete existing data
        await supabase.from("assignments").delete().eq("user_id", user.id);
        await supabase.from("subjects").delete().eq("user_id", user.id);

        // Insert subjects — map old IDs to new IDs
        const idMap = new Map<string, string>();
        for (const s of subjects) {
            const { data } = await supabase.from("subjects").insert({
                user_id: user.id,
                subject_name: s.subject_name || s.name,
                subject_code: s.subject_code || s.code,
            }).select("id").single();

            if (data) {
                idMap.set(s.id, data.id);
            }
        }

        // Insert assignments with remapped subject_id
        let importedCount = 0;
        for (const a of assignments) {
            const newSubjectId = idMap.get(a.subject_id || a.subjectId);
            if (!newSubjectId) continue;

            await supabase.from("assignments").insert({
                user_id: user.id,
                subject_id: newSubjectId,
                title: a.title,
                due_date: a.due_date || a.dueDate || null,
                is_completed: a.is_completed ?? a.isCompleted ?? false,
            });
            importedCount++;
        }

        return NextResponse.json({
            success: true,
            subjects: idMap.size,
            assignments: importedCount,
        });
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
}
