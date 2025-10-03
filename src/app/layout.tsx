import "./globals.css";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import TopBar from "@/components/TopBar";
import RegisterSW from "@/components/RegisterSW"; // (we’ll add this)

export const metadata: Metadata = {
  title: "MorphAI",
  description: "Face swap tool",
  themeColor: "#2563eb",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/icon-192.png" }]
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const email = session?.user?.email ?? null;

  return (
    <html lang="en">
      <body>
        <RegisterSW /> {/* listens for SW updates and prompts user */}
        <TopBar email={email} />
        <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
