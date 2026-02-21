import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "morphai_session";
const SECRET = process.env.JWT_SECRET;

export async function POST(req: Request) {
  try {
    if (!SECRET) {
      return NextResponse.json(
        { detail: "Server misconfigured: JWT_SECRET missing." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const email = (body?.email || "").toString().trim().toLowerCase();
    const password = (body?.password || "").toString();

    if (!email || !password) {
      return NextResponse.json({ detail: "Email and password are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ detail: "Password must be at least 6 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ detail: "Email already in use." }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hash },
      select: { id: true, email: true },
    });

    const token = jwt.sign({ sub: user.id, email: user.email }, SECRET, { expiresIn: "30d" });

    const res = NextResponse.json({ ok: true, user }, { status: 200 });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (e: any) {
    // Prisma unique error safety (even if race condition)
    const msg = e?.code === "P2002" ? "Email already in use." : "Signup failed (server error).";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
}