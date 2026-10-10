import "server-only";
import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@/app/lib/permissions";

// Kept free of DB/next-headers imports so proxy.ts can use it cheaply.

export const SESSION_COOKIE = "hotel_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters (see .env.example)");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.employeeId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify<{ user: SessionUser }>(token, secretKey(), {
      algorithms: ["HS256"],
    });
    return payload.user ?? null;
  } catch {
    return null;
  }
}
