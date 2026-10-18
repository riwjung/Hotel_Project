import "server-only";
import { cookies } from "next/headers";
import type { ScopeLevel, SessionUser } from "@/app/lib/permissions";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSessionToken,
  verifySessionToken,
} from "./session-token";

export type Session = SessionUser & { signedScopeLevel?: ScopeLevel };

export const SELECTED_BRANCH_HEADER = "x-hotel-branch-id";

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

export async function startSession(user: SessionUser): Promise<void> {
  const token = await signSessionToken(user);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * Branch the session is limited to: `null` = whole chain (owner),
 * a number = only that branch. Every repo that reads branch data takes this.
 */
export function branchScope(session: Session): number | null {
  return session.scopeLevel === "CHAIN" ? null : session.branchId;
}

/**
 * A chain-level employee may temporarily work inside one branch from the
 * header switcher. The original signed session is never changed; only this
 * request receives an effective branch scope. Branch users cannot override
 * their assigned branch with the header.
 */
export function withSelectedBranch(session: Session, headerValue: string | null): Session {
  if (session.scopeLevel !== "CHAIN" || !headerValue) return session;
  const branchId = Number(headerValue);
  if (!Number.isInteger(branchId) || branchId <= 0) return session;
  return { ...session, signedScopeLevel: "CHAIN", scopeLevel: "BRANCH", branchId };
}
