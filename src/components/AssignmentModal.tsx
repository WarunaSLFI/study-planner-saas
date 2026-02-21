"use client";

import { type FormEvent, useEffect, useState } from "react";
import type {
  AddAssignmentInput,
  SubjectItem,
} from "@/app/app/providers/AppDataProvider";
import type { AssignmentItem } from "@/components/AssignmentsTable";

export type NewAssignment = AddAssignmentInput;

type AssignmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (assignment: NewAssignment) => void;
  onEdit?: (id: string, assignment: Partial<AssignmentItem>) => void;
  existingAssignment?: AssignmentItem | null;
  subjects: SubjectItem[];
};

type FormState = {
  title: string;
  subjectId: string;
  dueDate: string;
  isCompleted: boolean;
  notes: string;
};

function createInitialFormState(defaultSubjectId: string): FormState {
  return {
    title: "",
    subjectId: defaultSubjectId,
    dueDate: "",
    isCompleted: false,
    notes: "",
  };
}

export default function AssignmentModal({
  isOpen,
  onClose,
  onAdd,
  onEdit,
  existingAssignment,
  subjects,
}: AssignmentModalProps) {
  const defaultSubjectId = subjects[0]?.id ?? "";
  const [form, setForm] = useState<FormState>(() =>
    createInitialFormState(defaultSubjectId),
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const updateField = <Key extends keyof FormState>(
    field: Key,
    value: FormState[Key],
  ) => {
    setForm((previousForm) => ({ ...previousForm, [field]: value }));
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (existingAssignment) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        title: existingAssignment.title,
        subjectId: existingAssignment.subjectId,
        dueDate: existingAssignment.dueDate,
        isCompleted: existingAssignment.isCompleted,
        notes: "",
      });
    } else {
      setForm((previousForm) =>
        previousForm.subjectId
          ? previousForm
          : { ...previousForm, subjectId: defaultSubjectId },
      );
    }
  }, [isOpen, defaultSubjectId, existingAssignment]);

  const resetForm = () => {
    setForm(createInitialFormState(defaultSubjectId));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const scoreValue = existingAssignment ? existingAssignment.score : "-";

    if (existingAssignment && onEdit) {
      onEdit(existingAssignment.id, {
        title: form.title.trim(),
        subjectId: form.subjectId,
        dueDate: form.dueDate,
        isCompleted: form.isCompleted,
        score: scoreValue,
      });
    } else {
      onAdd({
        title: form.title.trim(),
        subjectId: form.subjectId,
        dueDate: form.dueDate,
        isCompleted: form.isCompleted,
        score: scoreValue,
      });
    }

    handleClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {existingAssignment ? "Edit Assignment" : "Add Assignment"}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-lg font-medium text-slate-600">
                Title
              </span>
              <input
                required
                type="text"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-lg font-medium text-slate-600">
                Subject
              </span>
              <select
                required
                value={form.subjectId}
                onChange={(event) => updateField("subjectId", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                {subjects.length === 0 ? (
                  <option value="">No subjects available</option>
                ) : null}
                {subjects.map((sub) => {
                  const hasValidCode = sub.code && sub.code.trim() !== "" && sub.code !== "UNKNOWN";
                  const displayName = hasValidCode ? `${sub.code} — ${sub.name}` : sub.name;
                  return (
                    <option key={sub.id} value={sub.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-lg font-medium text-slate-600">
                Due Date
              </span>
              <input
                required
                type="date"
                value={form.dueDate}
                onChange={(event) => updateField("dueDate", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.isCompleted}
                onChange={(event) => updateField("isCompleted", event.target.checked)}
                className="h-6 w-6 rounded border-slate-300 text-slate-900 transition focus:ring-slate-500"
              />
              <span className="text-lg font-medium text-slate-600">
                Mark as Completed
              </span>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-lg font-medium text-slate-600">
              Notes (Optional)
            </span>
            <textarea
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              rows={3}
              placeholder="Add any additional notes here..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 resize-none"
            />
          </label>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={subjects.length === 0}
              className="rounded-xl bg-slate-900 px-4 py-2 text-lg font-semibold text-white transition hover:bg-slate-700"
            >
              {existingAssignment ? "Save Changes" : "Add Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
