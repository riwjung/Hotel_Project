import "server-only";
import { z } from "zod";
import type { CheckInInput, CheckOutInput, PaymentInput } from "@/app/components/portal/booking/types";
import { BOOKING_STATUSES, PAYMENT_METHODS, PAYMENT_TYPES } from "@/app/components/portal/booking/types";
import { HttpError } from "../http";
import type { Db } from "../db";

const optionalText = (max: number) =>
  z.string().trim().max(max).nullish().transform((value) => value || null);

const guestSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  idCardNo: optionalText(30),
  nationality: optionalText(50),
  isPrimary: z.boolean(),
});

const roomCheckInSchema = z.object({
  bookingRoomId: z.number().int().positive(),
  keyCardNo: z.string().trim().min(1).max(20),
  guests: z.array(guestSchema).min(1).refine((guests) => guests.filter((g) => g.isPrimary).length === 1, {
    message: "Each room must have exactly one primary guest",
  }),
});

export const checkInSchema = z.object({
  rooms: z.array(roomCheckInSchema).min(1),
}).superRefine((value, ctx) => {
  const ids = value.rooms.map((room) => room.bookingRoomId);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "A room can only appear once" });
}) satisfies z.ZodType<CheckInInput>;

export const paymentInputSchema = z.object({
  amount: z.number().positive().multipleOf(0.01),
  paymentType: z.enum(PAYMENT_TYPES),
  paymentMethod: z.enum(PAYMENT_METHODS),
  transactionRef: optionalText(100),
}) satisfies z.ZodType<PaymentInput>;

export const checkOutSchema = z.object({
  assignedEmpId: z.number().int().positive(),
  remark: optionalText(255),
}) satisfies z.ZodType<CheckOutInput>;

export const statusInputSchema = z.object({
  toStatus: z.enum(BOOKING_STATUSES).refine(
    (status) => status === "CONFIRMED" || status === "CANCELLED" || status === "NO_SHOW",
    "This status must use its dedicated action",
  ),
  remark: optionalText(255),
});

type LockedBooking = {
  bookingId: number;
  branchId: number;
  guestCount: number;
  grandTotal: number;
  bookingStatus: string;
};

async function lockBooking(db: Db, id: number, scope: number | null): Promise<LockedBooking> {
  const { rows } = await db.query<LockedBooking>(
    `SELECT booking_id AS "bookingId", branch_id AS "branchId", guest_count AS "guestCount",
       grand_total AS "grandTotal", booking_status AS "bookingStatus"
     FROM booking WHERE booking_id = $1 AND ($2::int IS NULL OR branch_id = $2) FOR UPDATE`,
    [id, scope],
  );
  if (!rows[0]) throw new HttpError(404, "NOT_FOUND", "Booking not found");
  return rows[0];
}

export async function changeBookingStatus(db: Db, id: number, scope: number | null, toStatus: string) {
  await lockBooking(db, id, scope);
  await db.query(`UPDATE booking SET booking_status = $2 WHERE booking_id = $1`, [id, toStatus]);
}

