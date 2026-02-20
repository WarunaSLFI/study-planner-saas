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
            <p className="text-lg text-slate-500">No assignments found.</p>
          ) : (
            groupedAssignments.map((group) => (
              <div key={group.date} className="flex flex-col gap-3">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
                  {formatDueDateHeading(group.date)}
                </h3>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                  {group.assignments.map((assignment) => {
                    const subject = subjects.find((s) => s.id === assignment.subjectId);

                    let subjectDisplay = "Unknown subject";
                    if (subject) {
                      const hasValidCode = subject.code && subject.code.trim() !== "" && subject.code !== "UNKNOWN";
                      subjectDisplay = hasValidCode ? `${subject.code} — ${subject.name}` : subject.name;
                    }

                    const currentStatus = getAssignmentStatus(assignment.dueDate, assignment.isCompleted);
                    const statusColorClass =
                      currentStatus === "Overdue"
                        ? "bg-red-100 text-red-700"
                        : currentStatus === "Due Soon"
                          ? "bg-yellow-100 text-yellow-700"
                          : currentStatus === "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700";

                    return (
                      <div key={assignment.id} className="p-4 flex flex-col gap-1.5">
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-lg font-semibold text-slate-900 leading-tight">
                            {assignment.title}
                          </span>
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${statusColorClass}`}>
                            {currentStatus}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-slate-500">
                          {subjectDisplay}
                        </div>
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
