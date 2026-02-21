import * as jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "morphai_session";

export type SessionUser = { id: string; email: string; name?: string | null };

export function signSession(user: SessionUser) {
  const secret = process.env.AUTH_SECRET!;
  return jwt.sign({ user }, secret, { expiresIn: "7d" });
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}