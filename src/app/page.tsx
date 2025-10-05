// src/app/page.tsx
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import AuthPanel from "@/components/AuthPanel";

export const metadata: Metadata = {
  title: "MorphAI",
  description: "Face Swap tool",
};

export default async function Page() {
  const session = await getServerSession(authOptions);

  // Not signed-in → show combined Register/Login panel
  if (!session) {
    return (
      <main className="container py-10">
        <div className="mx-auto max-w-md">
          <AuthPanel />
        </div>
      </main>
    );
  }

  // Signed-in → show the tool UI
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

          {/* Toggle row */}
          <div className="mb-4">
            <div id="toggleMount" />
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

      {/* Client-side wiring (kept simple) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            const el = (id)=>document.getElementById(id);
            const btn = el('swapBtn'), status = el('status');
            const resultCard = el('resultCard'), resultImg = el('resultImg'), dl = el('downloadLink');

            // Toggle state (persist)
            let enhance = localStorage.getItem('enhance') === 'true';

            // Mount a minimal toggle using the same styling
            (function mountToggle(){
              const root = document.getElementById('toggleMount');
              if (!root) return;
              root.innerHTML = \`
                <label class="flex items-start gap-3 select-none">
                  <button id="enhanceToggle" type="button" role="switch" aria-checked="\${enhance}" aria-label="Enhance result"
                    class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition \${enhance ? 'bg-blue-600':'bg-gray-400/60'}">
                    <span class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition \${enhance ? 'translate-x-5':'translate-x-0.5'} translate-x-0.5"></span>
                  </button>
                  <div class="leading-tight">
                    <div class="font-medium">Enhance result</div>
                    <div class="text-sm opacity-75">Slightly sharper & refined output</div>
                  </div>
                </label>\`;
              const t = document.getElementById('enhanceToggle');
              t?.addEventListener('click', () => {
                enhance = !enhance;
                localStorage.setItem('enhance', String(enhance));
                t.setAttribute('aria-checked', String(enhance));
                t.classList.toggle('bg-blue-600', enhance);
                t.classList.toggle('bg-gray-400/60', !enhance);
                const knob = t.querySelector('span');
                knob?.classList.toggle('translate-x-5', enhance);
                knob?.classList.toggle('translate-x-0.5', !enhance);
              });
            })();

            btn?.addEventListener('click', async () => {
              const src = (el('src'))?.files?.[0];
              const tgt = (el('tgt'))?.files?.[0];
              if (!src || !tgt) { status.textContent = 'Select both images'; return; }

              const fd = new FormData();
              fd.append('source', src);
              fd.append('target', tgt);
              fd.append('enhance', String(enhance)); // send toggle to backend

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
