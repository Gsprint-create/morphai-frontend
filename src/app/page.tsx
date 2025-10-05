// src/app/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";           // NextAuth v5 helper
import AuthPanel from "@/components/AuthPanel";

export const metadata: Metadata = {
  title: "MorphAI",
  description: "Face Swap tool",
};

export default async function Page() {
  const session = await auth();

  if (!session) {
    // Not signed-in → show combined Register/Login panel
    return (
      <main className="container py-10">
        <div className="mx-auto max-w-md">
          <AuthPanel />
        </div>
      </main>
    );
  }

  // Signed-in → show the tool UI (your existing content goes here)
  return (
    <main className="container py-8">
      <div className="mx-auto max-w-3xl">
        {/* --- Tool Card --- */}
        <div className="card">
          <h1 className="text-xl font-semibold mb-4">Face Swap</h1>

          {/* Source image */}
          <div className="mb-4">
            <label className="block text-sm mb-1">Source image</label>
            <input id="src" type="file" accept="image/*" className="input" />
          </div>

          {/* Target image */}
          <div className="mb-4">
            <label className="block text-sm mb-1">Target image</label>
            <input id="tgt" type="file" accept="image/*" className="input" />
          </div>

          <div className="flex items-center gap-2">
            <button id="swapBtn" className="btn">Swap</button>
            <span id="status" className="text-sm opacity-80"></span>
          </div>
        </div>

        {/* Result */}
        <div className="card mt-6 hidden" id="resultCard">
          <h2 className="text-lg font-medium mb-3">Result</h2>
          <img id="resultImg" alt="Result" className="rounded-xl w-full h-auto" />
          <a id="downloadLink" className="btn mt-4 inline-block" download="swap.png">Download</a>
        </div>
      </div>

      {/* Simple client-side wiring for the demo; replace with your existing script if you have one */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            const el = (id)=>document.getElementById(id);
            const btn = el('swapBtn'), status = el('status');
            const resultCard = el('resultCard'), resultImg = el('resultImg'), dl = el('downloadLink');

            btn?.addEventListener('click', async () => {
              const src = (el('src') as HTMLInputElement)?.files?.[0];
              const tgt = (el('tgt') as HTMLInputElement)?.files?.[0];
              if (!src || !tgt) { status.textContent = 'Select both images'; return; }

              const fd = new FormData();
              fd.append('source', src);
              fd.append('target', tgt);

              status.textContent = 'Uploading...';
              try {
                const r = await fetch('/api/swap', { method: 'POST', body: fd });
                if (!r.ok) throw new Error('Swap failed');
                const blob = await r.blob();
                const url = URL.createObjectURL(blob);
                resultImg.src = url;
                dl.href = url;
                resultCard.classList.remove('hidden');
                status.textContent = 'Done';
              } catch(e) {
                console.error(e);
                status.textContent = 'Failed';
              }
            });
          `,
        }}
      />
    </main>
  );
}
