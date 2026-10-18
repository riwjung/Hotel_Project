import { api } from "@/app/lib/api-client";
import type { Shift, ShiftInput } from "./types";

export function fetchShifts(branchId: number | undefined, signal?: AbortSignal) {
  return api<Shift[]>("/api/shifts", { params: { branchId }, signal });
}

export function createShift(input: ShiftInput) {
  return api<Shift>("/api/shifts", { method: "POST", body: input });
}

export function updateShift(id: number, input: ShiftInput) {
  return api<Shift>(`/api/shifts/${id}`, { method: "PATCH", body: input });
}

export function deleteShift(id: number) {
  return api<{ ok: true }>(`/api/shifts/${id}`, { method: "DELETE" });
}
