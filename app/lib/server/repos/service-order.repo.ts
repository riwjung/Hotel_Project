import "server-only";
import { z } from "zod";
import {
  ORDER_STATUSES,
  type AssignInput,
  type OrderStatusInput,
  type ServiceOrder,
  type ServiceOrderFilter,
  type ServiceOrderInput,
} from "@/app/components/portal/service-order/types";
import type { SkillLevel } from "@/app/components/portal/skill/types";
import { HttpError } from "../http";
import { query, type Db } from "../db";

const timestamp = z.iso.datetime({ offset: true });

export const orderFilterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
});

export const orderInputSchema = z.object({
  bookingId: z.number().int().positive(),
  branchServiceId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(100),
  scheduledAt: timestamp.nullable(),
  remark: z.string().trim().max(255).nullish().transform((v) => v || null),
}) satisfies z.ZodType<ServiceOrderInput>;

export const orderStatusSchema = z.object({
  toStatus: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  scheduledAt: timestamp.nullish(),
}) satisfies z.ZodType<OrderStatusInput>;

export const assignSchema = z.object({
  employeeId: z.number().int().positive(),
  note: z.string().trim().max(255).nullish().transform((v) => v || null),
}) satisfies z.ZodType<AssignInput>;

const SELECT_ORDER = `
  SELECT bs.booking_service_id AS "bookingServiceId", b.booking_id AS "bookingId", b.booking_code AS "bookingCode",
    b.booking_status AS "bookingStatus", b.branch_id AS "branchId", br.branch_code AS "branchCode",
    c.first_name || ' ' || c.last_name AS "customerName",
    COALESCE((SELECT string_agg(r.room_number, ', ' ORDER BY r.room_number)
              FROM booking_room x JOIN room r ON r.room_id = x.room_id
              WHERE x.booking_id = b.booking_id), '') AS "roomNumbers",
    s.service_name AS "serviceName", s.need_assignment AS "needAssignment",
    bs.quantity, bs.unit_price AS "unitPrice", bs.subtotal,
    bs.requested_at AS "requestedAt", bs.scheduled_at AS "scheduledAt", bs.order_status AS "orderStatus", bs.remark,
    la.assignment_id AS "assignmentId", e.first_name || ' ' || e.last_name AS "assigneeName"
  FROM booking_service bs
  JOIN booking b          ON b.booking_id = bs.booking_id
  JOIN branch br          ON br.branch_id = b.branch_id
  JOIN customer c         ON c.customer_id = b.customer_id
  JOIN branch_service bsv ON bsv.branch_service_id = bs.branch_service_id
  JOIN service s          ON s.service_id = bsv.service_id
  -- R6: at most one live assignment per order line
  LEFT JOIN service_assignment la ON la.booking_service_id = bs.booking_service_id
                                 AND la.assignment_status IN ('ASSIGNED', 'IN_PROGRESS')
  LEFT JOIN employee e    ON e.employee_id = la.employee_id`;

export function listOrders(scope: number | null, filter: ServiceOrderFilter): Promise<ServiceOrder[]> {
  return query<ServiceOrder>(
    `${SELECT_ORDER}
     WHERE ($1::int IS NULL OR b.branch_id = $1)
       AND ($2::varchar IS NULL OR bs.order_status = $2)
       AND ($3::varchar IS NULL OR b.booking_code ILIKE '%' || $3 || '%' OR s.service_name ILIKE '%' || $3 || '%'
            OR (c.first_name || ' ' || c.last_name) ILIKE '%' || $3 || '%')
     ORDER BY CASE bs.order_status WHEN 'IN_PROGRESS' THEN 0 WHEN 'SCHEDULED' THEN 1 WHEN 'REQUESTED' THEN 2 ELSE 3 END,
       COALESCE(bs.scheduled_at, bs.requested_at) DESC`,
    [scope ?? filter.branchId ?? null, filter.status ?? null, filter.q?.trim() || null],
  );
}

export async function getOrder(db: Db, id: number, scope: number | null): Promise<ServiceOrder | null> {
  const { rows } = await db.query<ServiceOrder>(
    `${SELECT_ORDER} WHERE bs.booking_service_id = $1 AND ($2::int IS NULL OR b.branch_id = $2)`,
    [id, scope],
  );
  return rows[0] ?? null;
}

