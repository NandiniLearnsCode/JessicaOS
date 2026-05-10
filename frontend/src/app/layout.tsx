import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JessicaOS",
  description: "AI-powered legal platform with multi-step agent capabilities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