export async function checkInBooking(
  db: Db,
  id: number,
  scope: number | null,
  employeeId: number,
  input: CheckInInput,
) {
  const booking = await lockBooking(db, id, scope);
  if (booking.bookingStatus !== "CONFIRMED") {
    throw new HttpError(422, "INVALID_STATUS", "Only a confirmed booking can be checked in");
  }
  const { rows } = await db.query<{ bookingRoomId: number; roomId: number; roomStatus: string }>(
    `SELECT br.booking_room_id AS "bookingRoomId", br.room_id AS "roomId", r.room_status AS "roomStatus"
     FROM booking_room br JOIN room r ON r.room_id = br.room_id
     WHERE br.booking_id = $1 ORDER BY br.booking_room_id FOR UPDATE OF br, r`,
    [id],
  );
  const expected = rows.map((r) => r.bookingRoomId).sort((a, b) => a - b);
  const submitted = input.rooms.map((r) => r.bookingRoomId).sort((a, b) => a - b);
  if (expected.length !== submitted.length || expected.some((roomId, i) => roomId !== submitted[i])) {
    throw new HttpError(422, "ROOM_MISMATCH", "Check-in details must include every room in this booking");
  }
  if (rows.some((room) => room.roomStatus !== "AVAILABLE")) {
    throw new HttpError(422, "ROOM_UNAVAILABLE", "Every booked room must be Available before check-in");
  }
  const guestCount = input.rooms.reduce((sum, room) => sum + room.guests.length, 0);
  if (guestCount !== booking.guestCount) {
    throw new HttpError(422, "GUEST_COUNT", `Enter exactly ${booking.guestCount} guest(s) for this booking`);
  }

  for (const roomInput of input.rooms) {
    await db.query(
      `UPDATE booking_room SET actual_check_in = now(), checkin_by_emp_id = $2, key_card_no = $3
       WHERE booking_room_id = $1`,
      [roomInput.bookingRoomId, employeeId, roomInput.keyCardNo],
    );
    for (const guest of roomInput.guests) {
      await db.query(
        `INSERT INTO guest (booking_room_id, full_name, id_card_no, nationality, is_primary)
         VALUES ($1, $2, $3, $4, $5)`,
        [roomInput.bookingRoomId, guest.fullName, guest.idCardNo ?? null, guest.nationality ?? null, guest.isPrimary],
      );
    }
  }
  await db.query(`UPDATE room SET room_status = 'OCCUPIED' WHERE room_id = ANY($1::int[])`, [rows.map((r) => r.roomId)]);
  await db.query(`UPDATE booking SET booking_status = 'CHECKED_IN' WHERE booking_id = $1`, [id]);
}

export async function recordPayment(
  db: Db,
  id: number,
  scope: number | null,
  employeeId: number,
  input: PaymentInput,
) {
  const booking = await lockBooking(db, id, scope);
  const { rows } = await db.query<{ paidTotal: number }>(
    `SELECT COALESCE(sum(CASE WHEN payment_type = 'REFUND' THEN -amount ELSE amount END)
       FILTER (WHERE payment_status IN ('PAID', 'REFUNDED')), 0) AS "paidTotal"
     FROM payment WHERE booking_id = $1`,
    [id],
  );
  const balance = Math.max(0, booking.grandTotal - rows[0].paidTotal);
  if (input.amount > balance + 0.001) {
    throw new HttpError(422, "OVERPAYMENT", `Payment cannot exceed the outstanding balance of ${balance.toFixed(2)}`);
  }
  await db.query(
    `INSERT INTO payment
       (booking_id, received_by_emp_id, amount, payment_type, payment_method, transaction_ref, payment_status)
     VALUES ($1, $2, $3, $4, $5, $6, 'PAID')`,
    [id, employeeId, input.amount, input.paymentType, input.paymentMethod, input.transactionRef ?? null],
  );
}

export async function checkOutBooking(
  db: Db,
  id: number,
  scope: number | null,
  input: CheckOutInput,
) {
  const booking = await lockBooking(db, id, scope);
  if (booking.bookingStatus !== "CHECKED_IN") {
    throw new HttpError(422, "INVALID_STATUS", "Only a checked-in booking can be checked out");
  }
  const employee = await db.query(
    `SELECT 1 FROM employee WHERE employee_id = $1 AND branch_id = $2 AND employee_status = 'ACTIVE'`,
    [input.assignedEmpId, booking.branchId],
  );
  if (!employee.rowCount) throw new HttpError(422, "INVALID_ASSIGNEE", "Select an active employee from this branch");

  const { rows } = await db.query<{ bookingRoomId: number; roomId: number }>(
    `SELECT booking_room_id AS "bookingRoomId", room_id AS "roomId"
     FROM booking_room WHERE booking_id = $1 FOR UPDATE`,
    [id],
  );
  await db.query(
    `UPDATE booking_room SET actual_check_out = now()
     WHERE booking_id = $1 AND actual_check_out IS NULL`,
    [id],
  );
  await db.query(`UPDATE room SET room_status = 'CLEANING' WHERE room_id = ANY($1::int[])`, [rows.map((r) => r.roomId)]);
  for (const room of rows) {
    await db.query(
      `INSERT INTO housekeeping_task (room_id, assigned_emp_id, task_type, task_status, remark)
       VALUES ($1, $2, 'CHECKOUT_CLEAN', 'PENDING', $3)`,
      [room.roomId, input.assignedEmpId, input.remark ?? null],
    );
  }
  await db.query(`UPDATE booking SET booking_status = 'CHECKED_OUT' WHERE booking_id = $1`, [id]);
}
