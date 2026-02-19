import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Planner SaaS",
  description: "Plan smarter. Study better.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
