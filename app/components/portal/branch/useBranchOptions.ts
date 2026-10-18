"use client";

import { useSession } from "@/app/lib/auth-client";
import { useApiData } from "@/app/lib/use-api-data";
import { fetchBranches } from "./branch.api";

/**
 * Branch choices for chain-wide users (owner). Branch-scoped users get
 * chainWide=false and no options: the API pins them to their own branch.
 */
export function useBranchOptions({ activeOnly = false }: { activeOnly?: boolean } = {}) {
  const { user, can } = useSession();
  const chainWide = user?.scopeLevel === "CHAIN" && can("BRANCH_VIEW");
  const branches = useApiData(
    (signal) => (chainWide ? fetchBranches(signal) : Promise.resolve([])),
    `branch-options:${chainWide}`,
  );
  const options = (branches.data ?? [])
    .filter((b) => !activeOnly || b.branchStatus === "ACTIVE")
    .map((b) => ({ value: b.branchId, label: `${b.branchCode} · ${b.branchName}` }));
  return { chainWide, loading: branches.loading, options };
}
