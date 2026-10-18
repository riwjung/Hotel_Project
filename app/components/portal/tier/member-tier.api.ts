import { api } from "@/app/lib/api-client";
import type { MemberTierInput, MemberTierRow } from "./types";

export function fetchMemberTierRows(signal?: AbortSignal) {
  return api<MemberTierRow[]>("/api/member-tiers", { signal });
}

export function createMemberTier(input: MemberTierInput) {
  return api<MemberTierRow>("/api/member-tiers", { method: "POST", body: input });
}

export function updateMemberTier(id: number, input: MemberTierInput) {
  return api<MemberTierRow>(`/api/member-tiers/${id}`, { method: "PATCH", body: input });
}

export function deleteMemberTier(id: number) {
  return api<{ ok: true }>(`/api/member-tiers/${id}`, { method: "DELETE" });
}
