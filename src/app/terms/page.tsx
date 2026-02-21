import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service – Study Planner",
    description: "Terms of Service for Study Planner SaaS.",
};

export default function TermsPage() {
    return (
        <main className="mx-auto max-w-2xl px-6 py-16">
            <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
            <p className="mt-2 text-lg text-slate-500">Last updated: February 21, 2026</p>

            <div className="mt-8 space-y-6 text-lg leading-relaxed text-slate-700">
                <section>
                    <h2 className="text-lg font-semibold text-slate-900">1. Acceptance of Terms</h2>
                    <p className="mt-2">
                        By accessing and using Study Planner (&quot;the Service&quot;), you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-slate-900">2. Description of Service</h2>
                    <p className="mt-2">
                        Study Planner is a web application that helps students organize their subjects, assignments, and study schedules. The Service is provided &quot;as is&quot; without warranties of any kind.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-slate-900">3. User Accounts</h2>
                    <p className="mt-2">
                        You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information during registration and to update your information as needed.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-slate-900">4. User Data</h2>
                    <p className="mt-2">
                        You retain ownership of all data you enter into the Service. We store your data securely and do not share it with third parties. You may export or delete your data at any time through the Settings page.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-slate-900">5. Acceptable Use</h2>
                    <p className="mt-2">
                        You agree not to misuse the Service, including but not limited to: attempting to access other users&apos; data, disrupting the Service, or using automated tools to excessively load the system.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-slate-900">6. Limitation of Liability</h2>
                    <p className="mt-2">
                        The Service is provided for educational organization purposes. We are not liable for any loss of data, missed deadlines, or academic consequences resulting from use of the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-slate-900">7. Changes to Terms</h2>
                    <p className="mt-2">
                        We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the updated terms.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-slate-900">8. Contact</h2>
                    <p className="mt-2">
                        For questions about these Terms, please contact us through the application.
                    </p>
                </section>
            </div>
        </main>
    );
}
