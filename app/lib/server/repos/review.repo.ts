import "server-only";
import { z } from "zod";
import {
  REVIEW_STATUSES,
  type Review,
  type ReviewableBooking,
  type ReviewFilter,
  type ReviewInput,
  type ReviewSummaryRow,
} from "@/app/components/portal/review/types";
import { HttpError } from "../http";
import { query, type Db } from "../db";

const rating = z.number().int().min(1).max(5);

export const reviewFilterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  status: z.enum(REVIEW_STATUSES).optional(),
});

export const reviewInputSchema = z.object({
  bookingId: z.number().int().positive(),
  roomRating: rating,
  serviceRating: rating,
  staffRating: rating,
  comment: z.string().trim().max(500).nullish().transform((v) => v || null),
}) satisfies z.ZodType<ReviewInput>;

export const reviewStatusSchema = z.object({ toStatus: z.enum(["PUBLISHED", "HIDDEN"]) });

// review has no branch_id or customer_id (3NF): both come through booking.
export function listReviews(scope: number | null, filter: ReviewFilter): Promise<Review[]> {
  return query<Review>(
    `SELECT r.review_id AS "reviewId", r.booking_id AS "bookingId", b.booking_code AS "bookingCode",
       b.branch_id AS "branchId", br.branch_code AS "branchCode",
       c.first_name || ' ' || c.last_name AS "customerName",
       r.room_rating AS "roomRating", r.service_rating AS "serviceRating", r.staff_rating AS "staffRating",
       round((r.room_rating + r.service_rating + r.staff_rating) / 3.0, 1) AS "averageRating",
       r.comment, r.review_date AS "reviewDate", r.review_status AS "reviewStatus",
       e.first_name || ' ' || e.last_name AS "handledByName"
     FROM review r
     JOIN booking b  ON b.booking_id = r.booking_id
     JOIN branch br  ON br.branch_id = b.branch_id
     JOIN customer c ON c.customer_id = b.customer_id
     LEFT JOIN employee e ON e.employee_id = r.reply_by_emp_id
     WHERE ($1::int IS NULL OR b.branch_id = $1)
       AND ($2::varchar IS NULL OR r.review_status = $2)
     ORDER BY CASE r.review_status WHEN 'PENDING' THEN 0 ELSE 1 END, r.review_date DESC`,
    [scope ?? filter.branchId ?? null, filter.status ?? null],
  );
}

/** Published averages per branch (pending reviews are counted but not averaged). */
export function reviewSummary(scope: number | null): Promise<ReviewSummaryRow[]> {
  return query<ReviewSummaryRow>(
    `SELECT br.branch_id AS "branchId", br.branch_code AS "branchCode", br.branch_name AS "branchName",
       count(r.review_id) FILTER (WHERE r.review_status = 'PUBLISHED') AS "publishedCount",
       count(r.review_id) FILTER (WHERE r.review_status = 'PENDING') AS "pendingCount",
       round(avg(r.room_rating)    FILTER (WHERE r.review_status = 'PUBLISHED'), 2) AS "roomAvg",
       round(avg(r.service_rating) FILTER (WHERE r.review_status = 'PUBLISHED'), 2) AS "serviceAvg",
       round(avg(r.staff_rating)   FILTER (WHERE r.review_status = 'PUBLISHED'), 2) AS "staffAvg",
       round(avg((r.room_rating + r.service_rating + r.staff_rating) / 3.0)
             FILTER (WHERE r.review_status = 'PUBLISHED'), 2) AS "overallAvg"
     FROM branch br
     LEFT JOIN booking b ON b.branch_id = br.branch_id
     LEFT JOIN review r  ON r.booking_id = b.booking_id
     WHERE ($1::int IS NULL OR br.branch_id = $1)
     GROUP BY br.branch_id
     ORDER BY br.branch_code`,
    [scope],
  );
}

export function listReviewableBookings(scope: number | null): Promise<ReviewableBooking[]> {
  return query<ReviewableBooking>(
    `SELECT b.booking_id AS "bookingId", b.booking_code AS "bookingCode",
       c.first_name || ' ' || c.last_name AS "customerName", b.check_out_date AS "checkOutDate"
     FROM booking b
     JOIN customer c ON c.customer_id = b.customer_id
     WHERE b.booking_status = 'CHECKED_OUT'
       AND ($1::int IS NULL OR b.branch_id = $1)
       AND NOT EXISTS (SELECT 1 FROM review r WHERE r.booking_id = b.booking_id)
     ORDER BY b.check_out_date DESC`,
    [scope],
  );
}

/** R10 (checked-out only) and uq_review_booking (one per booking) are enforced by the database. */
export async function createReview(db: Db, scope: number | null, input: ReviewInput): Promise<number> {
  const { rows: found } = await db.query(
    `SELECT 1 FROM booking WHERE booking_id = $1 AND ($2::int IS NULL OR branch_id = $2)`,
    [input.bookingId, scope],
  );
  if (!found[0]) throw new HttpError(404, "NOT_FOUND", "Booking not found");
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO review (booking_id, room_rating, service_rating, staff_rating, comment)
     VALUES ($1, $2, $3, $4, $5) RETURNING review_id AS id`,
    [input.bookingId, input.roomRating, input.serviceRating, input.staffRating, input.comment],
  );
  return rows[0].id;
}

/** Publish or hide; the moderator is recorded in reply_by_emp_id. */
export async function moderateReview(
  db: Db,
  id: number,
  scope: number | null,
  employeeId: number,
  toStatus: "PUBLISHED" | "HIDDEN",
) {
  const { rowCount } = await db.query(
    `UPDATE review r SET review_status = $3, reply_by_emp_id = $4
     FROM booking b
     WHERE r.review_id = $1 AND b.booking_id = r.booking_id AND ($2::int IS NULL OR b.branch_id = $2)`,
    [id, scope, toStatus, employeeId],
  );
  if (!rowCount) throw new HttpError(404, "NOT_FOUND", "Review not found");
}
