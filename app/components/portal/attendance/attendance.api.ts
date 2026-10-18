import { api } from "@/app/lib/api-client";
import type { AttendanceInput, AttendanceRow, ClockInput, MonthlyRow } from "./types";

export function fetchDay(branchId: number | undefined, date: string, signal?: AbortSignal) {
  return api<AttendanceRow[]>("/api/attendance", { params: { branchId, date }, signal });
}

export function fetchMine(signal?: AbortSignal) {
  return api<AttendanceRow[]>("/api/attendance/mine", { signal });
}

export function clock(input: ClockInput) {
  return api<{ ok: true }>("/api/attendance/clock", { method: "POST", body: input });
}

export function recordAttendance(scheduleId: number, input: AttendanceInput) {
  return api<{ ok: true }>(`/api/attendance/${scheduleId}`, { method: "PUT", body: input });
}

export function fetchMonthly(branchId: number | undefined, month: string, signal?: AbortSignal) {
  return api<MonthlyRow[]>("/api/attendance/monthly", { params: { branchId, month }, signal });
}
