import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "morphai_session";

export type SessionUser = { id: string; email: string; name?: string | null };

export function signSession(user: SessionUser) {
  const secret = process.env.AUTH_SECRET!;
  return jwt.sign({ user }, secret, { expiresIn: "7d" });
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export function getSessionUser(): SessionUser | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const secret = process.env.AUTH_SECRET!;
    const payload = jwt.verify(token, secret) as any;
    return payload?.user ?? null;
  } catch {
    return null;
  }
}