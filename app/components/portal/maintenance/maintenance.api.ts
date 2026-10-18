import { api } from "@/app/lib/api-client";
import type { MaintenanceFilter, MaintenanceInput, MaintenanceRequest, MaintenanceStatusInput } from "./types";

export function fetchMaintenance(filter: MaintenanceFilter, signal?: AbortSignal) {
  return api<MaintenanceRequest[]>("/api/maintenance", { params: filter, signal });
}

export function createMaintenance(input: MaintenanceInput) {
  return api<MaintenanceRequest>("/api/maintenance", { method: "POST", body: input });
}

export function updateMaintenance(id: number, input: MaintenanceInput) {
  return api<MaintenanceRequest>(`/api/maintenance/${id}`, { method: "PATCH", body: input });
}

export function changeMaintenanceStatus(id: number, input: MaintenanceStatusInput) {
  return api<{ ok: true }>(`/api/maintenance/${id}/status`, { method: "POST", body: input });
}
