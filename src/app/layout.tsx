import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
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
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
