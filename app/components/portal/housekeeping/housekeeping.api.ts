import { api } from "@/app/lib/api-client";
import type { HousekeepingFilter, HousekeepingStatus, HousekeepingTask } from "./types";

export function fetchHousekeeping(filter: HousekeepingFilter, signal?: AbortSignal) {
  return api<HousekeepingTask[]>("/api/housekeeping", { params: filter, signal });
}

export function updateHousekeepingStatus(
  id: number,
  toStatus: Extract<HousekeepingStatus, "IN_PROGRESS" | "DONE" | "VERIFIED">,
) {
  return api<{ ok: true }>(`/api/housekeeping/${id}`, { method: "PATCH", body: { toStatus } });
}
