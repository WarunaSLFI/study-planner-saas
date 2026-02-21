import NavLink from "@/components/NavLink";

export const navigationItems = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/courses", label: "Subjects" },
  { href: "/app/tasks", label: "Assignments" },
  { href: "/app/planner", label: "Planner" },
  { href: "/app/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-full border-b border-slate-200 bg-white md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-b-0 md:border-r">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <span className="text-2xl font-semibold text-slate-900">
            Study Planner
          </span>
        </div>

        <nav className="space-y-1 p-4 text-lg font-medium">
          {navigationItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </div>
    </aside>
  );
}
