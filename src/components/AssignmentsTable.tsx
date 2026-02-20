import Link from "next/link";

export type AssignmentStatus = "Upcoming" | "Due Soon" | "Overdue" | "Completed";

export type AssignmentItem = {
  id: string;
  title: string;
  subjectId: string;
  course: string;
  dueDate: string;
  isCompleted: boolean;
  score: string;
  createdAt: string;
};

type AssignmentsTableProps = {
  assignments: AssignmentItem[];
  onEdit?: (assignment: AssignmentItem) => void;
  onToggleCompletion?: (id: string) => void;
};

export const statusBadgeStyles: Record<AssignmentStatus, string> = {
  Upcoming: "bg-blue-50 text-blue-700 ring-blue-200",
  "Due Soon": "bg-yellow-100 text-yellow-700 ring-yellow-200",
  Overdue: "bg-rose-50 text-rose-700 ring-rose-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

import { getAssignmentStatus } from "@/lib/assignmentStatus";

export default function AssignmentsTable({ assignments, onEdit, onToggleCompletion }: AssignmentsTableProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 text-lg font-semibold text-slate-600">Title</th>
              <th className="px-3 py-3 text-lg font-semibold text-slate-600">Course</th>
              <th className="px-3 py-3 text-lg font-semibold text-slate-600">
                Due Date
              </th>
              <th className="px-3 py-3 text-lg font-semibold text-slate-600">Status</th>
              <th className="px-3 py-3 text-lg font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-lg text-slate-500" colSpan={5}>
                  No assignments match the current filters.
                </td>
              </tr>
            ) : (
              assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-3 py-4 text-lg font-medium text-slate-900">
                    {assignment.title}
                  </td>
                  <td className="px-3 py-4 text-lg text-slate-700">
                    {assignment.course}
                  </td>
                  <td className="px-3 py-4 text-lg text-slate-700">
                    {assignment.dueDate}
                  </td>
                  <td className="px-3 py-4 text-lg text-slate-700">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-lg font-semibold ring-1 ring-inset ${statusBadgeStyles[getAssignmentStatus(assignment.dueDate, assignment.isCompleted)]}`}
                    >
                      {getAssignmentStatus(assignment.dueDate, assignment.isCompleted)}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-lg">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/app/assignments/${assignment.id}`}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => onEdit?.(assignment)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleCompletion?.(assignment.id)}
                        className={`rounded-md px-3 py-1 text-sm font-medium transition ${assignment.isCompleted
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100"
                          }`}
                      >
                        {assignment.isCompleted ? "Undo" : "Mark Complete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
