"use client";

import { usePathname } from "next/navigation";

type HeaderProps = {
  title?: string;
};

export default function Header({ title }: HeaderProps) {
  const pathname = usePathname();
  const resolvedTitle =
    title ??
    (pathname.startsWith("/app/assignments/")
      ? "Assignment Details"
      : "Assignment Tracker");

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <h1 className="text-2xl font-semibold text-slate-900">{resolvedTitle}</h1>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-2xl font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <span
            className="h-6 w-6 rounded-full bg-slate-200"
            aria-hidden="true"
          />
          Waruna
        </button>
      </div>
    </header>
  );
}
