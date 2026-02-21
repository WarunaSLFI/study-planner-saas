import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planner – Study Planner",
  description: "Plan your study schedule and stay organized.",
};

export default function PlannerPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">Planner</h2>
      <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Coming Soon</h3>
        <p className="mt-2 max-w-sm text-lg text-slate-500">
          The study planner with weekly/monthly calendar view is currently under development. Check back soon!
        </p>
      </div>
    </section>
  );
}
