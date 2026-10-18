import "server-only";
import { z } from "zod";
import {
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  type MaintenanceFilter,
  type MaintenanceInput,
  type MaintenanceRequest,
  type MaintenanceStatusInput,
} from "@/app/components/portal/maintenance/types";
import { HttpError } from "../http";
import { query, type Db } from "../db";

export const maintenanceFilterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  status: z.enum(MAINTENANCE_STATUSES).optional(),
  priority: z.enum(MAINTENANCE_PRIORITIES).optional(),
});

export const maintenanceInputSchema = z.object({
  branchId: z.number().int().positive().nullish(),
  roomId: z.number().int().positive().nullable(),
  issueTitle: z.string().trim().min(1).max(100),
  priority: z.enum(MAINTENANCE_PRIORITIES),
  assignedToEmpId: z.number().int().positive().nullable(),
}) satisfies z.ZodType<MaintenanceInput>;

export const maintenanceStatusSchema = z.object({
  toStatus: z.enum(["IN_PROGRESS", "RESOLVED", "CANCELLED"]),
  cost: z.number().min(0).multipleOf(0.01).nullish(),
}) satisfies z.ZodType<MaintenanceStatusInput>;

const SELECT_REQUEST = `
  SELECT m.maintenance_id AS "maintenanceId", m.branch_id AS "branchId", b.branch_code AS "branchCode",
    m.room_id AS "roomId", r.room_number AS "roomNumber", r.room_status AS "roomStatus",
    m.reported_by_emp_id AS "reportedByEmpId", rep.first_name || ' ' || rep.last_name AS "reportedByName",
    m.assigned_to_emp_id AS "assignedToEmpId", asg.first_name || ' ' || asg.last_name AS "assignedToName",
    m.issue_title AS "issueTitle", m.priority, m.report_date AS "reportDate", m.done_date AS "doneDate",
    m.cost, m.maintenance_status AS "maintenanceStatus"
  FROM maintenance_request m
  JOIN branch b       ON b.branch_id = m.branch_id
  JOIN employee rep   ON rep.employee_id = m.reported_by_emp_id
  LEFT JOIN employee asg ON asg.employee_id = m.assigned_to_emp_id
  LEFT JOIN room r    ON r.room_id = m.room_id`;

export function listMaintenance(scope: number | null, filter: MaintenanceFilter): Promise<MaintenanceRequest[]> {
  return query<MaintenanceRequest>(
    `${SELECT_REQUEST}
     WHERE ($1::int IS NULL OR m.branch_id = $1)
       AND ($2::varchar IS NULL OR m.maintenance_status = $2)
       AND ($3::varchar IS NULL OR m.priority = $3)
     ORDER BY CASE m.maintenance_status WHEN 'OPEN' THEN 0 WHEN 'IN_PROGRESS' THEN 1 ELSE 2 END,
       CASE m.priority WHEN 'URGENT' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END,
       m.report_date DESC`,
    [scope ?? filter.branchId ?? null, filter.status ?? null, filter.priority ?? null],
  );
}

export async function getMaintenance(db: Db, id: number, scope: number | null): Promise<MaintenanceRequest | null> {
  const { rows } = await db.query<MaintenanceRequest>(
    `${SELECT_REQUEST} WHERE m.maintenance_id = $1 AND ($2::int IS NULL OR m.branch_id = $2)`,
    [id, scope],
  );
  return rows[0] ?? null;
}

/**
 * The reporter is the signed-in employee. Room-in-branch and the workflow are R15,
 * the technician's branch is R16; opening a request on a free room flips it to MAINTENANCE.
 */
export async function createMaintenance(
  db: Db,
  scope: number | null,
  employeeId: number,
  input: MaintenanceInput,
): Promise<number> {
  const branchId = scope ?? input.branchId;
  if (!branchId) throw new HttpError(400, "VALIDATION", "Select a branch");
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO maintenance_request (branch_id, room_id, reported_by_emp_id, assigned_to_emp_id, issue_title, priority)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING maintenance_id AS id`,
    [branchId, input.roomId, employeeId, input.assignedToEmpId, input.issueTitle, input.priority],
  );
  return rows[0].id;
}

export async function updateMaintenance(db: Db, id: number, scope: number | null, input: MaintenanceInput) {
  const { rows } = await db.query<{ status: string }>(
    `SELECT maintenance_status AS status FROM maintenance_request
     WHERE maintenance_id = $1 AND ($2::int IS NULL OR branch_id = $2) FOR UPDATE`,
    [id, scope],
  );
  if (!rows[0]) throw new HttpError(404, "NOT_FOUND", "Maintenance request not found");
  if (rows[0].status === "RESOLVED" || rows[0].status === "CANCELLED") {
    throw new HttpError(422, "CLOSED", "A closed request cannot be edited");
  }
  await db.query(
    `UPDATE maintenance_request SET room_id = $2, issue_title = $3, priority = $4, assigned_to_emp_id = $5
     WHERE maintenance_id = $1`,
    [id, input.roomId, input.issueTitle, input.priority, input.assignedToEmpId],
  );
}

export async function changeMaintenanceStatus(
  db: Db,
  id: number,
  scope: number | null,
  input: MaintenanceStatusInput,
) {
  const { rowCount } = await db.query(
    `UPDATE maintenance_request
     SET maintenance_status = $3::varchar,
         cost = CASE WHEN $3::varchar = 'RESOLVED' THEN COALESCE($4, cost) ELSE cost END
     WHERE maintenance_id = $1 AND ($2::int IS NULL OR branch_id = $2)`,
    [id, scope, input.toStatus, input.cost ?? null],
  );
  if (!rowCount) throw new HttpError(404, "NOT_FOUND", "Maintenance request not found");
}
