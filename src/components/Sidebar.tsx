import NavLink from "@/components/NavLink";
import pkg from "../../package.json";

export const navigationItems = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/courses", label: "Subjects" },
  { href: "/app/tasks", label: "Assignments" },
  { href: "/app/planner", label: "Planner" },
  { href: "/app/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-full flex-col border-b border-slate-200 bg-white md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-b-0 md:border-r">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <span className="text-2xl font-semibold text-slate-700">
            Study Planner
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-4 text-lg font-medium">
          {navigationItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-100 p-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-lg font-bold text-slate-400 uppercase tracking-widest">Version</span>
            <span className="text-lg font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
              v{pkg.version}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
