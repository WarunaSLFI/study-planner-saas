export type AssignmentStatus = "Upcoming" | "Overdue" | "Completed";

export type AssignmentItem = {
  id: string;
  title: string;
  courseId: string;
  course: string;
  dueDate: string;
  status: AssignmentStatus;
  score: string;
};

type AssignmentsTableProps = {
  assignments: AssignmentItem[];
};

const statusBadgeStyles: Record<AssignmentStatus, string> = {
  Upcoming: "bg-blue-50 text-blue-700 ring-blue-200",
  Overdue: "bg-rose-50 text-rose-700 ring-rose-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export default function AssignmentsTable({ assignments }: AssignmentsTableProps) {
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
              <th className="px-3 py-3 text-lg font-semibold text-slate-600">Score</th>
              <th className="px-3 py-3 text-lg font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-lg text-slate-500" colSpan={6}>
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
                      className={`inline-flex rounded-full px-2.5 py-1 text-lg font-semibold ring-1 ring-inset ${statusBadgeStyles[assignment.status]}`}
                    >
                      {assignment.status}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-lg text-slate-700">{assignment.score}</td>
                  <td className="px-3 py-4 text-lg">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
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
