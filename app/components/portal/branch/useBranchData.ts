"use client";

import { useMemo, useState } from "react";
import { useApiData } from "@/app/lib/use-api-data";
import { fetchBranches } from "./branch.api";

/** Branch list + client-side search. */
export function useBranchData() {
  const { data, loading, error, reload } = useApiData(fetchBranches, "branches");
  const [search, setSearch] = useState("");

  const branches = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = data ?? [];
    if (!q) return all;
    return all.filter((b) =>
      [b.branchCode, b.branchName, b.province].some((v) => v.toLowerCase().includes(q)),
    );
  }, [data, search]);

  return { branches, total: data?.length ?? 0, loading, error, reload, search, setSearch };
}
