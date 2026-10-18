import { api } from "@/app/lib/api-client";
import type { BranchService, BranchServiceFilter, BranchServiceInput } from "./types";

export function fetchBranchServices(filter: BranchServiceFilter, signal?: AbortSignal) {
  return api<BranchService[]>("/api/branch-services", {
    params: { branchId: filter.branchId, available: filter.available === undefined ? undefined : String(filter.available) },
    signal,
  });
}

export function createBranchService(input: BranchServiceInput) {
  return api<BranchService>("/api/branch-services", { method: "POST", body: input });
}

export function updateBranchService(id: number, input: BranchServiceInput) {
  return api<BranchService>(`/api/branch-services/${id}`, { method: "PATCH", body: input });
}

export function deleteBranchService(id: number) {
  return api<{ ok: true }>(`/api/branch-services/${id}`, { method: "DELETE" });
}
