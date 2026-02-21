"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { AssignmentItem, AssignmentStatus } from "@/components/AssignmentsTable";
import { getAssignmentStatus } from "@/lib/assignmentStatus";
import { createClient } from "@/lib/supabase/client";

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
  dueDate: string;
  status: AssignmentStatus;
};

type AppDataContextValue = {
  subjects: SubjectItem[];
  assignments: AssignmentItem[];
  activity: ActivityItem[];
  // Loading & error state
  isLoading: boolean;
  globalError: string | null;
  successMessage: string | null;
  savingSubject: boolean;
  savingAssignment: boolean;
  bulkLoading: boolean;
  clearError: () => void;
  // CRUD
  addSubject: (name: string, code: string) => void;
  editSubject: (id: string, name: string, code: string) => Promise<{ success: boolean; error?: string }>;
  deleteSubject: (id: string) => void;
  addSubjectsBulk: (rows: import("@/lib/parseSubjects").ParsedSubjectRow[]) => Promise<{ addedCount: number; skippedCount: number }>;
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

// Raw DB row types
type DbSubject = {
  id: string;
  user_id: string;
  subject_name: string;
  subject_code: string;
  created_at: string;
};

type DbAssignment = {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  due_date: string | null;
  is_completed: boolean;
  created_at: string;
};

export default function AppDataProvider({ children }: AppDataProviderProps) {
  const supabase = createClient();

  const [dbSubjects, setDbSubjects] = useState<DbSubject[]>([]);
  const [dbAssignments, setDbAssignments] = useState<DbAssignment[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Loading & error flags
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingSubject, setSavingSubject] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const clearError = useCallback(() => setGlobalError(null), []);

  const flashSuccess = useCallback((msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  // ── Load data on mount ──────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          setGlobalError(authError.message);
          setIsLoading(false);
          return;
        }
        if (!user) {
          setIsLoading(false);
          return;
        }
        setUserId(user.id);

        const [subjectsRes, assignmentsRes] = await Promise.all([
          supabase.from("subjects").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
          supabase.from("assignments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        ]);

        if (subjectsRes.error) throw subjectsRes.error;
        if (assignmentsRes.error) throw assignmentsRes.error;

        if (subjectsRes.data) setDbSubjects(subjectsRes.data);
        if (assignmentsRes.data) setDbAssignments(assignmentsRes.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Failed to load data.";
        setGlobalError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [supabase]);

  // ── Derived state (same shape as before) ────────────────────────────
  const subjects: SubjectItem[] = useMemo(() => {
    return dbSubjects.map(s => ({
      id: s.id,
      name: s.subject_name,
      code: s.subject_code,
    }));
  }, [dbSubjects]);

  const assignments: AssignmentItem[] = useMemo(() => {
    return dbAssignments.map(a => {
      const subject = dbSubjects.find(s => s.id === a.subject_id);
      return {
        id: a.id,
        title: a.title,
        subjectId: a.subject_id,
        subject: subject ? subject.subject_name : "Unknown Subject",
        dueDate: a.due_date || "",
        isCompleted: a.is_completed,
        score: "",
        createdAt: a.created_at,
      };
    });
  }, [dbAssignments, dbSubjects]);

  // ── Subject CRUD ─────────────────────────────────────────────────────
  const addSubject = useCallback(async (name: string, code: string) => {
    if (!userId) return;
    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    if (!trimmedName || !trimmedCode) return;

    setSavingSubject(true);
    setGlobalError(null);
    try {
      const { data, error } = await supabase.from("subjects").insert({
        user_id: userId,
        subject_name: trimmedName,
        subject_code: trimmedCode,
      }).select().single();

      if (error) throw error;
      if (data) setDbSubjects(prev => [...prev, data]);
      flashSuccess("Subject added.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Failed to add subject.";
      setGlobalError(message);
    } finally {
      setSavingSubject(false);
    }
  }, [supabase, userId]);

  const editSubject = useCallback(async (id: string, name: string, code: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    if (!trimmedName || !trimmedCode) return { success: false, error: "Name and code are required." };

    // Check for duplicate code (case-insensitive) among OTHER subjects
    const duplicate = dbSubjects.find(
      s => s.id !== id && s.subject_code.trim().toUpperCase() === trimmedCode.toUpperCase()
    );
    if (duplicate) {
      return { success: false, error: `Subject code "${trimmedCode}" is already used by "${duplicate.subject_name}".` };
    }

    setSavingSubject(true);
    setGlobalError(null);
    try {
      const { error } = await supabase.from("subjects").update({
        subject_name: trimmedName,
        subject_code: trimmedCode,
      }).eq("id", id);

      if (error) throw error;

      setDbSubjects(prev => prev.map(s =>
        s.id === id ? { ...s, subject_name: trimmedName, subject_code: trimmedCode } : s
      ));
      flashSuccess("Subject updated.");
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Failed to edit subject.";
      setGlobalError(message);
      return { success: false, error: message };
    } finally {
      setSavingSubject(false);
    }
  }, [supabase, dbSubjects]);

  const deleteSubject = useCallback(async (id: string) => {
    setSavingSubject(true);
    setGlobalError(null);
    try {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
      setDbSubjects(prev => prev.filter(s => s.id !== id));
      setDbAssignments(prev => prev.filter(a => a.subject_id !== id));
      flashSuccess("Subject deleted.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Failed to delete subject.";
      setGlobalError(message);
    } finally {
      setSavingSubject(false);
    }
  }, [supabase]);

  const addSubjectsBulk = useCallback(async (rows: import("@/lib/parseSubjects").ParsedSubjectRow[]): Promise<{ addedCount: number; skippedCount: number }> => {
    if (!userId) return { addedCount: 0, skippedCount: 0 };

    setBulkLoading(true);
    setGlobalError(null);
    try {
      const existingCodes = new Set(dbSubjects.map(s => s.subject_code.trim().toUpperCase()));
      const toInsert: { user_id: string; subject_name: string; subject_code: string }[] = [];
      let skippedCount = 0;

      for (const row of rows) {
        const cleanCode = row.code.trim().toUpperCase();
        if (!existingCodes.has(cleanCode)) {
          toInsert.push({
            user_id: userId,
            subject_name: row.name.trim(),
            subject_code: row.code.trim(),
          });
          existingCodes.add(cleanCode);
        } else {
          skippedCount++;
        }
      }

      if (toInsert.length > 0) {
        const { data, error } = await supabase.from("subjects").insert(toInsert).select();
        if (error) throw error;
        if (data) setDbSubjects(prev => [...prev, ...data]);
      }

      return { addedCount: toInsert.length, skippedCount };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Failed to import subjects.";
      setGlobalError(message);
      return { addedCount: 0, skippedCount: rows.length };
    } finally {
      setBulkLoading(false);
    }
  }, [supabase, userId, dbSubjects]);

  // ── Assignment CRUD ──────────────────────────────────────────────────
  const addAssignment = useCallback(async (assignmentData: AddAssignmentInput) => {
    if (!userId) return;

    setSavingAssignment(true);
    setGlobalError(null);
    try {
      const { data, error } = await supabase.from("assignments").insert({
        user_id: userId,
        subject_id: assignmentData.subjectId,
        title: assignmentData.title.trim(),
        due_date: assignmentData.dueDate || null,
        is_completed: assignmentData.isCompleted,
      }).select().single();

      if (error) throw error;

      if (data) {
        setDbAssignments(prev => [data, ...prev]);

        // Activity (client-side only)
        const subject = dbSubjects.find(s => s.id === assignmentData.subjectId);
        setActivity(prev => [{
          id: `activity-${Date.now()}`,
          assignmentId: data.id,
          type: "assignment_created" as const,
          title: assignmentData.title.trim(),
          subjectName: subject?.subject_name || "Unknown Subject",
          createdAt: data.created_at,
          dueDate: assignmentData.dueDate || "",
          status: getAssignmentStatus(assignmentData.dueDate, assignmentData.isCompleted),
        }, ...prev].slice(0, 8));
      }
      flashSuccess("Assignment added.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Failed to add assignment.";
      setGlobalError(message);
    } finally {
      setSavingAssignment(false);
    }
  }, [supabase, userId, dbSubjects]);

  const updateAssignment = useCallback(async (id: string, updatedData: Partial<AssignmentItem>) => {
    setSavingAssignment(true);
    setGlobalError(null);
    try {
      const updatePayload: Record<string, unknown> = {};
      if (updatedData.title !== undefined) updatePayload.title = updatedData.title;
      if (updatedData.subjectId !== undefined) updatePayload.subject_id = updatedData.subjectId;
      if (updatedData.dueDate !== undefined) updatePayload.due_date = updatedData.dueDate || null;
      if (updatedData.isCompleted !== undefined) updatePayload.is_completed = updatedData.isCompleted;

      const { error } = await supabase.from("assignments").update(updatePayload).eq("id", id);
      if (error) throw error;

      setDbAssignments(prev => prev.map(a => {
        if (a.id === id) {
          return {
            ...a,
            title: updatedData.title !== undefined ? updatedData.title : a.title,
            subject_id: updatedData.subjectId !== undefined ? updatedData.subjectId : a.subject_id,
            due_date: updatedData.dueDate !== undefined ? (updatedData.dueDate || null) : a.due_date,
            is_completed: updatedData.isCompleted !== undefined ? updatedData.isCompleted : a.is_completed,
          };
        }
        return a;
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Failed to update assignment.";
      setGlobalError(message);
    } finally {
      setSavingAssignment(false);
    }
  }, [supabase]);

  const deleteAssignment = useCallback(async (id: string) => {
    setSavingAssignment(true);
    setGlobalError(null);
    try {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
      setDbAssignments(prev => prev.filter(a => a.id !== id));
      flashSuccess("Assignment deleted.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Failed to delete assignment.";
      setGlobalError(message);
    } finally {
      setSavingAssignment(false);
    }
  }, [supabase]);

  const toggleAssignmentCompletion = useCallback(async (id: string) => {
    const assignment = dbAssignments.find(a => a.id === id);
    if (!assignment) return;

    setSavingAssignment(true);
    setGlobalError(null);
    try {
      const newCompleted = !assignment.is_completed;
      const { error } = await supabase.from("assignments").update({
        is_completed: newCompleted,
      }).eq("id", id);

      if (error) throw error;

      setDbAssignments(prev => prev.map(a =>
        a.id === id ? { ...a, is_completed: newCompleted } : a
      ));

      const sub = dbSubjects.find(s => s.id === assignment.subject_id);
      setActivity(prev => [{
        id: `activity-${Date.now()}`,
        assignmentId: id,
        type: (newCompleted ? "assignment_completed" : "assignment_uncompleted") as ActivityItem["type"],
        title: assignment.title,
        subjectName: sub?.subject_name || "Unknown Subject",
        createdAt: new Date().toISOString(),
        dueDate: assignment.due_date || "",
        status: getAssignmentStatus(assignment.due_date || "", newCompleted),
      }, ...prev].slice(0, 8));

      flashSuccess(newCompleted ? "Marked as completed ✓" : "Marked as incomplete");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Failed to toggle completion.";
      setGlobalError(message);
    } finally {
      setSavingAssignment(false);
    }
  }, [supabase, dbAssignments, dbSubjects]);

  // ── Bulk import assignments ──────────────────────────────────────────
  const addAssignmentsBulk = useCallback(async (parsedAssignments: import("@/lib/parseAssignments").ParsedAssignmentRow[]) => {
    if (!userId) return;

    setBulkLoading(true);
    setGlobalError(null);
    try {
      let currentSubjects = [...dbSubjects];

      // Deduplicate key
      const getKey = (subjectId: string, title: string, dueDate: string | null) =>
        `${subjectId}-${title.toLowerCase().trim()}-${dueDate || "nodate"}`;
      const existingKeys = new Set(dbAssignments.map(a => getKey(a.subject_id, a.title, a.due_date)));

      const assignmentsToInsert: { user_id: string; subject_id: string; title: string; due_date: string | null; is_completed: boolean }[] = [];

      for (const parsed of parsedAssignments) {
        let subjectId = "";

        if (parsed.subjectCode) {
          const cleanCode = parsed.subjectCode.trim().toUpperCase();
          const existing = currentSubjects.find(s => s.subject_code.trim().toUpperCase() === cleanCode);

          if (existing) {
            subjectId = existing.id;
          } else {
            const subjectName = parsed.subjectName || `Subject ${cleanCode}`;
            const { data, error } = await supabase.from("subjects").insert({
              user_id: userId,
              subject_name: subjectName,
              subject_code: parsed.subjectCode.trim(),
            }).select().single();

            if (error) throw error;
            if (data) {
              currentSubjects.push(data);
              subjectId = data.id;
            }
          }
        } else if (parsed.subjectName) {
          const nameToFind = parsed.subjectName.trim().toLowerCase();
          const existingByName = currentSubjects.find(s => s.subject_name.toLowerCase() === nameToFind);

          if (existingByName) {
            subjectId = existingByName.id;
          } else {
            const { data, error } = await supabase.from("subjects").insert({
              user_id: userId,
              subject_name: parsed.subjectName.trim(),
              subject_code: "UNKNOWN",
            }).select().single();

            if (error) throw error;
            if (data) {
              currentSubjects.push(data);
              subjectId = data.id;
            }
          }
        }

        if (!subjectId) continue;

        const key = getKey(subjectId, parsed.title, parsed.dueDate || null);
        if (existingKeys.has(key)) continue;

        assignmentsToInsert.push({
          user_id: userId,
          subject_id: subjectId,
          title: parsed.title.trim(),
          due_date: parsed.dueDate || null,
          is_completed: false,
        });
        existingKeys.add(key);
      }

      if (assignmentsToInsert.length > 0) {
        const { data, error } = await supabase.from("assignments").insert(assignmentsToInsert).select();
        if (error) throw error;
        if (data) {
          setDbAssignments(prev => [...data, ...prev]);
        }
      }

      // Refresh subjects in case new ones were created
      setDbSubjects(currentSubjects);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Failed to import assignments.";
      setGlobalError(message);
    } finally {
      setBulkLoading(false);
    }
  }, [supabase, userId, dbSubjects, dbAssignments]);

  // ── Reset / Export / Import ──────────────────────────────────────────
  const resetData = useCallback(async () => {
    if (!userId) return;
    setSavingSubject(true);
    setGlobalError(null);
    try {
      const { error: aErr } = await supabase.from("assignments").delete().eq("user_id", userId);
      if (aErr) throw aErr;
      const { error: sErr } = await supabase.from("subjects").delete().eq("user_id", userId);
      if (sErr) throw sErr;
      setDbSubjects([]);
      setDbAssignments([]);
      setActivity([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Failed to reset data.";
      setGlobalError(message);
    } finally {
      setSavingSubject(false);
    }
  }, [supabase, userId]);

  const exportData = useCallback((): string => {
    return JSON.stringify({
      subjects: dbSubjects.map(s => ({
        id: s.id,
        subject_name: s.subject_name,
        subject_code: s.subject_code,
        created_at: s.created_at,
      })),
      assignments: dbAssignments.map(a => ({
        id: a.id,
        subject_id: a.subject_id,
        title: a.title,
        due_date: a.due_date,
        is_completed: a.is_completed,
        created_at: a.created_at,
      })),
    }, null, 2);
  }, [dbSubjects, dbAssignments]);

  const importData = useCallback((jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return false; // TODO: implement Supabase import
    } catch {
      return false;
    }
  }, []);

  // ── Context value ────────────────────────────────────────────────────
  const value: AppDataContextValue = {
    subjects,
    assignments,
    activity,
    // Loading & error
    isLoading,
    globalError,
    successMessage,
    savingSubject,
    savingAssignment,
    bulkLoading,
    clearError,
    // CRUD
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

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-lg text-slate-500">Loading…</p></div>;
  }

  return (
    <AppDataContext.Provider value={value}>
      {/* Error banner */}
      {globalError && (
        <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-3 border-b border-rose-300 bg-rose-50 px-6 py-3 shadow-sm">
          <p className="text-lg font-medium text-rose-700">{globalError}</p>
          <button
            type="button"
            onClick={clearError}
            className="shrink-0 rounded-lg border border-rose-300 px-3 py-1 text-lg font-medium text-rose-600 transition hover:bg-rose-100"
          >
            Dismiss
          </button>
        </div>
      )}
      {/* Success toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-[100] rounded-xl border border-green-300 bg-green-50 px-5 py-3 shadow-lg">
          <p className="text-lg font-medium text-green-700">{successMessage}</p>
        </div>
      )}
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider.");
  }

  return context;
}
