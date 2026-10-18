import { api } from "@/app/lib/api-client";
import type { GrantInput, RoleInput, RoleMatrix } from "./types";

export function fetchRoleMatrix(signal?: AbortSignal) {
  return api<RoleMatrix>("/api/roles", { signal });
}

export function createRole(input: RoleInput) {
  return api<{ roleId: number }>("/api/roles", { method: "POST", body: input });
}

export function updateRole(id: number, input: RoleInput) {
  return api<{ ok: true }>(`/api/roles/${id}`, { method: "PATCH", body: input });
}

export function deleteRole(id: number) {
  return api<{ ok: true }>(`/api/roles/${id}`, { method: "DELETE" });
}

export function setGrant(roleId: number, input: GrantInput) {
  return api<{ ok: true }>(`/api/roles/${roleId}/permissions`, { method: "PUT", body: input });
}
