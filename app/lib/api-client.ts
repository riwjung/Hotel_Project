// Browser-side fetch wrapper for our route handlers.
// Throws ApiError whose message is the server's user-facing text, so callers can do:
//   message.error(err instanceof Error ? err.message : "Action failed")

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Query-string values; undefined/null/"" are dropped. */
  params?: Record<string, string | number | null | undefined>;
  signal?: AbortSignal;
};

export const SELECTED_BRANCH_STORAGE_KEY = "hotel:selected-branch";

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { method = "GET", body, params, signal } = options;

  let url = path;
  if (params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    if (qs.size) url += `?${qs}`;
  }

  let res: Response;
  try {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (typeof window !== "undefined") {
      const selectedBranchId = window.sessionStorage.getItem(SELECTED_BRANCH_STORAGE_KEY);
      if (selectedBranchId) headers["X-Hotel-Branch-Id"] = selectedBranchId;
    }
    res = await fetch(url, {
      method,
      signal,
      cache: "no-store",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError("Cannot reach the server. Check your connection.", 0, "NETWORK");
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = data?.error as { code?: string; message?: string } | undefined;
    if (res.status === 401 && typeof window !== "undefined" && path !== "/api/auth/login") {
      // Session expired mid-use — full reload to login (drops stale in-memory data), then return here.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
    throw new ApiError(error?.message ?? `Request failed (${res.status})`, res.status, error?.code ?? "HTTP");
  }

  return data as T;
}