/** R4 checks the branch and availability, R19 the booking status; the unit price is snapshotted (085). */
export async function createOrder(db: Db, scope: number | null, input: ServiceOrderInput): Promise<number> {
  const { rows: found } = await db.query<{ status: string }>(
    `SELECT booking_status AS status FROM booking WHERE booking_id = $1 AND ($2::int IS NULL OR branch_id = $2)`,
    [input.bookingId, scope],
  );
  if (!found[0]) throw new HttpError(404, "NOT_FOUND", "Booking not found");
  if (found[0].status !== "CONFIRMED" && found[0].status !== "CHECKED_IN") {
    throw new HttpError(422, "INVALID_STATUS", "Services can be ordered for confirmed or in-house bookings only");
  }
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO booking_service (booking_id, branch_service_id, quantity, scheduled_at, order_status, remark)
     VALUES ($1, $2, $3, $4, CASE WHEN $4::timestamptz IS NULL THEN 'REQUESTED' ELSE 'SCHEDULED' END, $5)
     RETURNING booking_service_id AS id`,
    [input.bookingId, input.branchServiceId, input.quantity, input.scheduledAt, input.remark],
  );
  return rows[0].id;
}

/** The workflow, the assignee requirement and the assignment sync are R19. */
export async function changeOrderStatus(db: Db, id: number, scope: number | null, input: OrderStatusInput) {
  const { rowCount } = await db.query(
    `UPDATE booking_service bs SET order_status = $3, scheduled_at = COALESCE($4::timestamptz, bs.scheduled_at)
     FROM booking b
     WHERE bs.booking_service_id = $1 AND b.booking_id = bs.booking_id AND ($2::int IS NULL OR b.branch_id = $2)`,
    [id, scope, input.toStatus, input.scheduledAt ?? null],
  );
  if (!rowCount) throw new HttpError(404, "NOT_FOUND", "Service order not found");
}

/**
 * Assign or reassign. Append-only history: the live row becomes REASSIGNED and a
 * new row is inserted in the same transaction (R6 allows one live row). Skill (R5),
 * branch (R16) and an open order (R19) are checked by the database.
 */
export async function assignOrder(db: Db, id: number, scope: number | null, assignedBy: number, input: AssignInput) {
  const { rows } = await db.query<{ orderStatus: string }>(
    `SELECT bs.order_status AS "orderStatus"
     FROM booking_service bs JOIN booking b ON b.booking_id = bs.booking_id
     WHERE bs.booking_service_id = $1 AND ($2::int IS NULL OR b.branch_id = $2)
     FOR UPDATE OF bs`,
    [id, scope],
  );
  if (!rows[0]) throw new HttpError(404, "NOT_FOUND", "Service order not found");
  const { rows: live } = await db.query<{ employeeId: number }>(
    `SELECT employee_id AS "employeeId" FROM service_assignment
     WHERE booking_service_id = $1 AND assignment_status IN ('ASSIGNED', 'IN_PROGRESS') FOR UPDATE`,
    [id],
  );
  if (live[0]?.employeeId === input.employeeId) {
    throw new HttpError(422, "ALREADY_ASSIGNED", "This person already has the job");
  }
  await db.query(
    `UPDATE service_assignment SET assignment_status = 'REASSIGNED'
     WHERE booking_service_id = $1 AND assignment_status IN ('ASSIGNED', 'IN_PROGRESS')`,
    [id],
  );
  const started = rows[0].orderStatus === "IN_PROGRESS";
  await db.query(
    `INSERT INTO service_assignment (booking_service_id, employee_id, assigned_by_emp_id, note, assignment_status, started_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, input.employeeId, assignedBy, input.note, started ? "IN_PROGRESS" : "ASSIGNED", started ? new Date() : null],
  );
}

export type EligibleEmployee = {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  skillLevel: SkillLevel;
  openAssignments: number;
};

/** Skilled (R5), active staff of the booking's branch (R16) — best skill and lightest load first. */
export function listEligibleEmployees(id: number, scope: number | null): Promise<EligibleEmployee[]> {
  return query<EligibleEmployee>(
    `SELECT e.employee_id AS "employeeId", e.employee_code AS "employeeCode",
       e.first_name || ' ' || e.last_name AS "fullName", ess.skill_level AS "skillLevel",
       (SELECT count(*) FROM service_assignment x
        WHERE x.employee_id = e.employee_id AND x.assignment_status IN ('ASSIGNED', 'IN_PROGRESS')) AS "openAssignments"
     FROM booking_service bs
     JOIN booking b                  ON b.booking_id = bs.booking_id
     JOIN branch_service bsv         ON bsv.branch_service_id = bs.branch_service_id
     JOIN employee_service_skill ess ON ess.service_id = bsv.service_id
     JOIN employee e                 ON e.employee_id = ess.employee_id
     WHERE bs.booking_service_id = $1
       AND ($2::int IS NULL OR b.branch_id = $2)
       AND e.employee_status = 'ACTIVE'
       AND e.branch_id = b.branch_id
     ORDER BY CASE ess.skill_level WHEN 'EXPERT' THEN 0 WHEN 'SENIOR' THEN 1 ELSE 2 END, 5, e.first_name`,
    [id, scope],
  );
}
