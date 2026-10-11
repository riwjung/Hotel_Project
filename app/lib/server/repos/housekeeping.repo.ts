import "server-only";
import { z } from "zod";
import {
  HOUSEKEEPING_STATUSES,
  type HousekeepingFilter,
  type HousekeepingTask,
} from "@/app/components/portal/housekeeping/types";
import { HttpError } from "../http";
import { query, type Db } from "../db";

export const housekeepingUpdateSchema = z.object({
  toStatus: z.enum(["IN_PROGRESS", "DONE", "VERIFIED"]),
});

export function listHousekeeping(scope: number | null, filter: HousekeepingFilter): Promise<HousekeepingTask[]> {
  const branchId = scope ?? filter.branchId ?? null;
  return query<HousekeepingTask>(
    `SELECT h.task_id AS "taskId", r.branch_id AS "branchId", b.branch_code AS "branchCode",
       r.room_id AS "roomId", r.room_number AS "roomNumber",
       h.assigned_emp_id AS "assignedEmpId", concat_ws(' ', a.first_name, a.last_name) AS "assignedEmployee",
       concat_ws(' ', v.first_name, v.last_name) AS "verifiedByName",
       h.task_type AS "taskType", h.task_date AS "taskDate", h.started_at AS "startedAt",
       h.completed_at AS "completedAt", h.task_status AS "taskStatus", h.remark
     FROM housekeeping_task h
     JOIN room r ON r.room_id = h.room_id
     JOIN branch b ON b.branch_id = r.branch_id
     JOIN employee a ON a.employee_id = h.assigned_emp_id
     LEFT JOIN employee v ON v.employee_id = h.verified_by_emp_id
     WHERE ($1::int IS NULL OR r.branch_id = $1)
       AND ($2::date IS NULL OR h.task_date = $2)
       AND ($3::varchar IS NULL OR h.task_status = $3)
     ORDER BY h.task_date DESC, b.branch_code, r.room_number`,
    [branchId, filter.date ?? null, filter.status ?? null],
  );
}

export async function updateHousekeepingStatus(
  db: Db,
  id: number,
  scope: number | null,
  employeeId: number,
  toStatus: "IN_PROGRESS" | "DONE" | "VERIFIED",
) {
  const { rows } = await db.query<{ taskStatus: string; assignedEmpId: number; roomId: number }>(
    `SELECT h.task_status AS "taskStatus", h.assigned_emp_id AS "assignedEmpId", h.room_id AS "roomId"
     FROM housekeeping_task h JOIN room r ON r.room_id = h.room_id
     WHERE h.task_id = $1 AND ($2::int IS NULL OR r.branch_id = $2) FOR UPDATE OF h, r`,
    [id, scope],
  );
  const task = rows[0];
  if (!task) throw new HttpError(404, "NOT_FOUND", "Housekeeping task not found");
  const expected = task.taskStatus === "PENDING" ? "IN_PROGRESS" : task.taskStatus === "IN_PROGRESS" ? "DONE" : task.taskStatus === "DONE" ? "VERIFIED" : null;
  if (toStatus !== expected) throw new HttpError(422, "INVALID_STATUS", "This housekeeping status transition is not allowed");

  if (toStatus === "IN_PROGRESS") {
    await db.query(`UPDATE housekeeping_task SET task_status = 'IN_PROGRESS', started_at = now() WHERE task_id = $1`, [id]);
  } else if (toStatus === "DONE") {
    await db.query(`UPDATE housekeeping_task SET task_status = 'DONE', completed_at = now() WHERE task_id = $1`, [id]);
  } else {
    if (task.assignedEmpId === employeeId) {
      throw new HttpError(422, "SAME_VERIFIER", "The employee who performed the task cannot verify it");
    }
    await db.query(
      `UPDATE housekeeping_task SET task_status = 'VERIFIED', verified_by_emp_id = $2 WHERE task_id = $1`,
      [id, employeeId],
    );
    await db.query(`UPDATE room SET room_status = 'AVAILABLE' WHERE room_id = $1`, [task.roomId]);
  }
}

export { HOUSEKEEPING_STATUSES };
