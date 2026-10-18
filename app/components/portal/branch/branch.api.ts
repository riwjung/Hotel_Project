import { api } from "@/app/lib/api-client";
import type { Branch, BranchInput } from "./types";

export function fetchBranches(signal?: AbortSignal) {
  return api<Branch[]>("/api/branches", { signal });
}

export function fetchBranchOptions(signal?: AbortSignal) {
  return api<Branch[]>("/api/branches/options", { signal });
}

export function fetchBranch(id: number, signal?: AbortSignal) {
  return api<Branch>(`/api/branches/${id}`, { signal });
}

export function createBranch(input: BranchInput) {
  return api<Branch>("/api/branches", { method: "POST", body: input });
}

export function updateBranch(id: number, input: BranchInput) {
  return api<Branch>(`/api/branches/${id}`, { method: "PATCH", body: input });
}

export function deleteBranch(id: number) {
  return api<{ ok: true }>(`/api/branches/${id}`, { method: "DELETE" });
}
