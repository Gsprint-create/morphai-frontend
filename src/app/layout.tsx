// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import TopBar from "@/components/TopBar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ThemeProvider from "@/components/ThemeProvider";
export const metadata: Metadata = {
  title: "MorphAI",
  description: "Face Swap tool",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="min-h-screen">
        <TopBar email={session?.user?.email ?? null} />
        <main className="container py-8">{children}</main>
      </body>
    </html>
  );
}
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // const session = await getServerSession(authOptions); // your current code

  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black dark:bg-[#0b0b0e] dark:text-white">
        <ThemeProvider>
          {/* Top bar & page content */}
          {/* <TopBar email={session?.user?.email ?? null} /> */}
          <main className="container py-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}