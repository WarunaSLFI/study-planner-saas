"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import type { AssignmentItem, AssignmentStatus } from "@/components/AssignmentsTable";

export type SubjectItem = {
  id: string;
  name: string;
  code: string;
};

export type AddAssignmentInput = {
  title: string;
  subjectId: string;
  dueDate: string;
  isCompleted: boolean;
  score: string;
};

export type ActivityItem = {
  id: string;
  assignmentId: string;
  type: "assignment_created" | "assignment_completed" | "assignment_uncompleted";
  title: string;
  subjectName: string;
  createdAt: string;
  dueDate: string; // fallback if assignment removed
  status: AssignmentStatus;
};

export type AppDataState = {
  subjects: SubjectItem[];
  assignments: AssignmentItem[];
  activity: ActivityItem[];
};

type AppDataContextValue = {
  subjects: SubjectItem[];
  assignments: AssignmentItem[];
  activity: ActivityItem[];
  addSubject: (name: string, code: string) => void;
  addSubjectsBulk: (rows: import("@/lib/parseSubjects").ParsedSubjectRow[]) => void;
  addAssignment: (assignmentData: AddAssignmentInput) => void;
  updateAssignment: (id: string, updatedData: Partial<AssignmentItem>) => void;
  toggleAssignmentCompletion: (id: string) => void;
  resetData: () => void;
  exportData: () => string;
  importData: (jsonString: string) => boolean;
};

const initialSubjects: SubjectItem[] = [
  { id: "subject-operating-systems", name: "Operating Systems", code: "5G00DL86" },
  { id: "subject-datapipelines", name: "Datapipelines", code: "NN00FC85" },
  { id: "subject-finnish-society", name: "Finnish Society", code: "5G00GC28" },
];

const initialAssignments: AssignmentItem[] = [
  {
    id: "assignment-1",
    title: "Operating Systems Exercise 4",
    subjectId: "subject-operating-systems",
    course: "Operating Systems",
    dueDate: "2026-02-25",
    isCompleted: true,
    score: "9/10",
    createdAt: "2026-02-15T10:00:00.000Z",
  },
  {
    id: "assignment-2",
    title: "Datapipelines Project",
    subjectId: "subject-datapipelines",
    course: "Datapipelines",
    dueDate: "2026-03-10",
    isCompleted: false,
    score: "24/30",
    createdAt: "2026-02-18T14:30:00.000Z",
  },
  {
    id: "assignment-3",
    title: "Finnish Society Quiz",
    subjectId: "subject-finnish-society",
    course: "Finnish Society",
    dueDate: "2026-02-20",
    isCompleted: false,
    score: "8/10",
    createdAt: "2026-02-10T09:15:00.000Z",
  },
];

import { getAssignmentStatus } from "@/lib/assignmentStatus";

const initialActivity: ActivityItem[] = [
  {
    id: "activity-1",
    assignmentId: "assignment-2",
    type: "assignment_created",
    title: "Datapipelines Project",
    subjectName: "Datapipelines",
    createdAt: "2026-02-18T14:30:00.000Z",
    dueDate: "2026-03-10",
    status: "Upcoming",
  },
  {
    id: "activity-2",
    assignmentId: "assignment-1",
    type: "assignment_created",
    title: "Operating Systems Exercise 4",
    subjectName: "Operating Systems",
    createdAt: "2026-02-15T10:00:00.000Z",
    dueDate: "2026-02-25",
    status: "Completed",
  },
  {
    id: "activity-3",
    assignmentId: "assignment-3",
    type: "assignment_created",
    title: "Finnish Society Quiz",
    subjectName: "Finnish Society",
    createdAt: "2026-02-10T09:15:00.000Z",
    dueDate: "2026-02-20",
    status: "Overdue",
  }
];

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

type AppDataProviderProps = {
  children: ReactNode;
};

function createSubjectId(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `subject-${slug || "new"}-${Date.now()}`;
}

