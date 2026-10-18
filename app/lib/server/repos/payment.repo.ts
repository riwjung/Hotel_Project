import "server-only";
import { z } from "zod";
import { PAYMENT_METHODS } from "@/app/components/portal/booking/types";
import {
  PAYMENT_KINDS,
  PAYMENT_STATUSES,
  type PaymentFilter,
  type PaymentRow,
  type RefundInput,
} from "@/app/components/portal/payment/types";
import { HttpError } from "../http";
import { query, type Db } from "../db";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const paymentFilterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
  type: z.enum(PAYMENT_KINDS).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  q: z.string().trim().max(100).optional(),
});

export const paymentStatusSchema = z.object({ toStatus: z.enum(["PAID", "FAILED"]) });

export const refundSchema = z.object({
  amount: z.number().positive().multipleOf(0.01),
  paymentMethod: z.enum(PAYMENT_METHODS),
  transactionRef: z.string().trim().max(100).nullish().transform((v) => v || null),
}) satisfies z.ZodType<RefundInput>;

export function listPayments(scope: number | null, filter: PaymentFilter): Promise<PaymentRow[]> {
  return query<PaymentRow>(
    `SELECT p.payment_id AS "paymentId", p.booking_id AS "bookingId", b.booking_code AS "bookingCode",
       b.branch_id AS "branchId", br.branch_code AS "branchCode",
       c.first_name || ' ' || c.last_name AS "customerName",
       p.amount, p.payment_type AS "paymentType", p.payment_method AS "paymentMethod",
       p.payment_date AS "paymentDate", p.transaction_ref AS "transactionRef", p.payment_status AS "paymentStatus",
       e.first_name || ' ' || e.last_name AS "receivedByName"
     FROM payment p
     JOIN booking b   ON b.booking_id = p.booking_id
     JOIN branch br   ON br.branch_id = b.branch_id
     JOIN customer c  ON c.customer_id = b.customer_id
     LEFT JOIN employee e ON e.employee_id = p.received_by_emp_id
     WHERE ($1::int IS NULL OR b.branch_id = $1)
       AND ($2::varchar IS NULL OR p.payment_status = $2)
       AND ($3::varchar IS NULL OR p.payment_type = $3)
       AND ($4::date IS NULL OR p.payment_date >= $4::date)
       AND ($5::date IS NULL OR p.payment_date < $5::date + 1)
       AND ($6::varchar IS NULL OR b.booking_code ILIKE '%' || $6 || '%'
            OR (c.first_name || ' ' || c.last_name) ILIKE '%' || $6 || '%')
     ORDER BY p.payment_date DESC, p.payment_id DESC`,
    [
      scope ?? filter.branchId ?? null,
      filter.status ?? null,
      filter.type ?? null,
      filter.from ?? null,
      filter.to ?? null,
      filter.q?.trim() || null,
    ],
  );
}

/** PENDING → PAID | FAILED; R17 rejects other moves and a confirmation above the balance. */
export async function changePaymentStatus(db: Db, id: number, scope: number | null, toStatus: "PAID" | "FAILED") {
  const { rowCount } = await db.query(
    `UPDATE payment p SET payment_status = $3
     FROM booking b
     WHERE p.payment_id = $1 AND b.booking_id = p.booking_id AND ($2::int IS NULL OR b.branch_id = $2)`,
    [id, scope, toStatus],
  );
  if (!rowCount) throw new HttpError(404, "NOT_FOUND", "Payment not found");
}

/** A refund is a REFUND row on the booking; R17 caps it at the net amount paid. */
export async function createRefund(db: Db, bookingId: number, scope: number | null, employeeId: number, input: RefundInput) {
  const { rows } = await db.query(
    `SELECT 1 FROM booking WHERE booking_id = $1 AND ($2::int IS NULL OR branch_id = $2)`,
    [bookingId, scope],
  );
  if (!rows[0]) throw new HttpError(404, "NOT_FOUND", "Booking not found");
  await db.query(
    `INSERT INTO payment (booking_id, received_by_emp_id, amount, payment_type, payment_method, transaction_ref, payment_status)
     VALUES ($1, $2, $3, 'REFUND', $4, $5, 'REFUNDED')`,
    [bookingId, employeeId, input.amount, input.paymentMethod, input.transactionRef ?? null],
  );
}
