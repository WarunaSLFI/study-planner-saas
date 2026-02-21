"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useState,
  useEffect,
  useMemo
} from "react";
import type { AssignmentItem, AssignmentStatus } from "@/components/AssignmentsTable";
import { getAssignmentStatus } from "@/lib/assignmentStatus";
import {
  type PlannerData,
  loadPlannerData,
  savePlannerData,
  createEmptyPlannerData,
  resetPlannerData as resetLocalPlannerData
} from "@/lib/plannerData";

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

type AppDataContextValue = {
  subjects: SubjectItem[];
  assignments: AssignmentItem[];
  activity: ActivityItem[];
  addSubject: (name: string, code: string) => void;
  editSubject: (id: string, name: string, code: string) => { success: boolean; error?: string };
  deleteSubject: (id: string) => void;
  addSubjectsBulk: (rows: import("@/lib/parseSubjects").ParsedSubjectRow[]) => { addedCount: number; skippedCount: number };
  addAssignmentsBulk: (parsedAssignments: import("@/lib/parseAssignments").ParsedAssignmentRow[]) => void;
  addAssignment: (assignmentData: AddAssignmentInput) => void;
  updateAssignment: (id: string, updatedData: Partial<AssignmentItem>) => void;
  deleteAssignment: (id: string) => void;
  toggleAssignmentCompletion: (id: string) => void;
  resetData: () => void;
  exportData: () => string;
  importData: (jsonString: string) => boolean;
};

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

