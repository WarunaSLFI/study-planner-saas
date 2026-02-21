"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextUrl = searchParams.get("next") || "/app/dashboard";
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    // Post-signup confirmation screen
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationEmail, setConfirmationEmail] = useState("");
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    // Resend cooldown
    const [cooldown, setCooldown] = useState(0);
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup cooldown timer on unmount
    useEffect(() => {
        return () => {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
        };
    }, []);

    const startCooldown = useCallback(() => {
        setCooldown(30);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) {
                    if (cooldownRef.current) clearInterval(cooldownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setResendMessage("");
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) {
                    setError(error.message);
                } else {
                    // Show confirmation screen instead of redirecting
                    setConfirmationEmail(email);
                    setShowConfirmation(true);
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) {
                    // Check for email-not-confirmed error
                    if (error.message.toLowerCase().includes("email not confirmed")) {
                        setError("Please verify your email first. Check your inbox or spam folder.");
                        setConfirmationEmail(email);
                    } else {
                        setError(error.message);
                    }
                } else {
                    router.push(nextUrl);
                    router.refresh();
                }
            }
        } catch {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendConfirmation = async () => {
        if (cooldown > 0) return;
        setResending(true);
        setResendMessage("");
        setError("");
        try {
            const { error } = await supabase.auth.resend({
                type: "signup",
                email: confirmationEmail,
            });
            if (error) {
                setResendMessage(`Failed to resend: ${error.message}`);
            } else {
                setResendMessage("Confirmation email sent! Check your inbox.");
                startCooldown();
            }
        } catch {
            setResendMessage("Something went wrong. Please try again.");
        } finally {
            setResending(false);
        }
    };

    // ── Post-signup confirmation screen ──────────────────────────────────
    if (showConfirmation) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <div className="w-full max-w-md">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900">Check your email</h2>
                        <p className="mt-3 text-lg text-slate-600">
                            We sent a confirmation link to{" "}
                            <span className="font-medium text-slate-900">{confirmationEmail}</span>.
                        </p>
                        <p className="mt-2 text-lg text-slate-500">
                            Please verify your email, then come back and sign in.
                        </p>

                        {resendMessage && (
                            <div className={`mt-4 rounded-lg border px-4 py-3 text-lg font-medium ${resendMessage.includes("Failed") || resendMessage.includes("wrong") ? "border-rose-200 bg-rose-50 text-rose-700" : "border-green-200 bg-green-50 text-green-700"}`}>
                                {resendMessage}
                            </div>
                        )}

                        <div className="mt-6 space-y-3">
                            <button
                                type="button"
                                onClick={handleResendConfirmation}
                                disabled={resending || cooldown > 0}
                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-lg font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                {resending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend confirmation email"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowConfirmation(false);
                                    setIsSignUp(false);
                                    setError("");
                                    setSuccessMessage("");
                                    setResendMessage("");
                                }}
                                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-lg font-semibold text-white transition hover:bg-slate-700"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Login / Signup form ──────────────────────────────────────────────
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-900">Study Planner</h1>
                    <p className="mt-2 text-lg text-slate-500">Plan smarter. Study better.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">
                        {isSignUp ? "Create an account" : "Sign in"}
                    </h2>
                    <p className="mt-1 text-lg text-slate-500">
                        {isSignUp
                            ? "Enter your email and password to get started."
                            : "Enter your credentials to access your planner."}
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        {error && (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-lg font-medium text-rose-700">
                                {error}
                                {/* Show resend link inline when email not confirmed */}
                                {confirmationEmail && !isSignUp && error.includes("verify") && (
                                    <button
                                        type="button"
                                        onClick={handleResendConfirmation}
                                        disabled={resending}
                                        className="mt-2 block w-full text-left text-lg font-medium text-rose-800 underline hover:no-underline disabled:opacity-50"
                                    >
                                        {resending ? "Sending…" : "Resend confirmation email"}
                                    </button>
                                )}
                            </div>
                        )}
                        {successMessage && (
                            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-lg font-medium text-green-700">
                                {successMessage}
                            </div>
                        )}
                        {resendMessage && !showConfirmation && (
                            <div className={`rounded-lg border px-4 py-3 text-lg font-medium ${resendMessage.includes("Failed") || resendMessage.includes("wrong") ? "border-rose-200 bg-rose-50 text-rose-700" : "border-green-200 bg-green-50 text-green-700"}`}>
                                {resendMessage}
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
                                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </label>

                        <label className="block">
                            <span className="block text-lg font-medium text-slate-700">Password</span>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                minLength={6}
                                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-lg font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                        >
                            {loading ? "Please wait…" : isSignUp ? "Create Account" : "Sign In"}
                        </button>
                    </form>

                    {!isSignUp && (
                        <div className="mt-4 text-center">
                            <Link href="/forgot-password" className="text-lg text-slate-500 hover:text-slate-900 hover:underline">
                                Forgot your password?
                            </Link>
                        </div>
                    )}

                    <div className="mt-6 text-center text-lg text-slate-500">
                        {isSignUp ? (
                            <>
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => { setIsSignUp(false); setError(""); setSuccessMessage(""); setResendMessage(""); }}
                                    className="font-medium text-slate-900 hover:underline"
                                >
                                    Sign in
                                </button>
                            </>
                        ) : (
                            <>
                                Don&apos;t have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => { setIsSignUp(true); setError(""); setSuccessMessage(""); setResendMessage(""); }}
                                    className="font-medium text-slate-900 hover:underline"
                                >
                                    Create one
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><p className="text-lg text-slate-500">Loading…</p></div>}>
            <LoginForm />
        </Suspense>
    );
}
