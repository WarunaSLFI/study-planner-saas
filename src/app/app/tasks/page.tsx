"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/app/app/providers/AppDataProvider";
import AssignmentModal, {
  type NewAssignment,
} from "@/components/AssignmentModal";
import AssignmentsTable, {
  type AssignmentItem,
  type AssignmentStatus,
} from "@/components/AssignmentsTable";

import { getAssignmentStatus } from "@/lib/assignmentStatus";

type StatusFilter = "All" | AssignmentStatus;

export default function TasksPage() {
  const { courses, assignments, addAssignment, updateAssignment, toggleAssignmentCompletion } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);

  const handleEditClick = (assignment: AssignmentItem) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAssignment(null);
  };

  const filteredAssignments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const matchesSearch =
        assignment.title.toLowerCase().includes(query) ||
        assignment.course.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "All" || getAssignmentStatus(assignment.dueDate, assignment.isCompleted) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchQuery, statusFilter]);

  const handleAddAssignment = (assignment: NewAssignment) => {
    addAssignment(assignment);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Assignments</h2>
          <button
            type="button"
            onClick={() => {
              setEditingAssignment(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-lg font-semibold text-white transition hover:bg-slate-700"
          >
            Add Assignment
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-lg font-medium text-slate-600">
              Search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by title or course"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-lg font-medium text-slate-600">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="All">All</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Overdue">Overdue</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
        </div>
      </section>

      <AssignmentsTable assignments={filteredAssignments} onEdit={handleEditClick} onToggleCompletion={(id) => toggleAssignmentCompletion(id)} />

      <AssignmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAddAssignment}
        onEdit={(id, updated) => updateAssignment(id, updated)}
        existingAssignment={editingAssignment}
        courses={courses}
      />
    </div>
  );
}
