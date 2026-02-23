"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAppData } from "@/app/app/providers/AppDataProvider";
import ConfirmDialog from "@/components/ConfirmDialog";
import { parseSubjectsFromText } from "@/lib/parseSubjects";
import type { SubjectItem } from "@/app/app/providers/AppDataProvider";

function highlightText(text: string, query: string): ReactNode {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="rounded bg-yellow-100 px-0.5 text-slate-900">{part}</mark>
      : part
  );
}

type MatchReason = "exact_code" | "exact_name" | "similar_code";

type ReviewCandidate = {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  reason: MatchReason;
  score: number;
  note: string;
};

type ReviewChoice = "" | "new" | `existing:${string}`;

type ParsedImportRow = {
  id: string;
  name: string;
  code: string;
  checked: boolean;
  isNew: boolean;
  needsReview: boolean;
  allowCreateNew: boolean;
  reviewChoice: ReviewChoice;
  reviewCandidates: ReviewCandidate[];
};

const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");

const normalizeCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array(b.length + 1).fill(0);
  const curr = new Array(b.length + 1).fill(0);

  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }

  return prev[b.length];
}

function getCodeDigitDifferenceSummary(inputCode: string, existingCode: string): { distance: number; digitDiff: number } | null {
  const left = normalizeCode(inputCode);
  const right = normalizeCode(existingCode);
  if (!left || !right) return null;

  const distance = levenshteinDistance(left, right);
  if (distance <= 0 || distance > 2) return null;

  const maxLen = Math.max(left.length, right.length);
  let digitDiff = 0;
  for (let i = 0; i < maxLen; i++) {
    const a = left[i] ?? "";
    const b = right[i] ?? "";
    if (a === b) continue;
    if (/\d/.test(a) || /\d/.test(b)) digitDiff += 1;
  }

  if (digitDiff <= 0 || digitDiff > 2) return null;
  return { distance, digitDiff };
}

function findReviewCandidates(row: { name: string; code: string }, existingSubjects: SubjectItem[]): ReviewCandidate[] {
  const rowName = normalizeName(row.name);
  const rowCode = normalizeCode(row.code);
  const bestBySubjectId = new Map<string, ReviewCandidate>();

  for (const existing of existingSubjects) {
    const existingName = normalizeName(existing.name);
    const existingCode = normalizeCode(existing.code);

    const registerCandidate = (candidate: ReviewCandidate) => {
      const current = bestBySubjectId.get(candidate.subjectId);
      if (!current || candidate.score < current.score) {
        bestBySubjectId.set(candidate.subjectId, candidate);
      }
    };

    if (rowCode && existingCode && rowCode === existingCode) {
      registerCandidate({
        subjectId: existing.id,
        subjectName: existing.name,
        subjectCode: existing.code,
        reason: "exact_code",
        score: 0,
        note: "Exact code match",
      });
    }

    if (rowName && existingName && rowName === existingName) {
      registerCandidate({
        subjectId: existing.id,
        subjectName: existing.name,
        subjectCode: existing.code,
        reason: "exact_name",
        score: 1,
        note: "Exact subject name match",
      });
    }

    const codeDiff = getCodeDigitDifferenceSummary(row.code, existing.code);
    if (codeDiff) {
      registerCandidate({
        subjectId: existing.id,
        subjectName: existing.name,
        subjectCode: existing.code,
        reason: "similar_code",
        score: 2 + codeDiff.distance,
        note: `Code is very close (${codeDiff.digitDiff} digit difference)`,
      });
    }
  }

  return [...bestBySubjectId.values()].sort((a, b) => a.score - b.score);
}

type SubjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddSubject: (name: string, code: string) => void;
  onEditSubject?: (id: string, name: string, code: string) => Promise<{ success: boolean; error?: string }>;
  existingSubject?: SubjectItem | null;
};

