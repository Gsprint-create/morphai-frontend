import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signSession, setSessionCookie } from "@/lib/auth";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ detail: "Invalid login data." }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ detail: "Invalid credentials." }, { status: 401 });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return NextResponse.json({ detail: "Invalid credentials." }, { status: 401 });

  const safeUser = { id: user.id, email: user.email, name: user.name };
  const token = signSession(safeUser);
  await setSessionCookie(token);

  return NextResponse.json({ ok: true, user: safeUser });
}