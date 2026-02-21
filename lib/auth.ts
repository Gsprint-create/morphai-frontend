import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "morphai_session";

export type SessionUser = { id: string; email: string; name?: string | null };

function getSecret() {
  // Use JWT_SECRET as your single source of truth (matches Vercel env var)
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Server misconfigured: JWT_SECRET missing.");
  }
  return secret;
}

export function signSession(user: SessionUser) {
  const secret = getSecret();
  return jwt.sign({ user }, secret, { expiresIn: "7d" });
}

export function verifySession(token: string): { user: SessionUser } | null {
  try {
    const secret = getSecret();
    return jwt.verify(token, secret) as any;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  const jar = cookies(); // ✅ NOT async in Next App Router
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie() {
  const jar = cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionUser(): SessionUser | null {
  const jar = cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySession(token);
  return payload?.user ?? null;
}