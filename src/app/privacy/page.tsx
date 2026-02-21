import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy – Study Planner",
    description: "Privacy Policy for Study Planner SaaS.",
};

export default function PrivacyPage() {
    return (
        <main className="mx-auto max-w-2xl px-6 py-16">
            <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
            <p className="mt-2 text-lg text-slate-500">Last updated: February 21, 2026</p>

            <div className="mt-8 space-y-6 text-lg leading-relaxed text-slate-700">
                <section>
                    <h2 className="text-lg font-semibold text-slate-900">1. Information We Collect</h2>
                    <p className="mt-2">
                        We collect only the information necessary to provide the Service:
                    </p>
                    <ul className="mt-2 list-disc pl-6 space-y-1">
                        <li><strong>Email address</strong> — used for authentication and account recovery.</li>
                        <li><strong>Profile name</strong> — optionally provided by you for display purposes.</li>
                        <li><strong>Study data</strong> — subjects, assignments, and preferences you create within the app.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-slate-900">2. How We Use Your Data</h2>
                    <p className="mt-2">
                        Your data is used solely to provide and improve the Service. We do not sell, rent, or share your personal data with third parties for marketing purposes.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-slate-900">3. Data Storage & Security</h2>
                    <p className="mt-2">
                        Your data is stored securely using Supabase, which provides encryption at rest and in transit. Row-Level Security ensures that each user can only access their own data.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-slate-900">4. Data Retention & Deletion</h2>
                    <p className="mt-2">
                        You may delete your data at any time through the Settings page. You may also export your data in JSON format for backup purposes. Account deletion requests can be submitted by contacting us.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-slate-900">5. Cookies</h2>
                    <p className="mt-2">
                        We use essential cookies only for authentication session management. We do not use tracking cookies or third-party analytics that collect personal data.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-slate-900">6. Changes to This Policy</h2>
                    <p className="mt-2">
                        We may update this Privacy Policy from time to time. We will notify users of significant changes through the application.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-slate-900">7. Contact</h2>
                    <p className="mt-2">
                        For privacy-related questions or data deletion requests, please contact us through the application.
                    </p>
                </section>
            </div>
        </main>
    );
}
