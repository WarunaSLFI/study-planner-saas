import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 md:pl-64">
      <Sidebar />
      <div className="flex min-h-screen flex-col md:h-screen md:overflow-hidden">
        <Header />
        <main className="flex-1 p-6 md:overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
