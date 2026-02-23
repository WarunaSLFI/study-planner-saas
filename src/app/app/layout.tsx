import type { Metadata } from "next";
import AppDataProvider from "@/app/app/providers/AppDataProvider";
import NotificationProvider from "@/app/app/providers/NotificationProvider";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppDataProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-slate-50 md:pl-64">
          <Sidebar />
          <div className="flex min-h-screen flex-col md:h-screen md:overflow-hidden">
            <Header />
            <main className="flex-1 p-6 md:overflow-y-auto">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>
        </div>
      </NotificationProvider>
    </AppDataProvider>
  );
}
