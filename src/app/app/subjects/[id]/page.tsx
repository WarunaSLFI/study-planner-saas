"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppData } from "@/app/app/providers/AppDataProvider";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatCard from "@/components/StatCard";
import AssignmentsTable from "@/components/AssignmentsTable";
import AssignmentModal, { type NewAssignment } from "@/components/AssignmentModal";
import { getAssignmentStatus } from "@/lib/assignmentStatus";
import type { AssignmentItem } from "@/components/AssignmentsTable";

export default function SubjectDetailsPage() {
    const params = useParams();
    const subjectId = params.id as string;
    const { subjects, assignments, addAssignment, updateAssignment, deleteAssignment, toggleAssignmentCompletion } = useAppData();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const subject = subjects.find(s => s.id === subjectId);

    const subjectAssignments = useMemo(() => {
        return assignments.filter(a => a.subjectId === subjectId);
    }, [assignments, subjectId]);

    const stats = useMemo(() => {
        let completed = 0;
        let overdue = 0;
        let dueSoon = 0;

        for (const a of subjectAssignments) {
            const status = getAssignmentStatus(a.dueDate, a.isCompleted);
            if (status === "Completed") completed++;
            else if (status === "Overdue") overdue++;
            else if (status === "Due Soon") dueSoon++;
        }

        return { total: subjectAssignments.length, completed, overdue, dueSoon };
    }, [subjectAssignments]);

    const handleEditClick = (assignment: AssignmentItem) => {
        setEditingAssignment(assignment);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAssignment(null);
    };

    const handleAddAssignment = (assignment: NewAssignment) => {
        addAssignment(assignment);
    };

    if (!subject) {
        return (
            <div className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
                    <h2 className="text-2xl font-semibold text-slate-900 mb-2">Subject not found</h2>
                    <p className="text-lg text-slate-500 mb-4">
                        The subject you&apos;re looking for doesn&apos;t exist or has been deleted.
                    </p>
                    <Link
                        href="/app/courses"
                        className="inline-flex items-center rounded-xl bg-slate-100 border border-slate-300 px-4 py-2 text-lg font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                        &larr; Back to Subjects
                    </Link>
                </section>
            </div>
        );
    }

    const hasValidCode = subject.code && subject.code.trim() !== "" && subject.code !== "UNKNOWN";

    return (
        <div className="space-y-6">
            {/* Header */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            href="/app/courses"
                            className="text-lg font-medium text-slate-500 transition hover:text-slate-700"
                        >
                            &larr; All Subjects
                        </Link>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">{subject.name}</h1>
                        {hasValidCode && (
                            <span className="text-lg font-mono text-slate-500">{subject.code}</span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setEditingAssignment(null);
                            setIsModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-100 border border-slate-300 px-4 py-2 text-lg font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                        Add Assignment
                    </button>
                </div>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total" value={stats.total.toString()} />
                <StatCard title="Completed" value={stats.completed.toString()} />
                <StatCard title="Overdue" value={stats.overdue.toString()} />
                <StatCard title="Due Soon" value={stats.dueSoon.toString()} />
            </section>

            {/* Assignments list */}
            {subjectAssignments.length === 0 ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
                    <p className="text-lg text-slate-500 mb-4">
                        No assignments for this subject yet.
                    </p>
                    <Link
                        href="/app/tasks"
                        className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        Go to Assignments
                    </Link>
                </section>
            ) : (
                <AssignmentsTable
                    assignments={subjectAssignments}
                    onEdit={handleEditClick}
                    onDelete={(id) => setPendingDeleteId(id)}
                    onToggleCompletion={(id) => toggleAssignmentCompletion(id)}
                />
            )}

            <AssignmentModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onAdd={handleAddAssignment}
                onEdit={(id, updated) => updateAssignment(id, updated)}
                existingAssignment={editingAssignment}
                subjects={subjects}
            />

            <ConfirmDialog
                isOpen={!!pendingDeleteId}
                title="Delete Assignment"
                message={`Are you sure you want to delete "${subjectAssignments.find(a => a.id === pendingDeleteId)?.title || "this assignment"}"?`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={() => {
                    if (pendingDeleteId) deleteAssignment(pendingDeleteId);
                    setPendingDeleteId(null);
                }}
                onCancel={() => setPendingDeleteId(null)}
            />
        </div>
    );
}
