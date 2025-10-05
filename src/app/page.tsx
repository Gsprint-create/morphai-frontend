import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ClientOnly from "@/components/ClientOnly";
import AuthPanel from "@/components/AuthPanel"; // your combined login/register (client)
import ToolShell from "@/components/ToolShell"; // from step 2

export const metadata: Metadata = {
  title: "MorphAI",
  description: "Face Swap tool",
};

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <main className="container py-10">
        <div className="mx-auto max-w-md">
          <ClientOnly>
            <AuthPanel />
          </ClientOnly>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-8">
      <ClientOnly>
        <ToolShell />
      </ClientOnly>
    </main>
  );
}
