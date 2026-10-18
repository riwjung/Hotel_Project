// Attendance — codes match ck_attendance_status. The status is derived from the clock times (R22).
import type { ScheduleStatus } from "../schedule/types";

export const ATTENDANCE_STATUSES = ["ON_TIME", "LATE", "EARLY_LEAVE", "ABSENT"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

/** One scheduled shift of a day with its attendance (if any). */
export type AttendanceRow = {
  scheduleId: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  branchCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  workDate: string;
  scheduleStatus: ScheduleStatus;
  clockIn: string | null;
  clockOut: string | null;
  attendanceStatus: AttendanceStatus | null;
  remark: string | null;
};

export type ClockInput = { scheduleId: number; action: "in" | "out" };

/** Body of PUT /api/attendance/:scheduleId — a manager's correction; clockIn null = absent */
export type AttendanceInput = { clockIn: string | null; clockOut: string | null; remark: string | null };

/** v_attendance_monthly */
export type MonthlyRow = {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  scheduledShifts: number;
  onTime: number;
  late: number;
  earlyLeave: number;
  absent: number;
  lateMinutes: number;
};
