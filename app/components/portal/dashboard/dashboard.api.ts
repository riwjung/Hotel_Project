import { api } from "@/app/lib/api-client";
import type { DashboardData } from "./types";

export function fetchDashboard(signal?: AbortSignal) {
  return api<DashboardData>("/api/dashboard", { signal });
}
