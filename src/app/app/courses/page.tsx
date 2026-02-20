"use client";

import { type FormEvent, useState } from "react";
import { useAppData } from "@/app/app/providers/AppDataProvider";
import { parseSubjectsFromText } from "@/lib/parseSubjects";

type AddSubjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddSubject: (name: string, code: string) => void;
};

function AddSubjectModal({ isOpen, onClose, onAddSubject }: AddSubjectModalProps) {
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");

  const handleClose = () => {
    setSubjectName("");
    setSubjectCode("");
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAddSubject(subjectName, subjectCode);
    handleClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Add Subject</h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-lg font-medium text-slate-600">
              Subject Name
            </span>
            <input
              required
              type="text"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-lg font-semibold text-white transition hover:bg-slate-700"
            >
              Add Subject
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
  onImportBulk: (rows: { name: string; code: string }[]) => void;
};

function ImportSubjectsModal({ isOpen, onClose, onImportBulk }: ImportSubjectsModalProps) {
  const [pastedText, setPastedText] = useState("");
  const [parsedRows, setParsedRows] = useState<{ id: string; name: string; code: string; checked: boolean }[]>([]);
  const [view, setView] = useState<"paste" | "preview">("paste");

  const handleClose = () => {
    setPastedText("");
    setParsedRows([]);
    setView("paste");
    onClose();
  };

  const handleParse = () => {
    const rawRows = parseSubjectsFromText(pastedText);
    setParsedRows(
      rawRows.map((r, i) => ({
        id: `parsed-${i}-${Date.now()}`,
        name: r.name,
        code: r.code,
        checked: true,
      }))
    );
    setView("preview");
  };

  const handleImport = () => {
    const selectedRows = parsedRows.filter((r) => r.checked).map((r) => ({ name: r.name, code: r.code }));
    onImportBulk(selectedRows);
    alert(`Imported ${selectedRows.length} subjects successfully!`);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Import Subjects</h3>
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
            <p className="mb-2 text-slate-600">Copy and paste your subject list from your university website directly into the box below. We will attempt to automatically extract the Subject Name and Subject Code.</p>
            <textarea
              className="w-full h-64 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 resize-none"
              placeholder="Paste your subject list here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleParse}
                disabled={!pastedText.trim()}
                className="rounded-xl bg-slate-900 px-4 py-2 text-lg font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                Parse
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
            <p className="mb-4 text-slate-600">Review the parsed subjects below. You can uncheck items or double-click text to edit.</p>
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-3 text-sm font-semibold text-slate-900">Import</th>
                    <th className="px-3 py-3 text-sm font-semibold text-slate-900">Name</th>
                    <th className="px-3 py-3 text-sm font-semibold text-slate-900">Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {parsedRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-500">No codes could be parsed from the text.</td>
                    </tr>
                  ) : (
                    parsedRows.map((row) => (
                      <tr key={row.id}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                            checked={row.checked}
                            onChange={(e) => {
                              setParsedRows((prev) => prev.map((r) => r.id === row.id ? { ...r, checked: e.target.checked } : r));
                            }}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => setParsedRows((prev) => prev.map((r) => r.id === row.id ? { ...r, name: e.target.value } : r))}
                            className="w-full border-0 bg-transparent p-0 text-sm focus:ring-0"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={row.code}
                            onChange={(e) => setParsedRows((prev) => prev.map((r) => r.id === row.id ? { ...r, code: e.target.value } : r))}
                            className="w-full border-0 bg-transparent p-0 text-sm font-mono focus:ring-0 font-medium"
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

export default function SubjectsPage() {
  const { subjects, addSubject, addSubjectsBulk } = useAppData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Subjects</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Import Subjects
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-lg font-semibold text-white transition hover:bg-slate-700"
            >
              Add Subject
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 text-lg font-semibold text-slate-600">
                  Subject Name
                </th>
                <th className="px-3 py-3 text-lg font-semibold text-slate-600">
                  Subject Code
                </th>
                <th className="px-3 py-3 text-lg font-semibold text-slate-600 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((subject) => (
                <tr key={subject.id}>
                  <td className="px-3 py-4 text-lg font-medium text-slate-900">
                    {subject.name}
                  </td>
                  <td className="px-3 py-4 text-lg font-medium text-slate-700 font-mono">
                    {subject.code}
                  </td>
                  <td className="px-3 py-4 text-lg flex justify-end">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-slate-500">No subjects added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AddSubjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSubject={addSubject}
      />
      <ImportSubjectsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportBulk={addSubjectsBulk}
      />
    </div>
  );
}
