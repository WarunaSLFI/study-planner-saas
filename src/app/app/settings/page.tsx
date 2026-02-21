"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppData } from "@/app/app/providers/AppDataProvider";

// ─── Preferences ────────────────────────────────────────────────────────────

type Preferences = {
  defaultAssignmentSort: "dueDateAsc" | "dueDateDesc" | "createdAtDesc";
  hideCompletedByDefault: boolean;
  weekStartsOnMonday: boolean;
  dateDisplayFormat: "ISO" | "Readable";
};

const PREFS_KEY = "studyPlannerSettings:v1";

const defaultPreferences: Preferences = {
  defaultAssignmentSort: "dueDateAsc",
  hideCompletedByDefault: false,
  weekStartsOnMonday: true,
  dateDisplayFormat: "Readable",
};

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPreferences;
    return { ...defaultPreferences, ...JSON.parse(raw) };
  } catch {
    return defaultPreferences;
  }
}

// ─── Reset Confirmation Modal ───────────────────────────────────────────────

function ResetModal({ isOpen, onClose, onConfirm }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const isMatch = confirmText === "RESET";

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  const handleConfirm = () => {
    if (!isMatch) return;
    onConfirm();
    setConfirmText("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-red-600">Reset All Data</h3>
        <p className="mt-3 text-sm text-slate-600">
          This will <strong>permanently delete</strong> all subjects and assignments stored on this device. This action cannot be undone.
        </p>
        <p className="mt-4 text-sm font-medium text-slate-700">
          Type <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-red-600">RESET</code> to confirm:
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type RESET"
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
          autoFocus
        />
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isMatch}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete Everything
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Page ──────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { resetData, exportData, importData } = useAppData();

  // Reset modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Import state
  const [importJson, setImportJson] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preferences
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const prefsSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  const updatePref = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return next;
    });
    setPrefsSaved(true);
    if (prefsSavedTimer.current) clearTimeout(prefsSavedTimer.current);
    prefsSavedTimer.current = setTimeout(() => setPrefsSaved(false), 1500);
  }, []);

  // ── Handlers ──

  const handleReset = () => {
    resetData();
    setIsResetModalOpen(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  const handleExport = () => {
    const dataString = exportData();
    const blob = new Blob([dataString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "study-planner-backup.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportText = () => {
    if (!importJson.trim()) return;
    const success = importData(importJson);
    if (success) {
      setImportStatus("success");
      setImportJson("");
    } else {
      setImportStatus("error");
    }
    setTimeout(() => setImportStatus("idle"), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = importData(text);
      if (success) {
        setImportStatus("success");
        setImportJson("");
      } else {
        setImportStatus("error");
      }
      setTimeout(() => setImportStatus("idle"), 3000);
    };
    reader.readAsText(file);

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Render ──

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Settings</h1>

      {/* ─── Data Management ───────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800">Data Management</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your local data. You can export a backup, import previously exported data, or completely reset.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={handleExport}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Export Data
          </button>
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
          >
            Reset All Data
          </button>
          {resetSuccess && (
            <span className="text-sm font-medium text-green-600">Data reset successfully!</span>
          )}
        </div>

        {/* Import section */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-sm font-medium text-slate-900">Import Data</h3>
          <p className="mt-1 text-xs text-slate-500">
            Upload a JSON backup file or paste JSON data below to restore your subjects and assignments.
          </p>

          {/* File upload */}
          <div className="mt-4">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload JSON File
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Textarea paste */}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">OR paste JSON</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <textarea
            className="mt-3 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            rows={5}
            placeholder='{"subjects": [...], "assignments": [...], "activity": [...]}'
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
          />
          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={handleImportText}
              disabled={!importJson.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              Import
            </button>
            {importStatus === "success" && (
              <span className="text-sm font-medium text-green-600">Data imported successfully!</span>
            )}
            {importStatus === "error" && (
              <span className="text-sm font-medium text-red-600">Failed to import data. Invalid format.</span>
            )}
          </div>
        </div>
      </section>

      {/* ─── Preferences ───────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Preferences</h2>
            <p className="mt-1 text-sm text-slate-500">
              Customize your app behavior. Changes are saved automatically.
            </p>
          </div>
          {prefsSaved && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200 transition-opacity">
              ✓ Saved
            </span>
          )}
        </div>

        <div className="mt-6 space-y-6">
          {/* Default Sort */}
          <label className="block">
            <span className="block text-sm font-medium text-slate-700">Default Assignment Sort</span>
            <select
              value={prefs.defaultAssignmentSort}
              onChange={(e) => updatePref("defaultAssignmentSort", e.target.value as Preferences["defaultAssignmentSort"])}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="dueDateAsc">Due Date (Earliest First)</option>
              <option value="dueDateDesc">Due Date (Latest First)</option>
              <option value="createdAtDesc">Newest First</option>
            </select>
          </label>

          {/* Date format */}
          <label className="block">
            <span className="block text-sm font-medium text-slate-700">Date Display Format</span>
            <select
              value={prefs.dateDisplayFormat}
              onChange={(e) => updatePref("dateDisplayFormat", e.target.value as Preferences["dateDisplayFormat"])}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="Readable">Readable (e.g. 21 Feb 2026)</option>
              <option value="ISO">ISO (e.g. 2026-02-21)</option>
            </select>
          </label>

          {/* Hide completed by default */}
          <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3.5 transition hover:bg-slate-50 cursor-pointer">
            <div>
              <span className="block text-sm font-medium text-slate-700">Hide Completed by Default</span>
              <span className="block text-xs text-slate-500">
                When enabled, completed assignments are hidden by default on the Assignments page.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.hideCompletedByDefault}
              onChange={(e) => updatePref("hideCompletedByDefault", e.target.checked)}
              className="h-5 w-5 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer"
            />
          </label>

          {/* Week starts on Monday */}
          <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3.5 transition hover:bg-slate-50 cursor-pointer">
            <div>
              <span className="block text-sm font-medium text-slate-700">Week Starts on Monday</span>
              <span className="block text-xs text-slate-500">
                When enabled, the week starts on Monday instead of Sunday.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.weekStartsOnMonday}
              onChange={(e) => updatePref("weekStartsOnMonday", e.target.checked)}
              className="h-5 w-5 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer"
            />
          </label>
        </div>
      </section>

      {/* Reset Modal */}
      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleReset}
      />
    </div>
  );
}
