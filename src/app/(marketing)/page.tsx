import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Planner – Plan Smarter, Study Better",
  description:
    "Organize your subjects, track assignments, and plan your study schedule — all in one place.",
};

export default function MarketingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <div className="flex flex-1 items-center justify-center px-6">
        <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Study Planner
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Plan smarter. Study better.
            </p>
            <p className="mt-2 text-lg text-slate-500">
              Organize your subjects, track assignments, and never miss a deadline.
            </p>
            <Link
              href="/app/dashboard"
              className="mt-8 inline-block rounded-xl bg-slate-900 px-8 py-3 text-lg font-semibold text-white transition hover:bg-slate-700"
 >
              Get Started — It&apos;s Free
            </Link>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center shadow-sm">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Subjects</h3>
              <p className="mt-1 text-lg text-slate-500">Organize by course</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center shadow-sm">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Assignments</h3>
              <p className="mt-1 text-lg text-slate-500">Track due dates</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center shadow-sm">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Dashboard</h3>
              <p className="mt-1 text-lg text-slate-500">See what&apos;s due</p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 mt-auto">
        <div className="mx-auto flex max-w-4xl items-center justify-between text-lg text-slate-500">
          <span>&copy; {new Date().getFullYear()} Study Planner</span>
          <div className="flex gap-4">
            <Link href="/terms" className="transition hover:text-slate-700">Terms</Link>
            <Link href="/privacy" className="transition hover:text-slate-700">Privacy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
