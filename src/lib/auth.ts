import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

import prisma from "./prisma";

const secret = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET || "fts-dev-secret-change-in-production",
  );

const COOKIE = "fts_session";

export type Session = {
  userId: string;
  email: string;
  plan: "FREE" | "PRO";
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    plan: user.plan,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      plan: payload.plan as "FREE" | "PRO",
    };
  } catch {
    return null;
  }
}
