import "server-only";
import { z } from "zod";
import type { ScheduleInput, ScheduleStatusInput, WeekSchedule } from "@/app/components/portal/schedule/types";
import { HttpError } from "../http";
import { query, type Db } from "../db";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const weekFilterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  from: isoDate,
});

export const scheduleInputSchema = z.object({
  employeeId: z.number().int().positive(),
  shiftId: z.number().int().positive(),
  workDate: isoDate,
}) satisfies z.ZodType<ScheduleInput>;

export const scheduleStatusSchema = z.object({
  scheduleStatus: z.enum(["SCHEDULED", "ABSENT", "CANCELLED"]),
}) satisfies z.ZodType<ScheduleStatusInput>;

/** One branch's week: active staff, its shifts and every schedule of the 7 days from `from`. */
export async function getWeek(scope: number | null, branchId: number | undefined, from: string): Promise<WeekSchedule> {
  const branch = scope ?? branchId;
  if (!branch) throw new HttpError(400, "VALIDATION", "Select a branch");
  const [employees, shifts, schedules, range] = await Promise.all([
    query<WeekSchedule["employees"][number]>(
      `SELECT e.employee_id AS "employeeId", e.employee_code AS "employeeCode",
         e.first_name || ' ' || e.last_name AS "fullName", r.role_name AS "roleName"
       FROM employee e JOIN role r ON r.role_id = e.role_id
       WHERE e.branch_id = $1 AND e.employee_status <> 'RESIGNED'
       ORDER BY r.role_id, e.first_name`,
      [branch],
    ),
    query<WeekSchedule["shifts"][number]>(
      `SELECT shift_id AS "shiftId", shift_name AS "shiftName", to_char(start_time, 'HH24:MI') AS "startTime",
         to_char(end_time, 'HH24:MI') AS "endTime", is_overnight AS "isOvernight"
       FROM shift WHERE branch_id = $1 ORDER BY start_time`,
      [branch],
    ),
    query<WeekSchedule["schedules"][number]>(
      `SELECT ws.schedule_id AS "scheduleId", ws.employee_id AS "employeeId", ws.shift_id AS "shiftId",
         s.shift_name AS "shiftName", to_char(s.start_time, 'HH24:MI') AS "startTime", to_char(s.end_time, 'HH24:MI') AS "endTime",
         ws.work_date AS "workDate", ws.schedule_status AS "scheduleStatus", a.attendance_status AS "attendanceStatus"
       FROM work_schedule ws
       JOIN shift s ON s.shift_id = ws.shift_id
       LEFT JOIN attendance a ON a.schedule_id = ws.schedule_id
       WHERE s.branch_id = $1 AND ws.work_date BETWEEN $2::date AND $2::date + 6
       ORDER BY ws.work_date, s.start_time`,
      [branch, from],
    ),
    query<{ from: string; to: string }>(`SELECT $1::date AS "from", ($1::date + 6) AS "to"`, [from]),
  ]);
  return { from: range[0].from, to: range[0].to, employees, shifts, schedules };
}

/** R16 (same branch as the shift) and R21 (no overlapping shifts) are checked by the database. */
export async function createSchedule(db: Db, scope: number | null, input: ScheduleInput): Promise<number> {
  const { rows: found } = await db.query(
    `SELECT 1 FROM shift WHERE shift_id = $1 AND ($2::int IS NULL OR branch_id = $2)`,
    [input.shiftId, scope],
  );
  if (!found[0]) throw new HttpError(404, "NOT_FOUND", "Shift not found");
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO work_schedule (employee_id, shift_id, work_date) VALUES ($1, $2, $3) RETURNING schedule_id AS id`,
    [input.employeeId, input.shiftId, input.workDate],
  );
  return rows[0].id;
}

/** Cancel, restore or mark a no-show. A shift with clock times recorded is corrected on the attendance page. */
export async function setScheduleStatus(db: Db, id: number, scope: number | null, input: ScheduleStatusInput) {
  const { rows } = await db.query<{ status: string; clocked: boolean }>(
    `SELECT ws.schedule_status AS status, EXISTS (SELECT 1 FROM attendance a WHERE a.schedule_id = ws.schedule_id AND a.clock_in IS NOT NULL) AS clocked
     FROM work_schedule ws JOIN shift s ON s.shift_id = ws.shift_id
     WHERE ws.schedule_id = $1 AND ($2::int IS NULL OR s.branch_id = $2)
     FOR UPDATE OF ws`,
    [id, scope],
  );
  if (!rows[0]) throw new HttpError(404, "NOT_FOUND", "Shift not found");
  if (rows[0].clocked) throw new HttpError(422, "CLOCKED", "This shift has clock times — correct it on the attendance page");
  if (rows[0].status === "COMPLETED") throw new HttpError(422, "COMPLETED", "A completed shift cannot change");
  await db.query(`UPDATE work_schedule SET schedule_status = $2 WHERE schedule_id = $1`, [id, input.scheduleStatus]);
}
