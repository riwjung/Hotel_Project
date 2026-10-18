import "server-only";
import { z } from "zod";
import {
  ASSIGNMENT_STATUSES,
  type Assignment,
  type AssignmentFilter,
  type QualityRow,
} from "@/app/components/portal/assignment/types";
import { HttpError } from "../http";
import { query, type Db } from "../db";

export const assignmentFilterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  status: z.enum(ASSIGNMENT_STATUSES).optional(),
  employeeId: z.coerce.number().int().positive().optional(),
});

export const qualitySchema = z.object({ qualityScore: z.number().int().min(1).max(5) });

export function listAssignments(scope: number | null, filter: AssignmentFilter): Promise<Assignment[]> {
  return query<Assignment>(
    `SELECT sa.assignment_id AS "assignmentId", sa.booking_service_id AS "bookingServiceId",
       b.booking_id AS "bookingId", b.booking_code AS "bookingCode", b.branch_id AS "branchId", br.branch_code AS "branchCode",
       s.service_name AS "serviceName", sa.employee_id AS "employeeId", e.first_name || ' ' || e.last_name AS "employeeName",
       ab.first_name || ' ' || ab.last_name AS "assignedByName",
       sa.assigned_at AS "assignedAt", sa.started_at AS "startedAt", sa.completed_at AS "completedAt",
       sa.quality_score AS "qualityScore", sa.assignment_status AS "assignmentStatus", sa.note
     FROM service_assignment sa
     JOIN booking_service bs ON bs.booking_service_id = sa.booking_service_id
     JOIN booking b          ON b.booking_id = bs.booking_id
     JOIN branch br          ON br.branch_id = b.branch_id
     JOIN branch_service bsv ON bsv.branch_service_id = bs.branch_service_id
     JOIN service s          ON s.service_id = bsv.service_id
     JOIN employee e         ON e.employee_id = sa.employee_id
     LEFT JOIN employee ab   ON ab.employee_id = sa.assigned_by_emp_id
     WHERE ($1::int IS NULL OR b.branch_id = $1)
       AND ($2::varchar IS NULL OR sa.assignment_status = $2)
       AND ($3::int IS NULL OR sa.employee_id = $3)
     ORDER BY sa.assigned_at DESC, sa.assignment_id DESC`,
    [scope ?? filter.branchId ?? null, filter.status ?? null, filter.employeeId ?? null],
  );
}

/** Quality per employee: completed jobs, open jobs and the average 1–5 score. */
export function qualitySummary(scope: number | null): Promise<QualityRow[]> {
  return query<QualityRow>(
    `SELECT e.employee_id AS "employeeId", e.first_name || ' ' || e.last_name AS "employeeName", ebr.branch_code AS "branchCode",
       count(*) FILTER (WHERE sa.assignment_status = 'COMPLETED') AS "completedCount",
       count(*) FILTER (WHERE sa.assignment_status IN ('ASSIGNED', 'IN_PROGRESS')) AS "openCount",
       count(sa.quality_score) AS "ratedCount",
       round(avg(sa.quality_score), 2) AS "averageScore"
     FROM service_assignment sa
     JOIN employee e         ON e.employee_id = sa.employee_id
     LEFT JOIN branch ebr    ON ebr.branch_id = e.branch_id
     JOIN booking_service bs ON bs.booking_service_id = sa.booking_service_id
     JOIN booking b          ON b.booking_id = bs.booking_id
     WHERE ($1::int IS NULL OR b.branch_id = $1)
     GROUP BY e.employee_id, ebr.branch_code
     ORDER BY "averageScore" DESC NULLS LAST, "completedCount" DESC`,
    [scope],
  );
}

/** Only finished work gets a score (the CHECK keeps it 1–5). */
export async function rateAssignment(db: Db, id: number, scope: number | null, score: number) {
  const { rows } = await db.query<{ status: string }>(
    `SELECT sa.assignment_status AS status
     FROM service_assignment sa
     JOIN booking_service bs ON bs.booking_service_id = sa.booking_service_id
     JOIN booking b ON b.booking_id = bs.booking_id
     WHERE sa.assignment_id = $1 AND ($2::int IS NULL OR b.branch_id = $2)
     FOR UPDATE OF sa`,
    [id, scope],
  );
  if (!rows[0]) throw new HttpError(404, "NOT_FOUND", "Assignment not found");
  if (rows[0].status !== "COMPLETED") throw new HttpError(422, "NOT_COMPLETED", "Only completed work can be scored");
  await db.query(`UPDATE service_assignment SET quality_score = $2 WHERE assignment_id = $1`, [id, score]);
}
