import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const COOKIE_NAME = "morphai_session";

export type SessionUser = { id: string; email: string; name?: string | null };

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Server misconfigured: JWT_SECRET missing.");
  return secret;
}

export function signSession(user: SessionUser) {
  return jwt.sign({ user }, getSecret(), { expiresIn: "7d" });
}

export function verifySession(token: string): { user: SessionUser } | null {
  try {
    return jwt.verify(token, getSecret()) as any;
  } catch {
    return null;
  }
}

// ✅ READ cookie (your Next version types cookies() as Promise)
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token)?.user ?? null;
}

// ✅ SET cookie on NextResponse
export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

// ✅ CLEAR cookie on NextResponse
export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}