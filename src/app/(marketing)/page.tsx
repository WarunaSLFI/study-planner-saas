import Link from "next/link";

export default function MarketingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
          Study Planner SaaS
        </h1>
        <p className="mt-4 text-lg text-slate-600">Plan smarter. Study better.</p>
        <Link
          href="/app/dashboard"
          className="mt-8 inline-block rounded-xl bg-slate-900 px-6 py-3 text-lg font-semibold text-white transition hover:bg-slate-700"
        >
          Enter App
        </Link>
      </section>
    </main>
  );
}
