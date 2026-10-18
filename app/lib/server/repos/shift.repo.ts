import "server-only";
import { z } from "zod";
import type { Shift, ShiftInput } from "@/app/components/portal/shift/types";
import { HttpError } from "../http";
import { query, type Db } from "../db";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const shiftFilterSchema = z.object({ branchId: z.coerce.number().int().positive().optional() });

export const shiftInputSchema = z
  .object({
    branchId: z.number().int().positive().nullish(),
    shiftName: z.string().trim().min(1).max(50),
    startTime: z.string().regex(HHMM, "Use HH:mm"),
    endTime: z.string().regex(HHMM, "Use HH:mm"),
    isOvernight: z.boolean(),
  })
  .refine((v) => v.isOvernight || v.endTime > v.startTime, {
    message: "End time must be after start time unless the shift is overnight",
    path: ["endTime"],
  }) satisfies z.ZodType<ShiftInput>;

const SELECT_SHIFT = `
  SELECT s.shift_id AS "shiftId", s.branch_id AS "branchId", b.branch_code AS "branchCode", s.shift_name AS "shiftName",
    to_char(s.start_time, 'HH24:MI') AS "startTime", to_char(s.end_time, 'HH24:MI') AS "endTime",
    s.is_overnight AS "isOvernight",
    (SELECT count(*) FROM work_schedule ws WHERE ws.shift_id = s.shift_id) AS "scheduleCount"
  FROM shift s JOIN branch b ON b.branch_id = s.branch_id`;

export function listShifts(scope: number | null, branchId?: number): Promise<Shift[]> {
  return query<Shift>(
    `${SELECT_SHIFT} WHERE ($1::int IS NULL OR s.branch_id = $1) ORDER BY b.branch_code, s.start_time`,
    [scope ?? branchId ?? null],
  );
}

export async function getShift(db: Db, id: number, scope: number | null): Promise<Shift | null> {
  const { rows } = await db.query<Shift>(`${SELECT_SHIFT} WHERE s.shift_id = $1 AND ($2::int IS NULL OR s.branch_id = $2)`, [id, scope]);
  return rows[0] ?? null;
}

export async function createShift(db: Db, scope: number | null, input: ShiftInput): Promise<number> {
  const branchId = scope ?? input.branchId;
  if (!branchId) throw new HttpError(400, "VALIDATION", "Select a branch");
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO shift (branch_id, shift_name, start_time, end_time, is_overnight) VALUES ($1, $2, $3, $4, $5)
     RETURNING shift_id AS id`,
    [branchId, input.shiftName, input.startTime, input.endTime, input.isOvernight],
  );
  return rows[0].id;
}

/** New hours are re-checked against everyone already scheduled on the shift (R21). */
export async function updateShift(db: Db, id: number, scope: number | null, input: ShiftInput): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE shift SET shift_name = $3, start_time = $4, end_time = $5, is_overnight = $6
     WHERE shift_id = $1 AND ($2::int IS NULL OR branch_id = $2)`,
    [id, scope, input.shiftName, input.startTime, input.endTime, input.isOvernight],
  );
  return rowCount === 1;
}

/** A shift that has been scheduled is still referenced → 409 IN_USE. */
export async function deleteShift(db: Db, id: number, scope: number | null): Promise<boolean> {
  const { rowCount } = await db.query(`DELETE FROM shift WHERE shift_id = $1 AND ($2::int IS NULL OR branch_id = $2)`, [id, scope]);
  return rowCount === 1;
}
