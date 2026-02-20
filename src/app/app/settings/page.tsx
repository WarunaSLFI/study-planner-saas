"use client";

import { useState } from "react";
import { useAppData } from "@/app/app/providers/AppDataProvider";

export default function SettingsPage() {
  const { resetData, exportData, importData } = useAppData();
  const [importJson, setImportJson] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all data back to the demo defaults? This action cannot be undone.")) {
      resetData();
      alert("Data reset successfully.");
    }
  };

  const handleExport = () => {
    const dataString = exportData();
    const blob = new Blob([dataString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assignment-tracker-backup.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importJson.trim()) return;

    const success = importData(importJson);
    if (success) {
      setImportStatus("success");
      setImportJson("");
      setTimeout(() => setImportStatus("idle"), 3000);
    } else {
      setImportStatus("error");
      setTimeout(() => setImportStatus("idle"), 3000);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Settings</h1>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800">Data Management</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your local data. You can export a backup, import previously exported data, or completely reset to demo settings.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={handleExport}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Export Data
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
          >
            Reset Demo Data
          </button>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-sm font-medium text-slate-900">Import Data</h3>
          <p className="mt-1 text-xs text-slate-500">
            Paste your JSON backup data below to restore your courses and assignments.
          </p>
          <textarea
            className="mt-3 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            rows={5}
            placeholder='{"courses": [...], "assignments": [...], "activity": [...]}'
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
          />
          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={handleImport}
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
    </div>
  );
}
