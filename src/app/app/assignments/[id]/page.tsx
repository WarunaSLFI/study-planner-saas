"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppData } from "@/app/app/providers/AppDataProvider";
import { statusBadgeStyles } from "@/components/AssignmentsTable";
import AssignmentModal from "@/components/AssignmentModal";
import { getAssignmentStatus } from "@/lib/assignmentStatus";

export default function AssignmentDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const { assignments, courses, addAssignment, updateAssignment } = useAppData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const assignmentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const assignment = assignments.find((item) => item.id === assignmentId);

  if (!assignment) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Assignment not found</h2>
        <p className="mt-2 text-lg text-slate-600">
          The assignment you are looking for does not exist.
        </p>
        <Link
          href="/app/tasks"
          className="mt-6 inline-flex rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to Assignments
        </Link>
      </section>
    );
  }

  const courseName =
    courses.find((course) => course.id === assignment.courseId)?.name ??
    assignment.course;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Assignment Details</h2>
          <div className="flex items-center gap-2">
            <Link
              href="/app/tasks"
              className="inline-flex rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back to Assignments
            </Link>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Edit
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-3xl font-semibold text-slate-900">{assignment.title}</h3>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-lg font-medium text-slate-600">Course</p>
            <p className="mt-1 text-lg text-slate-900">{courseName}</p>
          </div>

          <div>
            <p className="text-lg font-medium text-slate-600">Due date</p>
            <p className="mt-1 text-lg text-slate-900">{assignment.dueDate}</p>
          </div>

          <div>
            <p className="text-lg font-medium text-slate-600">Status</p>
            <span
              className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-lg font-semibold ring-1 ring-inset ${statusBadgeStyles[getAssignmentStatus(assignment.dueDate, assignment.isCompleted)]}`}
            >
              {getAssignmentStatus(assignment.dueDate, assignment.isCompleted)}
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <h4 className="text-lg font-semibold text-slate-900">Notes</h4>
          <p className="mt-2 text-lg text-slate-600">No notes yet.</p>
        </div>
      </section>

      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={(assignment) => addAssignment(assignment)}
        onEdit={(id, updated) => updateAssignment(id, updated)}
        existingAssignment={assignment}
        courses={courses}
      />
    </div>
  );
}
