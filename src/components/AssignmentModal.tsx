"use client";

import { type FormEvent, useEffect, useState } from "react";
import type {
  AddAssignmentInput,
  CourseItem,
} from "@/app/app/providers/AppDataProvider";
import type { AssignmentStatus } from "@/components/AssignmentsTable";

export type NewAssignment = AddAssignmentInput;

type AssignmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (assignment: NewAssignment) => void;
  courses: CourseItem[];
};

type ScoreMode = "marks" | "questions";

type FormState = {
  title: string;
  courseId: string;
  dueDate: string;
  status: AssignmentStatus;
  scoreMode: ScoreMode;
  marksGot: string;
  marksTotal: string;
  correctQuestions: string;
  totalQuestions: string;
};

function createInitialFormState(defaultCourseId: string): FormState {
  return {
    title: "",
    courseId: defaultCourseId,
    dueDate: "",
    status: "Upcoming",
    scoreMode: "marks",
    marksGot: "",
    marksTotal: "",
    correctQuestions: "",
    totalQuestions: "",
  };
}

export default function AssignmentModal({
  isOpen,
  onClose,
  onAdd,
  courses,
}: AssignmentModalProps) {
  const defaultCourseId = courses[0]?.id ?? "";
  const [form, setForm] = useState<FormState>(() =>
    createInitialFormState(defaultCourseId),
  );

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

    setForm((previousForm) =>
      previousForm.courseId
        ? previousForm
        : { ...previousForm, courseId: defaultCourseId },
    );
  }, [isOpen, defaultCourseId]);

  const resetForm = () => {
    setForm(createInitialFormState(defaultCourseId));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const scoreValue =
      form.scoreMode === "marks"
        ? `${form.marksGot}/${form.marksTotal}`
        : `${form.correctQuestions}/${form.totalQuestions}`;

    onAdd({
      title: form.title.trim(),
      courseId: form.courseId,
      dueDate: form.dueDate,
      status: form.status,
      score: scoreValue,
    });

    handleClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Add Assignment</h3>
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
                Course
              </span>
              <select
                required
                value={form.courseId}
                onChange={(event) => updateField("courseId", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                {courses.length === 0 ? (
                  <option value="">No courses available</option>
                ) : null}
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
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

            <label className="block">
              <span className="mb-2 block text-lg font-medium text-slate-600">
                Status
              </span>
              <select
                value={form.status}
                onChange={(event) =>
                  updateField("status", event.target.value as AssignmentStatus)
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Overdue">Overdue</option>
                <option value="Completed">Completed</option>
              </select>
            </label>
          </div>

          <fieldset className="rounded-xl border border-slate-200 p-4">
            <legend className="px-2 text-lg font-medium text-slate-600">
              Score Input Type
            </legend>
            <div className="mt-2 flex items-center gap-6">
              <label className="inline-flex items-center gap-2 text-lg text-slate-700">
                <input
                  type="radio"
                  name="scoreType"
                  value="marks"
                  checked={form.scoreMode === "marks"}
                  onChange={() => updateField("scoreMode", "marks")}
                />
                Marks
              </label>
              <label className="inline-flex items-center gap-2 text-lg text-slate-700">
                <input
                  type="radio"
                  name="scoreType"
                  value="questions"
                  checked={form.scoreMode === "questions"}
                  onChange={() => updateField("scoreMode", "questions")}
                />
                Questions
              </label>
            </div>

            {form.scoreMode === "marks" ? (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-lg font-medium text-slate-600">
                    Marks Got
                  </span>
                  <input
                    required
                    min="0"
                    type="number"
                    value={form.marksGot}
                    onChange={(event) =>
                      updateField("marksGot", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-lg font-medium text-slate-600">
                    Marks Total
                  </span>
                  <input
                    required
                    min="1"
                    type="number"
                    value={form.marksTotal}
                    onChange={(event) =>
                      updateField("marksTotal", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-lg font-medium text-slate-600">
                    Correct Questions
                  </span>
                  <input
                    required
                    min="0"
                    type="number"
                    value={form.correctQuestions}
                    onChange={(event) =>
                      updateField("correctQuestions", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-lg font-medium text-slate-600">
                    Total Questions
                  </span>
                  <input
                    required
                    min="1"
                    type="number"
                    value={form.totalQuestions}
                    onChange={(event) =>
                      updateField("totalQuestions", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
              </div>
            )}
          </fieldset>

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
              disabled={courses.length === 0}
              className="rounded-xl bg-slate-900 px-4 py-2 text-lg font-semibold text-white transition hover:bg-slate-700"
            >
              Add Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
