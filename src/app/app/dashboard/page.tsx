import StatCard from "@/components/StatCard";

const dashboardStats = [
  { title: "Upcoming", value: "3" },
  { title: "Overdue", value: "1" },
  { title: "Completed", value: "12" },
  { title: "Average Score", value: "82%" },
];

const recentActivities = [
  "Submitted Operating Systems Exercise 4",
  "Added Datapipelines Project",
  "Updated marks for Finnish Society quiz",
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} />
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Recent Activity</h2>
        <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {recentActivities.map((activity) => (
            <p key={activity} className="px-4 py-4 text-2xl text-slate-700">
              {activity}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
