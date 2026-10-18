import "server-only";
import { z } from "zod";
import type { AttendanceInput, AttendanceRow, ClockInput, MonthlyRow } from "@/app/components/portal/attendance/types";
import type { Session } from "../auth";
import { HttpError } from "../http";
import { query, type Db } from "../db";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const timestamp = z.iso.datetime({ offset: true });

export const dayFilterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  date: isoDate,
});

export const monthFilterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Use YYYY-MM"),
});

export const clockSchema = z.object({
  scheduleId: z.number().int().positive(),
  action: z.enum(["in", "out"]),
}) satisfies z.ZodType<ClockInput>;

export const attendanceInputSchema = z
  .object({
    clockIn: timestamp.nullable(),
    clockOut: timestamp.nullable(),
    remark: z.string().trim().max(255).nullish().transform((v) => v || null),
  })
  .refine((v) => !v.clockOut || v.clockIn, { message: "Clock in before clocking out", path: ["clockOut"] }) satisfies z.ZodType<AttendanceInput>;

const SELECT_ROW = `
  SELECT ws.schedule_id AS "scheduleId", e.employee_id AS "employeeId", e.employee_code AS "employeeCode",
    e.first_name || ' ' || e.last_name AS "employeeName", b.branch_code AS "branchCode",
    s.shift_name AS "shiftName", to_char(s.start_time, 'HH24:MI') AS "startTime", to_char(s.end_time, 'HH24:MI') AS "endTime",
    ws.work_date AS "workDate", ws.schedule_status AS "scheduleStatus",
    a.clock_in AS "clockIn", a.clock_out AS "clockOut", a.attendance_status AS "attendanceStatus", a.remark
  FROM work_schedule ws
  JOIN employee e ON e.employee_id = ws.employee_id
  JOIN shift s    ON s.shift_id = ws.shift_id
  JOIN branch b   ON b.branch_id = s.branch_id
  LEFT JOIN attendance a ON a.schedule_id = ws.schedule_id`;

/** Every non-cancelled shift of one day, with its attendance. */
export function listDay(scope: number | null, branchId: number | undefined, date: string): Promise<AttendanceRow[]> {
  return query<AttendanceRow>(
    `${SELECT_ROW}
     WHERE ws.work_date = $2::date AND ws.schedule_status <> 'CANCELLED'
       AND ($1::int IS NULL OR s.branch_id = $1)
     ORDER BY b.branch_code, s.start_time, e.first_name`,
    [scope ?? branchId ?? null, date],
  );
}

/** The signed-in employee's own shifts from yesterday (overnight) to tomorrow. */
export function listMine(employeeId: number): Promise<AttendanceRow[]> {
  return query<AttendanceRow>(
    `${SELECT_ROW}
     WHERE ws.employee_id = $1 AND ws.schedule_status <> 'CANCELLED'
       AND ws.work_date BETWEEN current_date - 1 AND current_date + 1
     ORDER BY ws.work_date, s.start_time`,
    [employeeId],
  );
}

/**
 * Clock in / out now. Anyone may clock their own shift; clocking someone else's
 * needs ATTENDANCE_MANAGE inside the branch scope. R22 derives the status.
 */
export async function clock(db: Db, session: Session, scope: number | null, input: ClockInput) {
  const { rows } = await db.query<{ employeeId: number; branchId: number }>(
    `SELECT ws.employee_id AS "employeeId", s.branch_id AS "branchId"
     FROM work_schedule ws JOIN shift s ON s.shift_id = ws.shift_id
     WHERE ws.schedule_id = $1 FOR UPDATE OF ws`,
    [input.scheduleId],
  );
  const shift = rows[0];
  const own = shift?.employeeId === session.employeeId;
  const canManage = session.permissions.includes("ATTENDANCE_MANAGE") && (scope === null || shift?.branchId === scope);
  if (!shift || (!own && !canManage)) throw new HttpError(404, "NOT_FOUND", "Shift not found");

  if (input.action === "in") {
    const { rowCount } = await db.query(
      `INSERT INTO attendance (schedule_id, clock_in, attendance_status) VALUES ($1, now(), 'ON_TIME')
       ON CONFLICT (schedule_id) DO NOTHING`,
      [input.scheduleId],
    );
    if (!rowCount) throw new HttpError(422, "ALREADY_IN", "Already clocked in for this shift");
  } else {
    const { rowCount } = await db.query(
      `UPDATE attendance SET clock_out = now() WHERE schedule_id = $1 AND clock_in IS NOT NULL AND clock_out IS NULL`,
      [input.scheduleId],
    );
    if (!rowCount) throw new HttpError(422, "NOT_IN", "Clock in first (or the shift is already clocked out)");
  }
}

/** A manager's correction: set the clock times (none = absent); R22 recomputes the status. */
export async function recordAttendance(db: Db, scope: number | null, scheduleId: number, input: AttendanceInput) {
  const { rows } = await db.query(
    `SELECT 1 FROM work_schedule ws JOIN shift s ON s.shift_id = ws.shift_id
     WHERE ws.schedule_id = $1 AND ($2::int IS NULL OR s.branch_id = $2)`,
    [scheduleId, scope],
  );
  if (!rows[0]) throw new HttpError(404, "NOT_FOUND", "Shift not found");
  await db.query(
    `INSERT INTO attendance (schedule_id, clock_in, clock_out, attendance_status, remark)
     VALUES ($1, $2, $3, 'ON_TIME', $4)
     ON CONFLICT (schedule_id) DO UPDATE SET clock_in = EXCLUDED.clock_in, clock_out = EXCLUDED.clock_out, remark = EXCLUDED.remark`,
    [scheduleId, input.clockIn, input.clockOut, input.remark],
  );
}

/** The monthly report from v_attendance_monthly. */
export function monthlyReport(scope: number | null, branchId: number | undefined, month: string): Promise<MonthlyRow[]> {
  return query<MonthlyRow>(
    `SELECT employee_id AS "employeeId", employee_code AS "employeeCode", employee_name AS "employeeName",
       scheduled_shifts AS "scheduledShifts", on_time AS "onTime", late, early_leave AS "earlyLeave",
       absent, late_minutes AS "lateMinutes"
     FROM v_attendance_monthly
     WHERE month = ($2 || '-01')::date AND ($1::int IS NULL OR branch_id = $1)
     ORDER BY absent DESC, late DESC, employee_name`,
    [scope ?? branchId ?? null, month],
  );
}
