"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api-client";
import { hasPermission, type PermissionCode, type SessionUser } from "./permissions";

// The one place the UI asks "who is this and what may they do?".
// Never check roleCode in components — check permissions via can().

type SessionState = {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  can: (code: PermissionCode) => boolean;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    api<SessionUser>("/api/auth/me", { signal: controller.signal })
      .then(setUser)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load your session");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const can = useCallback((code: PermissionCode) => hasPermission(user, code), [user]);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    // Full reload: Next keeps visited routes mounted (Activity), so a soft
    // navigation could leave the previous user's data in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }, []);

  const value = useMemo(() => ({ user, loading, error, can, logout }), [user, loading, error, can, logout]);
  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
