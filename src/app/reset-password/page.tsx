"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
    const router = useRouter();
    const supabase = createClient();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/app/dashboard");
                    router.refresh();
                }, 2000);
            }
        } catch {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-900">Study Planner</h1>
                    <p className="mt-2 text-lg text-slate-500">Set a new password</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    {success ? (
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900">Password updated!</h2>
                            <p className="mt-3 text-lg text-slate-600">Redirecting you to the app…</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-semibold text-slate-900">Reset your password</h2>
                            <p className="mt-1 text-lg text-slate-500">Enter your new password below.</p>

                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                {error && (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-lg font-medium text-rose-700">
                                        {error}
                                    </div>
                                )}

                                <label className="block">
                                    <span className="block text-lg font-medium text-slate-700">New Password</span>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={6}
                                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
 />
                                </label>

                                <label className="block">
                                    <span className="block text-lg font-medium text-slate-700">Confirm Password</span>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={6}
                                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
 />
                                </label>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-lg font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
 >
                                    {loading ? "Updating…" : "Update Password"}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
