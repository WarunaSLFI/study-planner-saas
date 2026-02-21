export default function CoursesLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="flex items-center justify-between">
                <div className="h-10 w-48 rounded-xl bg-slate-200" />
                <div className="h-10 w-32 rounded-xl bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="h-5 w-32 rounded bg-slate-200" />
                        <div className="mt-2 h-4 w-20 rounded bg-slate-200" />
                        <div className="mt-4 h-4 w-full rounded bg-slate-200" />
                    </div>
                ))}
            </div>
        </div>
    );
}
