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
import { parseAssignmentsFromText } from "@/lib/parseAssignments";

type StatusFilter = "All" | "Active" | "Completed";
type TimeFilter = "All" | "Overdue" | "Due Soon" | "Upcoming";
type SortBy = "dueDateAsc" | "dueDateDesc" | "createdAtDesc";

type ImportAssignmentsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImportBulk: (rows: import("@/lib/parseAssignments").ParsedAssignmentRow[]) => void;
};

function ImportAssignmentsModal({ isOpen, onClose, onImportBulk }: ImportAssignmentsModalProps) {
  const [pastedText, setPastedText] = useState("");
  const [parsedRows, setParsedRows] = useState<(import("@/lib/parseAssignments").ParsedAssignmentRow & { id: string; checked: boolean })[]>([]);
  const [view, setView] = useState<"paste" | "preview">("paste");

  const handleClose = () => {
    setPastedText("");
    setParsedRows([]);
    setView("paste");
    onClose();
  };

  const handleParse = () => {
    const rawRows = parseAssignmentsFromText(pastedText);

    setParsedRows(
      rawRows.map((r, i) => ({
        ...r,
        id: `parsed-${i}-${Date.now()}`,
        checked: true,
      }))
    );
    setView("preview");
  };

  const handleImport = () => {
    const selectedRows = parsedRows.filter((r) => r.checked);
    onImportBulk(selectedRows);
    alert(`Imported ${selectedRows.length} assignments successfully.`);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Import Assignments</h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {view === "paste" ? (
          <div className="flex-1 overflow-y-auto">
            <p className="mb-2 text-slate-600">Copy and paste your assignments list from your university website directly into the box below. We will attempt to automatically extract the Subject, Title, and Due Date.</p>
            <textarea
              className="w-full h-64 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 resize-none"
              placeholder="Paste your assignment list here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleParse}
                disabled={!pastedText.trim()}
                className="rounded-xl bg-slate-900 px-4 py-2 text-lg font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                Parse Assignments
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
            <p className="mb-4 text-slate-600">Review the parsed assignments below. You can uncheck items or double-click text to edit. Duplicate assignments will be automatically ignored when importing.</p>
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-3 text-sm font-semibold text-slate-900">Import</th>
                    <th className="px-3 py-3 text-sm font-semibold text-slate-900">Title</th>
                    <th className="px-3 py-3 text-sm font-semibold text-slate-900">Subject Name</th>
                    <th className="px-3 py-3 text-sm font-semibold text-slate-900">Subject Code</th>
                    <th className="px-3 py-3 text-sm font-semibold text-slate-900">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {parsedRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500">No assignments could be parsed from the text.</td>
                    </tr>
                  ) : (
                    parsedRows.map((row) => (
                      <tr key={row.id}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                            checked={row.checked}
                            onChange={(e) => {
                              setParsedRows((prev) => prev.map((r) => r.id === row.id ? { ...r, checked: e.target.checked } : r));
                            }}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={row.title}
                            onChange={(e) => setParsedRows((prev) => prev.map((r) => r.id === row.id ? { ...r, title: e.target.value } : r))}
                            className="w-full border-0 bg-transparent p-0 text-sm focus:ring-0 font-medium"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={row.subjectName || ""}
                            placeholder="Unknown Name"
                            onChange={(e) => setParsedRows((prev) => prev.map((r) => r.id === row.id ? { ...r, subjectName: e.target.value } : r))}
                            className="w-full border-0 bg-transparent p-0 text-sm focus:ring-0"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={row.subjectCode || ""}
                            placeholder="No code"
                            onChange={(e) => setParsedRows((prev) => prev.map((r) => r.id === row.id ? { ...r, subjectCode: e.target.value } : r))}
                            className="w-full border-0 bg-transparent p-0 text-sm font-mono focus:ring-0 text-slate-500"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="date"
                            value={row.dueDate || ""}
                            onChange={(e) => setParsedRows((prev) => prev.map((r) => r.id === row.id ? { ...r, dueDate: e.target.value } : r))}
                            className="w-full border-0 bg-transparent p-0 text-sm focus:ring-0"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between shrink-0">
              <button
                onClick={() => setView("paste")}
                className="rounded-xl border border-slate-300 px-4 py-2 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back to Paste
              </button>
              <button
                onClick={handleImport}
                disabled={parsedRows.length === 0 || !parsedRows.some(r => r.checked)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-lg font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                Import Selected
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { subjects, assignments, addAssignment, updateAssignment, deleteAssignment, toggleAssignmentCompletion, addAssignmentsBulk } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("All");
  const [sortBy, setSortBy] = useState<SortBy>("dueDateAsc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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
      // Search: title, subject name, subject code
      const subjectCode = subjects.find(s => s.id === assignment.subjectId)?.code || "";
      const matchesSearch = !query ||
        assignment.title.toLowerCase().includes(query) ||
        assignment.subject.toLowerCase().includes(query) ||
        subjectCode.toLowerCase().includes(query);

      // Status filter: Active vs Completed
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Completed" && assignment.isCompleted) ||
        (statusFilter === "Active" && !assignment.isCompleted);

      // Time filter: Overdue / Due Soon / Upcoming
      const computedStatus = getAssignmentStatus(assignment.dueDate, assignment.isCompleted);
      const matchesTime =
        timeFilter === "All" || computedStatus === timeFilter;

      return matchesSearch && matchesStatus && matchesTime;
    });
  }, [assignments, subjects, searchQuery, statusFilter, timeFilter]);

  const sortedAssignments = useMemo(() => {
    return [...filteredAssignments].sort((a, b) => {
      switch (sortBy) {
        case "dueDateAsc":
          return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
        case "dueDateDesc":
          return (b.dueDate || "0000-01-01").localeCompare(a.dueDate || "0000-01-01");
        case "createdAtDesc":
          return (b.createdAt || "").localeCompare(a.createdAt || "");
        default:
          return 0;
      }
    });
  }, [filteredAssignments, sortBy]);

  const handleAddAssignment = (assignment: NewAssignment) => {
    addAssignment(assignment);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Assignments</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Paste Assignments
            </button>
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
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-lg font-medium text-slate-600">
              Search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Title, subject, or code"
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
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-lg font-medium text-slate-600">
              Time
            </span>
            <select
              value={timeFilter}
              onChange={(event) =>
                setTimeFilter(event.target.value as TimeFilter)
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="All">All</option>
              <option value="Overdue">Overdue</option>
              <option value="Due Soon">Due Soon</option>
              <option value="Upcoming">Upcoming</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-lg font-medium text-slate-600">
              Sort By
            </span>
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as SortBy)
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="dueDateAsc">Due Date (Earliest)</option>
              <option value="dueDateDesc">Due Date (Latest)</option>
              <option value="createdAtDesc">Newest First</option>
            </select>
          </label>
        </div>
      </section>

      <AssignmentsTable
        assignments={sortedAssignments}
        onEdit={handleEditClick}
        onDelete={(id) => {
          const assignment = assignments.find(a => a.id === id);
          const confirmed = confirm(
            `Are you sure you want to delete "${assignment?.title || "this assignment"}"?`
          );
          if (confirmed) deleteAssignment(id);
        }}
        onToggleCompletion={(id) => toggleAssignmentCompletion(id)}
      />

      <AssignmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAddAssignment}
        onEdit={(id, updated) => updateAssignment(id, updated)}
        existingAssignment={editingAssignment}
        subjects={subjects}
      />

      <ImportAssignmentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportBulk={addAssignmentsBulk}
      />
    </div>
  );
}