export default function AppDataProvider({ children }: AppDataProviderProps) {
  const [plannerData, setPlannerData] = useState<PlannerData>(createEmptyPlannerData());
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity);
  const [isClient, setIsClient] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const data = loadPlannerData();

      // Migration for legacy users so they don't break/lose existing data
      if (data.subjects.length === 0 && data.assignments.length === 0) {
        const legacyData = localStorage.getItem("assignment-tracker-data");
        if (legacyData) {
          const parsed = JSON.parse(legacyData);

          if (parsed.subjects || parsed.courses) {
            const oldSubjects = parsed.subjects || parsed.courses;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.subjects = oldSubjects.map((s: any) => ({
              id: s.id,
              subjectCode: s.code || "UNKNOWN",
              subjectName: s.name,
              createdAt: new Date().toISOString()
            }));
          }
          if (parsed.assignments) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.assignments = parsed.assignments.map((a: any) => ({
              id: a.id,
              subjectId: a.subjectId || a.courseId,
              title: a.title,
              dueDate: a.dueDate || null,
              status: a.isCompleted ? "DONE" : "TODO",
              createdAt: a.createdAt || new Date().toISOString()
            }));
          }
          if (parsed.activity) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setActivity(parsed.activity.map((a: any) => ({ ...a, subjectName: a.subjectName || a.courseName })));
          }
        }
      } else {
        // Load activity normally if migrating isn't necessary
        const storedActivity = localStorage.getItem("studyPlannerActivity:v1");
        if (storedActivity) {
          try { setActivity(JSON.parse(storedActivity)); } catch (e) { console.error(e); }
        } else {
          // If upgraded but no activity found, fallback to legacy activity
          const legacyData = localStorage.getItem("assignment-tracker-data");
          if (legacyData) {
            try {
              const parsedActivity = JSON.parse(legacyData).activity;
              if (parsedActivity) setActivity(parsedActivity);
            } catch (e) { console.error(e); }
          }
        }
      }

      setPlannerData(data);
    } catch (e) {
      console.error("Failed to parse local storage data:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (isHydrated && isClient) {
      savePlannerData(plannerData);
      localStorage.setItem("studyPlannerActivity:v1", JSON.stringify(activity));
    }
  }, [plannerData, activity, isClient, isHydrated]);

  // Expose the mapped legacy state cleanly
  const subjects: SubjectItem[] = useMemo(() => {
    return plannerData.subjects.map(s => ({
      id: s.id,
      name: s.subjectName,
      code: s.subjectCode
    }));
  }, [plannerData.subjects]);

  const assignments: AssignmentItem[] = useMemo(() => {
    return plannerData.assignments.map(a => {
      const subject = plannerData.subjects.find(s => s.id === a.subjectId);
      return {
        id: a.id,
        title: a.title,
        subjectId: a.subjectId,
        subject: subject ? subject.subjectName : "Unknown Subject",
        dueDate: a.dueDate || "",
        isCompleted: a.status === "DONE",
        score: "",
        createdAt: a.createdAt
      };
    });
  }, [plannerData.assignments, plannerData.subjects]);

  const addSubject = (name: string, code: string) => {
    const trimmedName = name.trim();
    if (!trimmedName || !code.trim()) return;

    setPlannerData(prev => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        {
          id: createSubjectId(trimmedName),
          subjectName: trimmedName,
          subjectCode: code.trim(),
          createdAt: new Date().toISOString()
        }
      ]
    }));
  };

  const editSubject = (id: string, name: string, code: string): { success: boolean; error?: string } => {
    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    if (!trimmedName || !trimmedCode) return { success: false, error: "Name and code are required." };

    // Check for duplicate code (case-insensitive) among OTHER subjects
    const duplicate = plannerData.subjects.find(
      s => s.id !== id && s.subjectCode.trim().toUpperCase() === trimmedCode.toUpperCase()
    );
    if (duplicate) {
      return { success: false, error: `Subject code "${trimmedCode}" is already used by "${duplicate.subjectName}".` };
    }

    setPlannerData(prev => ({
      ...prev,
      subjects: prev.subjects.map(s =>
        s.id === id
          ? { ...s, subjectName: trimmedName, subjectCode: trimmedCode }
          : s
      )
    }));
    return { success: true };
  };

  const deleteSubject = (id: string) => {
    // Cascade delete: remove subject + all its assignments
    setPlannerData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s.id !== id),
      assignments: prev.assignments.filter(a => a.subjectId !== id)
    }));
    // Remove related activity items
    setActivity(prev => prev.filter(a => {
      // Remove activity for assignments belonging to this subject
      const relatedAssignmentIds = new Set(
        plannerData.assignments.filter(asg => asg.subjectId === id).map(asg => asg.id)
      );
      return !relatedAssignmentIds.has(a.assignmentId);
    }));
  };

  const addSubjectsBulk = (rows: import("@/lib/parseSubjects").ParsedSubjectRow[]) => {
    let addedCount = 0;
    let skippedCount = 0;

    setPlannerData(prev => {
      const existingCodes = new Set(prev.subjects.map((s) => s.subjectCode.trim().toUpperCase()));
      const newSubjects: import("@/lib/plannerData").Subject[] = [];

      for (const row of rows) {
        const cleanCode = row.code.trim().toUpperCase();
        if (!existingCodes.has(cleanCode)) {
          newSubjects.push({
            id: createSubjectId(row.name),
            subjectName: row.name.trim(),
            subjectCode: row.code.trim(),
            createdAt: new Date().toISOString()
          });
          existingCodes.add(cleanCode);
          addedCount++;
        } else {
          skippedCount++;
        }
      }

      if (newSubjects.length > 0) {
        return {
          ...prev,
          subjects: [...prev.subjects, ...newSubjects]
        };
      }
      return prev;
    });

    return { addedCount, skippedCount };
  };

  const addAssignmentsBulk = (parsedAssignments: import("@/lib/parseAssignments").ParsedAssignmentRow[]) => {
    const now = new Date().toISOString();

    setPlannerData(prev => {
      const newAssignmentsToAdd: import("@/lib/plannerData").Assignment[] = [];
      const newSubjectsToAdd: import("@/lib/plannerData").Subject[] = [];
      const newActivityToAdd: ActivityItem[] = [];

      // To deduplicate assignments: Subject Code + Title + Due Date
      const getAssignmentKey = (subjectId: string, title: string, dueDate: string | null) => {
        return `${subjectId}-${title.toLowerCase().trim()}-${dueDate || "nodate"}`;
      };

      const existingAssignmentKeys = new Set(
        prev.assignments.map(a => getAssignmentKey(a.subjectId, a.title, a.dueDate))
      );

      const tempSubjects = [...prev.subjects];

      for (const parsed of parsedAssignments) {
        let subjectId = "";
        let finalSubjectName = "Unknown Subject";

        if (parsed.subjectCode) {
          const cleanCode = parsed.subjectCode.trim().toUpperCase();
          const existingSubject = tempSubjects.find(s => s.subjectCode.trim().toUpperCase() === cleanCode);

          if (existingSubject) {
            subjectId = existingSubject.id;
            finalSubjectName = existingSubject.subjectName;
          } else {
            // We need to create a new subject
            finalSubjectName = parsed.subjectName || `Subject ${cleanCode}`;
            const newSubjectId = createSubjectId(finalSubjectName);

            const newSub = {
              id: newSubjectId,
              subjectName: finalSubjectName,
              subjectCode: parsed.subjectCode.trim(),
              createdAt: now
            };

            newSubjectsToAdd.push(newSub);
            tempSubjects.push(newSub); // Add to temp so subsequent items in this loop find it
            subjectId = newSubjectId;
          }
        } else {
          // No subject code provided in the parsed row. 
          const nameToFind = parsed.subjectName ? parsed.subjectName.trim().toLowerCase() : "";
          const existingByName = tempSubjects.find(s => s.subjectName.toLowerCase() === nameToFind);
          if (existingByName) {
            subjectId = existingByName.id;
            finalSubjectName = existingByName.subjectName;
          } else if (parsed.subjectName) {
            finalSubjectName = parsed.subjectName.trim();
            const newSubjectId = createSubjectId(finalSubjectName);
            const newSub = {
              id: newSubjectId,
              subjectName: finalSubjectName,
              subjectCode: "UNKNOWN",
              createdAt: now
            };
            newSubjectsToAdd.push(newSub);
            tempSubjects.push(newSub);
            subjectId = newSubjectId;
          } else {
            // completely unknown
            const unknownSub = tempSubjects.find(s => s.subjectCode === "UNKNOWN" && s.subjectName === "Unknown Subject");
            if (unknownSub) {
              subjectId = unknownSub.id;
            } else {
              const newSubjectId = createSubjectId("Unknown Subject");
              const newSub = {
                id: newSubjectId,
                subjectName: "Unknown Subject",
                subjectCode: "UNKNOWN",
                createdAt: now
              };
              newSubjectsToAdd.push(newSub);
              tempSubjects.push(newSub);
              subjectId = newSubjectId;
            }
          }
        }

        // Deduplication check
        const assignmentKey = getAssignmentKey(subjectId, parsed.title, parsed.dueDate);
        if (existingAssignmentKeys.has(assignmentKey)) {
          continue; // Skip this one, it already exists
        }

        // Add it
        const newAssignmentId = `assignment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        newAssignmentsToAdd.push({
          id: newAssignmentId,
          title: parsed.title.trim(),
          subjectId: subjectId,
          dueDate: parsed.dueDate || null,
          status: "TODO",
          createdAt: now,
        });

        newActivityToAdd.push({
          id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          assignmentId: newAssignmentId,
          type: "assignment_created",
          title: parsed.title.trim(),
          subjectName: finalSubjectName,
          createdAt: now,
          dueDate: parsed.dueDate || "",
          status: getAssignmentStatus(parsed.dueDate || "", false),
        });

        // Add to existing keys to prevent duplicates *within* the bulk import itself
        existingAssignmentKeys.add(assignmentKey);
      }

      if (newActivityToAdd.length > 0) {
        setActivity(act => [...newActivityToAdd, ...act].slice(0, 8));
      }

      if (newAssignmentsToAdd.length > 0 || newSubjectsToAdd.length > 0) {
        return {
          ...prev,
          subjects: [...prev.subjects, ...newSubjectsToAdd],
          assignments: [...newAssignmentsToAdd, ...prev.assignments] // append new assignments first
        };
      }
      return prev;
    });
  };

  const addAssignment = (assignmentData: AddAssignmentInput) => {
    const now = new Date().toISOString();
    const newAssignmentId = `assignment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let subjectName = "Unknown Subject";

    setPlannerData(prev => {
      const relatedSubject = prev.subjects.find(
        (sub) => sub.id === assignmentData.subjectId,
      );
      subjectName = relatedSubject?.subjectName ?? "Unknown Subject";

      const newAssignment: import("@/lib/plannerData").Assignment = {
        id: newAssignmentId,
        title: assignmentData.title.trim(),
        subjectId: assignmentData.subjectId,
        dueDate: assignmentData.dueDate || null,
        status: assignmentData.isCompleted ? "DONE" : "TODO",
        createdAt: now,
      };

      return {
        ...prev,
        assignments: [newAssignment, ...prev.assignments]
      };
    });

    setActivity((previousActivity) => {
      const newActivityItem: ActivityItem = {
        id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        assignmentId: newAssignmentId,
        type: "assignment_created",
        title: assignmentData.title.trim(),
        subjectName,
        createdAt: now,
        dueDate: assignmentData.dueDate,
        status: getAssignmentStatus(assignmentData.dueDate, assignmentData.isCompleted),
      };
      return [newActivityItem, ...previousActivity].slice(0, 8);
    });
  };

  const updateAssignment = (id: string, updatedData: Partial<AssignmentItem>) => {
    setPlannerData(prev => ({
      ...prev,
      assignments: prev.assignments.map(a => {
        if (a.id === id) {
          return {
            ...a,
            // Apply the matching mapped properties to the new model
            title: updatedData.title !== undefined ? updatedData.title : a.title,
            subjectId: updatedData.subjectId !== undefined ? updatedData.subjectId : a.subjectId,
            dueDate: updatedData.dueDate !== undefined ? updatedData.dueDate : a.dueDate,
            status: updatedData.isCompleted !== undefined ? (updatedData.isCompleted ? "DONE" : "TODO") : a.status
          };
        }
        return a;
      })
    }));
  };

  const deleteAssignment = (id: string) => {
    setPlannerData(prev => ({
      ...prev,
      assignments: prev.assignments.filter(a => a.id !== id)
    }));
    setActivity(prev => prev.filter(a => a.assignmentId !== id));
  };

  const toggleAssignmentCompletion = (id: string) => {
    let affectedAssignmentTitle = "";
    let affectedSubjectName = "";
    let affectedDueDate = "";
    let newCompletedState = false;

    setPlannerData(prev => {
      const mappedAssignments = prev.assignments.map(a => {
        if (a.id === id) {
          newCompletedState = a.status !== "DONE";
          affectedAssignmentTitle = a.title;
          affectedDueDate = a.dueDate || "";

          const sub = prev.subjects.find(s => s.id === a.subjectId);
          affectedSubjectName = sub ? sub.subjectName : "Unknown Subject";

          return {
            ...a,
            status: newCompletedState ? "DONE" : "TODO" as "DONE" | "TODO" | "IN_PROGRESS"
          };
        }
        return a;
      });

      return { ...prev, assignments: mappedAssignments };
    });

    // Timeout hack to wait for React to process the state above and grab correct title if undefined, 
    // but in realistic scenarios title/date are always grabbed cleanly from the map map due to closures capturing correctly in next render?
    // Actually using those closure-based vars works immediately.
    setTimeout(() => {
      if (affectedAssignmentTitle) {
        setActivity((previousActivity) => {
          const now = new Date().toISOString();
          const actionType = newCompletedState ? "assignment_completed" : "assignment_uncompleted";

          const newActivityItem: ActivityItem = {
            id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            assignmentId: id,
            type: actionType,
            title: affectedAssignmentTitle,
            subjectName: affectedSubjectName,
            createdAt: now,
            dueDate: affectedDueDate,
            status: getAssignmentStatus(affectedDueDate, newCompletedState),
          };
          return [newActivityItem, ...previousActivity].slice(0, 8);
        });
      }
    }, 0);
  };

  const resetData = () => {
    resetLocalPlannerData();
    localStorage.removeItem("studyPlannerActivity:v1");
    localStorage.removeItem("assignment-tracker-data"); // cleanup legacy 
    setPlannerData(createEmptyPlannerData());
    setActivity(initialActivity); // Set back to minimal defaults
  };

  const exportData = (): string => {
    return JSON.stringify({ plannerData, activity });
  };

  const importData = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);

      // Handle importing an exported package that contains both plannerData and activity
      if (parsed.plannerData && parsed.plannerData.subjects && parsed.plannerData.assignments) {
        setPlannerData(parsed.plannerData);
        if (parsed.activity) setActivity(parsed.activity);
        return true;
      }

      // Legacy backwards-compatibility
      const importedSubjects = parsed.subjects || parsed.courses;
      if (Array.isArray(importedSubjects) && Array.isArray(parsed.assignments) && Array.isArray(parsed.activity)) {
        const newData = createEmptyPlannerData();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newData.subjects = importedSubjects.map((s: any) => ({
          id: s.id,
          subjectCode: s.code || "UNKNOWN",
          subjectName: s.name,
          createdAt: new Date().toISOString()
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newData.assignments = parsed.assignments.map((a: any) => ({
          id: a.id,
          subjectId: a.subjectId || a.courseId,
          title: a.title,
          dueDate: a.dueDate || null,
          status: a.isCompleted ? "DONE" : "TODO",
          createdAt: a.createdAt || new Date().toISOString()
        }));
        setPlannerData(newData);
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
    editSubject,
    deleteSubject,
    addSubjectsBulk,
    addAssignmentsBulk,
    addAssignment,
    updateAssignment,
    deleteAssignment,
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