export default function AppDataProvider({ children }: AppDataProviderProps) {
  const [subjects, setSubjects] = useState<SubjectItem[]>(initialSubjects);
  const [assignments, setAssignments] =
    useState<AssignmentItem[]>(initialAssignments);
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity);
  const [isClient, setIsClient] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedData = localStorage.getItem("assignment-tracker-data");
      if (storedData) {
        const parsed: AppDataState = JSON.parse(storedData);
        // Map courses arrays to subjects arrays for migrating users seamlessly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loadedSubjects = parsed.subjects || (parsed as any).courses;
        if (loadedSubjects) {
          // Add default code if migrating
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setSubjects(loadedSubjects.map((s: any) => ({ ...s, code: s.code || "UNKNOWN" })));
        }
        if (parsed.assignments) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setAssignments(parsed.assignments.map((a: any) => ({ ...a, subjectId: a.subjectId || a.courseId })));
        }
        if (parsed.activity) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setActivity(parsed.activity.map((a: any) => ({ ...a, subjectName: a.subjectName || a.courseName })));
        }
      }
    } catch (e) {
      console.error("Failed to parse local storage data:", e);
      localStorage.removeItem("assignment-tracker-data");
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(
        "assignment-tracker-data",
        JSON.stringify({ subjects, assignments, activity }),
      );
    }
  }, [subjects, assignments, activity, isClient]);

  const addSubject = (name: string, code: string) => {
    const trimmedName = name.trim();
    if (!trimmedName || !code.trim()) return;

    setSubjects((prev) => [
      ...prev,
      { id: createSubjectId(trimmedName), name: trimmedName, code: code.trim() },
    ]);
  };

  const addSubjectsBulk = (rows: import("@/lib/parseSubjects").ParsedSubjectRow[]) => {
    setSubjects((prev) => {
      const existingCodes = new Set(prev.map((s) => s.code.toLowerCase()));
      const newSubjects: SubjectItem[] = [];

      for (const row of rows) {
        const cleanCode = row.code.trim();
        if (!existingCodes.has(cleanCode.toLowerCase())) {
          newSubjects.push({
            id: createSubjectId(row.name),
            name: row.name.trim(),
            code: cleanCode,
          });
          existingCodes.add(cleanCode.toLowerCase());
        }
      }

      return [...prev, ...newSubjects];
    });
  };

  const addAssignment = (assignmentData: AddAssignmentInput) => {
    const relatedSubject = subjects.find(
      (sub) => sub.id === assignmentData.subjectId,
    );
    const subjectName = relatedSubject?.name ?? "Unknown Subject";
    const now = new Date().toISOString();
    const newAssignmentId = `assignment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setAssignments((previousAssignments) => [
      {
        id: newAssignmentId,
        title: assignmentData.title.trim(),
        subjectId: assignmentData.subjectId,
        course: subjectName,
        dueDate: assignmentData.dueDate,
        isCompleted: assignmentData.isCompleted,
        score: assignmentData.score,
        createdAt: now,
      },
      ...previousAssignments,
    ]);

    setActivity((previousActivity) => {
      const newActivity: ActivityItem = {
        id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        assignmentId: newAssignmentId,
        type: "assignment_created",
        title: assignmentData.title.trim(),
        subjectName,
        createdAt: now,
        dueDate: assignmentData.dueDate,
        status: getAssignmentStatus(assignmentData.dueDate, assignmentData.isCompleted),
      };
      return [newActivity, ...previousActivity].slice(0, 8);
    });
  };

  const updateAssignment = (id: string, updatedData: Partial<AssignmentItem>) => {
    setAssignments((previousAssignments) =>
      previousAssignments.map((assignment) =>
        assignment.id === id
          ? {
            ...assignment,
            ...updatedData,
            // Update course name if subjectId changes
            course:
              updatedData.subjectId && updatedData.subjectId !== assignment.subjectId
                ? subjects.find((c) => c.id === updatedData.subjectId)?.name ?? "Unknown Subject"
                : updatedData.course ?? assignment.course,
          }
          : assignment,
      ),
    );
  };

  const toggleAssignmentCompletion = (id: string) => {
    let updatedAssignment: AssignmentItem | undefined;

    setAssignments((previousAssignments) =>
      previousAssignments.map((assignment) => {
        if (assignment.id === id) {
          updatedAssignment = {
            ...assignment,
            isCompleted: !assignment.isCompleted,
          };
          return updatedAssignment;
        }
        return assignment;
      }),
    );

    if (updatedAssignment) {
      setActivity((previousActivity) => {
        const now = new Date().toISOString();
        const actionType = updatedAssignment!.isCompleted ? "assignment_completed" : "assignment_uncompleted";

        const newActivity: ActivityItem = {
          id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          assignmentId: updatedAssignment!.id,
          type: actionType,
          title: updatedAssignment!.title,
          subjectName: updatedAssignment!.course,
          createdAt: now,
          dueDate: updatedAssignment!.dueDate,
          status: getAssignmentStatus(updatedAssignment!.dueDate, updatedAssignment!.isCompleted),
        };
        return [newActivity, ...previousActivity].slice(0, 8);
      });
    }
  };

  const resetData = () => {
    localStorage.removeItem("assignment-tracker-data");
    setSubjects(initialSubjects);
    setAssignments(initialAssignments);
    setActivity(initialActivity);
  };

  const exportData = (): string => {
    return JSON.stringify({ subjects, assignments, activity });
  };

  const importData = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      // Support old 'courses' arrays on import for backwards compat
      const importedSubjects = parsed.subjects || parsed.courses;

      if (Array.isArray(importedSubjects) && Array.isArray(parsed.assignments) && Array.isArray(parsed.activity)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSubjects(importedSubjects.map((s: any) => ({ ...s, code: s.code || "UNKNOWN" })));
        setAssignments(parsed.assignments);
        setActivity(parsed.activity);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to parse import data", e);
      return false;
    }
  };

  const value: AppDataContextValue = {
    subjects,
    assignments,
    activity,
    addSubject,
    addSubjectsBulk,
    addAssignment,
    updateAssignment,
    toggleAssignmentCompletion,
    resetData,
    exportData,
    importData,
  };

  if (!isHydrated) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider.");
  }

  return context;
}
