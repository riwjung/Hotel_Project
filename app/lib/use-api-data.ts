"use client";

import { useEffect, useEffectEvent, useState } from "react";

type State<T> = { key: string; data?: T; error: string | null };

/**
 * Loads data for a screen and re-loads when `key` changes or reload() is called.
 * Previous data stays visible while reloading (tables show their loading overlay
 * over the old rows instead of flashing empty).
 *
 * @param load  fetcher; receives an AbortSignal that fires on key change/unmount
 * @param key   serializable description of the request (e.g. JSON of filters)
 */
export function useApiData<T>(load: (signal: AbortSignal) => Promise<T>, key = "") {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<State<T> | null>(null);
  const requestKey = `${key}#${nonce}`;
  const runLoad = useEffectEvent((signal: AbortSignal) => load(signal));

  useEffect(() => {
    const controller = new AbortController();
    runLoad(controller.signal).then(
      (data) => setState({ key: requestKey, data, error: null }),
      (err: unknown) => {
        if (controller.signal.aborted) return;
        setState((prev) => ({
          key: requestKey,
          data: prev?.data,
          error: err instanceof Error ? err.message : "Could not load data",
        }));
      },
    );
    return () => controller.abort();
  }, [requestKey]);

  const loading = state?.key !== requestKey;
  return {
    data: state?.data,
    loading,
    error: loading ? null : (state?.error ?? null),
    reload: () => setNonce((n) => n + 1),
  };
}
