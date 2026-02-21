export type Subject = {
    id: string;
    subjectCode: string;
    subjectName: string;
    createdAt: string; // ISO datetime
};

export type Assignment = {
    id: string;
    subjectId: string;
    title: string;
    dueDate: string | null; // ISO date YYYY-MM-DD or null
    status: "TODO" | "IN_PROGRESS" | "DONE";
    createdAt: string; // ISO datetime
};

export type PlannerData = {
    version: 1;
    subjects: Subject[];
    assignments: Assignment[];
};

export function createEmptyPlannerData(): PlannerData {
    return {
        version: 1,
        subjects: [],
        assignments: []
    };
}

export function loadPlannerData(): PlannerData {
    try {
        if (typeof window === "undefined") return createEmptyPlannerData();
        const stored = localStorage.getItem("studyPlannerData:v1");
        if (!stored) {
            return createEmptyPlannerData();
        }
        const parsed = JSON.parse(stored);

        // Minimal validation
        if (!parsed || !Array.isArray(parsed.subjects) || !Array.isArray(parsed.assignments)) {
            return createEmptyPlannerData();
        }
        return parsed as PlannerData;
    } catch (err) {
        console.error("Failed to parse planner data:", err);
        return createEmptyPlannerData();
    }
}

export function savePlannerData(data: PlannerData): void {
    try {
        if (typeof window === "undefined") return;
        localStorage.setItem("studyPlannerData:v1", JSON.stringify(data));
    } catch (err) {
        console.error("Failed to save planner data:", err);
    }
}

export function resetPlannerData(): void {
    try {
        if (typeof window === "undefined") return;
        localStorage.removeItem("studyPlannerData:v1");
    } catch (err) {
        console.error("Failed to reset planner data:", err);
    }
}
