import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

function accessHeaders(): HeadersInit {
  const h: Record<string,string> = {};
  const id = process.env.CF_ACCESS_CLIENT_ID;
  const secret = process.env.CF_ACCESS_CLIENT_SECRET;
  if (id) h["CF-Access-Client-Id"] = id;
  if (secret) h["CF-Access-Client-Secret"] = secret;
  return h;
}

export async function POST(req: NextRequest) {
  const base = (process.env.MODAL_URL || "").replace(/\/+$/, "");
  if (!base) return NextResponse.json({ error: "MODAL_URL missing" }, { status: 500 });

  try {
    const form = await req.formData();
    const resp = await fetch(`${base}/swap`, { method: "POST", headers: accessHeaders(), body: form });

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ error: `Backend ${resp.status}`, body: txt.slice(0, 600) }, { status: resp.status });
    }
    const buf = await resp.arrayBuffer();
    return new NextResponse(buf, { headers: { "Content-Type": "image/png" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
