export default function SettingsLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 rounded bg-slate-200" />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="h-5 w-40 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-200" />
                <div className="flex gap-3">
                    <div className="h-10 w-28 rounded-lg bg-slate-200" />
                    <div className="h-10 w-28 rounded-lg bg-slate-200" />
                </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="h-5 w-32 rounded bg-slate-200" />
                <div className="h-10 w-full rounded-xl bg-slate-200" />
                <div className="h-10 w-full rounded-xl bg-slate-200" />
            </div>
        </div>
    );
}
