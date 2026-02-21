export default function TasksLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="flex items-center justify-between">
                <div className="h-10 w-48 rounded-xl bg-slate-200" />
                <div className="h-10 w-32 rounded-xl bg-slate-200" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3">
                    <div className="flex gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-5 w-20 rounded bg-slate-200" />
                        ))}
                    </div>
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="border-b border-slate-100 px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-4">
                                <div className="h-5 w-32 rounded bg-slate-200" />
                                <div className="h-5 w-24 rounded bg-slate-200" />
                            </div>
                            <div className="h-7 w-20 rounded-md bg-slate-200" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
