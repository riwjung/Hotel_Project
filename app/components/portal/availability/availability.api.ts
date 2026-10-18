import { api } from "@/app/lib/api-client";
import type { GridFilter, GridRoom } from "./types";

export function fetchAvailabilityGrid(filter: GridFilter, signal?: AbortSignal) {
  return api<GridRoom[]>("/api/availability", { params: filter, signal });
}
