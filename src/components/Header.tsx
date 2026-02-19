"use client";

import { usePathname } from "next/navigation";

type HeaderProps = {
  title?: string;
};

const appPageTitles = [
  { href: "/app/dashboard", title: "Dashboard Page" },
  { href: "/app/tasks", title: "Tasks Page" },
  { href: "/app/planner", title: "Planner Page" },
  { href: "/app/settings", title: "Settings Page" },
];

function getTitleFromPath(pathname: string): string {
  const activeRoute = appPageTitles.find(
    (route) => pathname === route.href || pathname.startsWith(`${route.href}/`),
  );

  return activeRoute?.title ?? "Study Planner";
}

export default function Header({ title }: HeaderProps) {
  const pathname = usePathname();
  const resolvedTitle = title ?? getTitleFromPath(pathname);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <h1 className="text-lg font-semibold text-slate-900">{resolvedTitle}</h1>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
