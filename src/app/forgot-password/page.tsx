"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            });
            if (error) {
                setError(error.message);
            } else {
                setSent(true);
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
                <div className="mb-4">
                    <Link href="/" className="text-lg font-medium text-slate-500 transition hover:text-slate-900">
                        &larr; Back to Home
                    </Link>
                </div>
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-900">Study Planner</h1>
                    <p className="mt-2 text-lg text-slate-500">Reset your password</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    {sent ? (
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900">Check your email</h2>
                            <p className="mt-3 text-lg text-slate-600">
                                We sent a password reset link to{" "}
                                <span className="font-medium text-slate-900">{email}</span>.
                            </p>
                            <p className="mt-2 text-lg text-slate-500">
                                Click the link in the email to reset your password.
                            </p>
                            <Link
                                href="/login"
                                className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-2.5 text-lg font-semibold text-white transition hover:bg-slate-700"
 >
                                Back to Sign In
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-semibold text-slate-900">Forgot your password?</h2>
                            <p className="mt-1 text-lg text-slate-500">
                                Enter your email and we&apos;ll send you a reset link.
                            </p>

                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                {error && (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-lg font-medium text-rose-700">
                                        {error}
                                    </div>
                                )}

                                <label className="block">
                                    <span className="block text-lg font-medium text-slate-700">Email</span>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
 />
                                </label>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-lg font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
 >
                                    {loading ? "Sending…" : "Send reset link"}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link href="/login" className="text-lg font-medium text-slate-900 hover:underline">
                                    Back to Sign In
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
