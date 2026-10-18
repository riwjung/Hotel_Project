import { api } from "@/app/lib/api-client";
import type { ScheduleInput, ScheduleStatusInput, WeekSchedule } from "./types";

export function fetchWeek(branchId: number | undefined, from: string, signal?: AbortSignal) {
  return api<WeekSchedule>("/api/schedules", { params: { branchId, from }, signal });
}

export function createSchedule(input: ScheduleInput) {
  return api<{ scheduleId: number }>("/api/schedules", { method: "POST", body: input });
}

export function setScheduleStatus(id: number, scheduleStatus: ScheduleStatusInput["scheduleStatus"]) {
  return api<{ ok: true }>(`/api/schedules/${id}`, { method: "PATCH", body: { scheduleStatus } });
}
