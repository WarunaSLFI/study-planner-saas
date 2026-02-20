"use client";

import { useMemo } from "react";
import StatCard from "@/components/StatCard";
import { useAppData } from "@/app/app/providers/AppDataProvider";
import { getAssignmentStatus } from "@/lib/assignmentStatus";

export default function DashboardPage() {
  const { assignments, activity } = useAppData();

  const dashboardStats = useMemo(() => {
    const upcoming = assignments.filter((a) => {
      const stat = getAssignmentStatus(a.dueDate, a.isCompleted);
      return stat === "Upcoming" || stat === "Due Soon";
    }).length;
    const overdue = assignments.filter((a) => getAssignmentStatus(a.dueDate, a.isCompleted) === "Overdue").length;
    const completed = assignments.filter((a) => getAssignmentStatus(a.dueDate, a.isCompleted) === "Completed").length;

    return [
      { title: "Upcoming", value: upcoming.toString() },
      { title: "Overdue", value: overdue.toString() },
      { title: "Completed", value: completed.toString() },
      { title: "Total Assignments", value: assignments.length.toString() },
    ];
  }, [assignments]);
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} />
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Recent Activity</h2>
        <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {activity.length === 0 ? (
            <p className="px-4 py-4 text-lg text-slate-500">No recent activity.</p>
          ) : (
            activity.map((item) => {
              const formattedDate = new Date(item.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div key={item.id} className="px-4 py-4 flex flex-col gap-1">
                  <p className="text-xl font-medium text-slate-900">
                    {item.title} ({item.courseName})
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 text-xs rounded-md ${item.type === "assignment_created"
                        ? "bg-blue-100 text-blue-700"
                        : item.type === "assignment_completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-700"
                        }`}
                    >
                      {item.type === "assignment_created"
                        ? "➕ Added"
                        : item.type === "assignment_completed"
                          ? "✅ Marked Completed"
                          : "↩️ Marked Incomplete"}
                    </span>
                    <span className="px-3 py-1 text-xs rounded-md bg-gray-100 text-gray-700">
                      Created {formattedDate}
                    </span>
                    {(() => {
                      const assignment = assignments.find(
                        (a) => a.id === item.assignmentId || (!item.assignmentId && a.title === item.title)
                      );
                      const dueDateToShow = assignment ? assignment.dueDate : item.dueDate;
                      const currentStatus = assignment
                        ? getAssignmentStatus(dueDateToShow, assignment.isCompleted)
                        : item.status;

                      const statusColorClass =
                        currentStatus === "Overdue"
                          ? "bg-red-100 text-red-700"
                          : currentStatus === "Due Soon"
                            ? "bg-yellow-100 text-yellow-700"
                            : currentStatus === "Completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700";

                      return (
                        <>
                          <span className={`px-3 py-1 text-xs rounded-md ${statusColorClass} font-medium`}>
                            {currentStatus}
                          </span>
                          <span className={`px-3 py-1 text-xs rounded-md ${statusColorClass}`}>
                            Due {dueDateToShow}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
