export default function DashboardLoading() {
    return (
        <div className="animate-pulse space-y-6">
            {/* Stat cards skeleton */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="h-5 w-24 rounded bg-slate-200" />
                        <div className="mt-3 h-8 w-16 rounded bg-slate-200" />
                    </div>
                ))}
            </div>
            {/* Due schedule skeleton */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="h-6 w-40 rounded bg-slate-200" />
                <div className="mt-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="h-5 w-64 rounded bg-slate-200" />
                            <div className="h-7 w-20 rounded-md bg-slate-200" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
