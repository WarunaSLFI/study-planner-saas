import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Study Planner – Plan Smarter, Study Better",
    template: "%s – Study Planner",
  },
  description:
    "Organize your subjects, track assignments, and plan your study schedule — all in one place.",
  metadataBase: new URL("https://study-planner-saas.vercel.app"),
  openGraph: {
    title: "Study Planner – Plan Smarter, Study Better",
    description:
      "Organize your subjects, track assignments, and plan your study schedule.",
    siteName: "Study Planner",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
      </head>
      <body suppressHydrationWarning className="bg-slate-50 text-slate-900 transition-colors dark:bg-slate-900 dark:text-slate-50">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
