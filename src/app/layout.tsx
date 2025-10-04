// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import TopBar from "@/components/TopBar";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "MorphAI",
  description: "Face Swap tool",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="min-h-screen">
        <TopBar email={session?.user?.email ?? null} /> {/* ✅ only email */}
        <main className="container py-8">{children}</main>
      </body>
    </html>
  );
}
