// Weekly rota (work_schedule) — codes match ck_schedule_status. Overlaps are refused by R21.
import type { AttendanceStatus } from "../attendance/types";

export const SCHEDULE_STATUSES = ["SCHEDULED", "COMPLETED", "ABSENT", "CANCELLED"] as const;
export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];

export type ScheduleEntry = {
  scheduleId: number;
  employeeId: number;
  shiftId: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  workDate: string;
  scheduleStatus: ScheduleStatus;
  attendanceStatus: AttendanceStatus | null;
};

export type WeekSchedule = {
  from: string;
  to: string;
  employees: Array<{ employeeId: number; employeeCode: string; fullName: string; roleName: string }>;
  shifts: Array<{ shiftId: number; shiftName: string; startTime: string; endTime: string; isOvernight: boolean }>;
  schedules: ScheduleEntry[];
};

/** Body of POST /api/schedules */
export type ScheduleInput = { employeeId: number; shiftId: number; workDate: string };

/** Body of PATCH /api/schedules/:id — planners cancel, restore or mark a no-show */
export type ScheduleStatusInput = { scheduleStatus: "SCHEDULED" | "ABSENT" | "CANCELLED" };
