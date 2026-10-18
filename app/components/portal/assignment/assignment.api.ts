import { api } from "@/app/lib/api-client";
import type { Assignment, AssignmentFilter, QualityRow } from "./types";

export function fetchAssignments(filter: AssignmentFilter, signal?: AbortSignal) {
  return api<Assignment[]>("/api/assignments", { params: filter, signal });
}

export function fetchQuality(signal?: AbortSignal) {
  return api<QualityRow[]>("/api/assignments/quality", { signal });
}

export function rateAssignment(id: number, qualityScore: number) {
  return api<{ ok: true }>(`/api/assignments/${id}`, { method: "PATCH", body: { qualityScore } });
}
