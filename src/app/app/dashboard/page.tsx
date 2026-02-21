"use client";

import { useMemo } from "react";
import StatCard from "@/components/StatCard";
import { useAppData } from "@/app/app/providers/AppDataProvider";
import { getAssignmentStatus } from "@/lib/assignmentStatus";
import type { AssignmentStatus, AssignmentItem } from "@/components/AssignmentsTable";

function formatDueDateHeading(dueDate: string): string {
  if (!dueDate) return "No Date";
  const [year, month, day] = dueDate.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(dateObj);
}

export default function DashboardPage() {
  const { assignments, subjects } = useAppData();

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

  const groupedAssignments = useMemo(() => {
    const groups: Record<string, AssignmentItem[]> = {};
    for (const a of assignments) {
      const dateKey = a.dueDate || "";
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(a);
    }

    const sortedDates = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    const priorityMap: Record<AssignmentStatus, number> = {
      Overdue: 0,
      "Due Soon": 1,
      Upcoming: 2,
      Completed: 3,
    };

    return sortedDates.map((date) => {
      const groupAssignments = [...groups[date]].sort((a, b) => {
        const statusA = getAssignmentStatus(a.dueDate, a.isCompleted);
        const statusB = getAssignmentStatus(b.dueDate, b.isCompleted);
        if (priorityMap[statusA] !== priorityMap[statusB]) {
          return priorityMap[statusA] - priorityMap[statusB];
        }
        return a.title.localeCompare(b.title);
      });
      return { date, assignments: groupAssignments };
    });
  }, [assignments]);
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} />
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Due Schedule</h2>
        <div className="mt-6 flex flex-col gap-8">
          {groupedAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
              <svg className="mb-4 h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
              </svg>
              <h3 className="text-lg font-medium text-slate-900">No assignments yet</h3>
              <p className="mt-1 text-slate-500">Go to the Assignments page to add your first task.</p>
            </div>
          ) : (
            groupedAssignments.map((group) => (
              <div key={group.date} className="flex flex-col gap-3">
                <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-2">
                  {formatDueDateHeading(group.date)}
                </h3>
                <div className="divide-y divide-slate-200">
                  {group.assignments.map((assignment) => {
                    const subject = subjects.find((s) => s.id === assignment.subjectId);

                    let subjectDisplay = "Unknown subject";
                    if (subject) {
                      const hasValidCode = subject.code && subject.code.trim() !== "" && subject.code !== "UNKNOWN";
                      subjectDisplay = hasValidCode ? `${subject.code} • ${subject.name} — ${assignment.title}` : `${subject.name} — ${assignment.title}`;
                    } else {
                      subjectDisplay = `Unknown Subject — ${assignment.title}`;
                    }

                    const currentStatus = getAssignmentStatus(assignment.dueDate, assignment.isCompleted);
                    const statusColorClass =
                      currentStatus === "Overdue"
                        ? "bg-red-100 text-red-700  "
                        : currentStatus === "Due Soon"
                          ? "bg-yellow-100 text-yellow-700  "
                          : currentStatus === "Completed"
                            ? "bg-green-100 text-green-700  "
                            : "bg-blue-100 text-blue-700  ";

                    return (
                      <div key={assignment.id} className="py-3 flex justify-between items-start gap-4">
                        <span className="text-lg text-slate-900 leading-tight">
                          {subjectDisplay}
                        </span>
                        <span className={`px-2.5 py-1 text-lg font-semibold rounded-md whitespace-nowrap ${statusColorClass}`}>
                          {currentStatus}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