function SubjectModal({ isOpen, onClose, onAddSubject, onEditSubject, existingSubject }: SubjectModalProps) {
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [error, setError] = useState("");

  const isEditing = !!existingSubject;

  // Sync form when modal opens or existingSubject changes
  const [lastSubjectId, setLastSubjectId] = useState<string | null>(null);
  if (isOpen && existingSubject && existingSubject.id !== lastSubjectId) {
    setSubjectName(existingSubject.name);
    setSubjectCode(existingSubject.code);
    setError("");
    setLastSubjectId(existingSubject.id);
  } else if (isOpen && !existingSubject && lastSubjectId !== null) {
    setSubjectName("");
    setSubjectCode("");
    setError("");
    setLastSubjectId(null);
  }

  const handleClose = () => {
    setSubjectName("");
    setSubjectCode("");
    setError("");
    setLastSubjectId(null);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (isEditing && onEditSubject && existingSubject) {
      const result = await onEditSubject(existingSubject.id, subjectName, subjectCode);
      if (!result.success) {
        setError(result.error || "Failed to save.");
        return;
      }
    } else {
      onAddSubject(subjectName, subjectCode);
    }
    handleClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-700">
            {isEditing ? "Edit Subject" : "Add Subject"}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-lg font-medium text-rose-700">
              {error}
            </div>
          )}
          <label className="block">
            <span className="mb-2 block text-lg font-medium text-slate-600">
              Subject Name
            </span>
            <input
              required
              type="text"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-lg font-medium text-slate-600">
              Subject Code
            </span>
            <input
              required
              type="text"
              value={subjectCode}
              onChange={(event) => setSubjectCode(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-100 border border-slate-300 px-4 py-2 text-lg font-medium text-slate-700 transition hover:bg-slate-200"
            >
              {isEditing ? "Save Changes" : "Add Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type ImportSubjectsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImportBulk: (rows: { name: string; code: string }[]) => Promise<{ addedCount: number; skippedCount: number }>;
  existingSubjects: import("@/app/app/providers/AppDataProvider").SubjectItem[];
};

function ImportSubjectsModal({ isOpen, onClose, onImportBulk, existingSubjects }: ImportSubjectsModalProps) {
  const [pastedText, setPastedText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [view, setView] = useState<"paste" | "preview">("paste");

  const handleClose = () => {
    setPastedText("");
    setParsedRows([]);
    setView("paste");
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const buildParsedRow = (rawRow: { name: string; code: string }, id: string): ParsedImportRow => {
    const reviewCandidates = findReviewCandidates(rawRow, existingSubjects);
    const hasExactMatch = reviewCandidates.some((candidate) => candidate.reason === "exact_code" || candidate.reason === "exact_name");
    const needsReview = reviewCandidates.length > 0;
    const isNew = !needsReview;

    return {
      id,
      name: rawRow.name,
      code: rawRow.code,
      checked: isNew,
      isNew,
      needsReview,
      allowCreateNew: !hasExactMatch,
      reviewChoice: needsReview ? "" : "new",
      reviewCandidates,
    };
  };

  const processRawRows = (rawRows: { name: string; code: string }[]) => {
    const timestamp = Date.now();
    return rawRows.map((rawRow, i) => buildParsedRow(
      rawRow,
      `parsed-${i}-${timestamp}-${Math.random().toString(36).slice(2, 11)}`
    ));
  };


  const handleParse = () => {
    const rawRows = parseSubjectsFromText(pastedText);
    setParsedRows(processRawRows(rawRows));
    setView("preview");
  };

  const handleImport = async () => {
    const selectedRows = parsedRows.filter((r) => r.checked).map((r) => ({ name: r.name, code: r.code }));
    const { addedCount, skippedCount } = await onImportBulk(selectedRows);
    alert(`Imported ${addedCount} new subjects. Skipped ${skippedCount} existing.`);
    handleClose();
  };

  const unresolvedReviewCount = parsedRows.filter((row) => row.needsReview && row.reviewChoice === "").length;
  const canImport = parsedRows.length > 0 && parsedRows.some((row) => row.checked) && unresolvedReviewCount === 0;

  const handleNameChange = (rowId: string, name: string) => {
    setParsedRows((prev) =>
      prev.map((row) => (row.id === rowId ? buildParsedRow({ name, code: row.code }, row.id) : row))
    );
  };

  const handleCodeChange = (rowId: string, code: string) => {
    setParsedRows((prev) =>
      prev.map((row) => (row.id === rowId ? buildParsedRow({ name: row.name, code }, row.id) : row))
    );
  };

  const handleReviewChoiceChange = (rowId: string, reviewChoice: ReviewChoice) => {
    setParsedRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        if (!reviewChoice) {
          return { ...row, reviewChoice: "", checked: false, isNew: false };
        }

        if (reviewChoice === "new") {
          return { ...row, reviewChoice, checked: true, isNew: true };
        }

        return { ...row, reviewChoice, checked: false, isNew: false };
      })
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <h3 className="text-lg font-semibold text-slate-700">Import Subjects</h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {view === "paste" ? (
          <div className="flex-1 overflow-y-auto relative">
            <p className="mb-2 text-slate-600">Copy and paste your subject list from your university website directly into the box below.</p>
            <textarea
              className="w-full h-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-lg text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 resize-none placeholder:text-slate-400"
              placeholder="Paste your subject list here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleParse}
                disabled={!pastedText.trim()}
                className="rounded-lg bg-slate-600 px-4 py-2 text-lg font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                Parse
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
            <p className="mb-2 text-slate-600">Review the parsed subjects below. Rows with similar/existing subjects require manual selection before import.</p>
            {unresolvedReviewCount > 0 && (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Resolve {unresolvedReviewCount} flagged row{unresolvedReviewCount === 1 ? "" : "s"} before importing.
              </p>
            )}
            <div className="flex-1 overflow-auto overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-3 text-lg font-semibold text-slate-700">Import</th>
                    <th className="px-3 py-3 text-lg font-semibold text-slate-700">Name</th>
                    <th className="px-3 py-3 text-lg font-semibold text-slate-700">Code</th>
                    <th className="px-3 py-3 text-lg font-semibold text-slate-700">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {parsedRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500">No codes could be parsed from the text.</td>
                    </tr>
                  ) : (
                    parsedRows.map((row) => (
                      <tr key={row.id}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                            checked={row.checked}
                            disabled={row.needsReview}
                            onChange={(e) => {
                              setParsedRows((prev) => prev.map((r) => r.id === row.id ? { ...r, checked: e.target.checked, isNew: e.target.checked } : r));
                            }}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => handleNameChange(row.id, e.target.value)}
                            className="w-full border-0 bg-transparent p-0 text-slate-700 focus:ring-0"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={row.code}
                              onChange={(e) => handleCodeChange(row.id, e.target.value)}
                              className="w-full border-0 bg-transparent p-0 text-slate-700 font-mono focus:ring-0 font-medium"
                            />
                            {row.needsReview && row.reviewChoice === "" ? (
                              <span className="inline-flex whitespace-nowrap items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 shadow-sm">
                                Review
                              </span>
                            ) : row.reviewChoice.startsWith("existing:") ? (
                              <span className="inline-flex whitespace-nowrap items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20 shadow-sm">
                                Use Existing
                              </span>
                            ) : row.isNew ? (
                              <span className="inline-flex whitespace-nowrap items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 shadow-sm">
                                New
                              </span>
                            ) : (
                              <span className="inline-flex whitespace-nowrap items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 shadow-sm">
                                Exists
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 min-w-[340px]">
                          {row.needsReview ? (
                            <div className="space-y-2">
                              <select
                                value={row.reviewChoice}
                                onChange={(e) => handleReviewChoiceChange(row.id, e.target.value as ReviewChoice)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                              >
                                <option value="">Select existing subject...</option>
                                {row.reviewCandidates.map((candidate) => (
                                  <option key={candidate.subjectId} value={`existing:${candidate.subjectId}`}>
                                    Use {candidate.subjectCode?.trim() ? candidate.subjectCode : "NO-CODE"} - {candidate.subjectName}
                                  </option>
                                ))}
                                {row.allowCreateNew && (
                                  <option value="new">Import as new subject</option>
                                )}
                              </select>
                              <p className="text-xs text-slate-500">
                                {row.reviewCandidates[0]?.note || "Similar subject found. Choose existing or mark as new."}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">No conflicts detected.</span>
                          )}
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
                className="rounded-lg border border-slate-300 px-4 py-2 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back to Paste
              </button>
              <button
                onClick={handleImport}
                disabled={!canImport}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-lg font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
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

export default function SubjectsPage() {
  const { subjects, assignments, addSubject, editSubject, deleteSubject, addSubjectsBulk } = useAppData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; warning: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditable = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.key === "/" && !isEditable) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (e.key === "Escape") {
        setSearchQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredSubjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return subjects;
    return subjects.filter(
      s => s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query)
    );
  }, [subjects, searchQuery]);

  const getAssignmentCount = (subjectId: string) =>
    assignments.filter(a => a.subjectId === subjectId).length;

  const handleEditClick = (subject: SubjectItem) => {
    setEditingSubject(subject);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (subject: SubjectItem) => {
    const count = getAssignmentCount(subject.id);
    const warning = count > 0
      ? `This will also delete ${count} assignment${count > 1 ? "s" : ""} linked to this subject.`
      : "";
    setPendingDelete({ id: subject.id, name: subject.name, warning });
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingSubject(null);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Subjects</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-lg font-medium text-slate-700 transition hover:bg-slate-200"
            >
              Import Subjects
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingSubject(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-lg bg-slate-100 border border-slate-300 px-4 py-2 text-lg font-medium text-slate-700 transition hover:bg-slate-200"
            >
              Add Subject
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="block flex-1 max-w-md">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects by name or code…  ( / )"
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-lg text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 placeholder:text-slate-400"
            />
          </label>
          <span className="text-lg text-slate-500 whitespace-nowrap">
            Showing {filteredSubjects.length} of {subjects.length} subjects
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 text-lg font-semibold text-slate-600">
                  Subject Name
                </th>
                <th className="px-3 py-3 text-lg font-semibold text-slate-600">
                  Subject Code
                </th>
                <th className="px-3 py-3 text-lg font-semibold text-slate-600">
                  Assignments
                </th>
                <th className="px-3 py-3 text-lg font-semibold text-slate-600 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-lg text-slate-500">
                    {searchQuery.trim() ? "No subjects match your search." : "No subjects added yet."}
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => {
                  const count = getAssignmentCount(subject.id);
                  return (
                    <tr key={subject.id}>
                      <td className="px-3 py-4 text-lg font-medium text-slate-700">
                        <Link
                          href={`/app/subjects/${subject.id}`}
                          className="hover:underline decoration-slate-300 underline-offset-2"
                        >
                          {highlightText(subject.name, searchQuery.trim())}
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-lg font-medium text-slate-700 font-mono">
                        {highlightText(subject.code, searchQuery.trim())}
                      </td>
                      <td className="px-3 py-4 text-lg text-slate-500">
                        {count}
                      </td>
                      <td className="px-3 py-4 text-lg flex justify-end">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditClick(subject)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(subject)}
                            className="rounded-lg border border-rose-200 px-3 py-1.5 text-lg font-medium text-rose-600 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }))
              }
            </tbody>
          </table>
        </div>
      </section>

      <SubjectModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onAddSubject={addSubject}
        onEditSubject={editSubject}
        existingSubject={editingSubject}
      />
      <ImportSubjectsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportBulk={addSubjectsBulk}
        existingSubjects={subjects}
      />
      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Delete Subject"
        message={pendingDelete ? `Are you sure you want to delete "${pendingDelete.name}"?${pendingDelete.warning ? " " + pendingDelete.warning : ""}` : ""}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (pendingDelete) deleteSubject(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
