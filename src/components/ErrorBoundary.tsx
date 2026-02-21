"use client";

import React from "react";

type Props = {
    children: React.ReactNode;
};

type State = {
    hasError: boolean;
    error: Error | null;
};

export default class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-[400px] items-center justify-center p-8">
                    <div className="w-full max-w-md text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
                            <svg className="h-7 w-7 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
                        <p className="mt-2 text-lg text-slate-500">
                            {this.state.error?.message || "An unexpected error occurred."}
                        </p>
                        <button
                            type="button"
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="mt-6 rounded-xl bg-slate-900 px-6 py-2.5 text-lg font-semibold text-white transition hover:bg-slate-700"
 >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
