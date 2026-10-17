import "server-only";
import { z } from "zod";
import {
  BOOKING_CHANNELS,
  type AvailableRoom,
  type BookingCreated,
  type BookingCreateInput,
} from "@/app/components/portal/booking/types";
import { HttpError } from "../http";
import { query, type Db } from "../db";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const availabilitySchema = z
  .object({
    branchId: z.coerce.number().int().positive().optional(),
    checkIn: isoDate,
    checkOut: isoDate,
  })
  .refine((v) => v.checkIn < v.checkOut, { message: "Check-out must be after check-in" });

export const bookingCreateSchema = z
  .object({
    customerId: z.number().int().positive(),
    branchId: z.number().int().positive().nullish(),
    checkInDate: isoDate,
    checkOutDate: isoDate,
    guestCount: z.number().int().min(1).max(50),
    bookingChannel: z.enum(BOOKING_CHANNELS),
    promotionCode: z.string().trim().toUpperCase().max(30).nullish().transform((v) => v || null),
    roomIds: z.array(z.number().int().positive()).min(1, "Select at least one room").max(20),
    confirm: z.boolean(),
  })
  .refine((v) => v.checkInDate < v.checkOutDate, { message: "Check-out must be after check-in", path: ["checkOutDate"] })
  .refine((v) => new Set(v.roomIds).size === v.roomIds.length, { message: "A room can only be selected once", path: ["roomIds"] }) satisfies z.ZodType<BookingCreateInput>;

/** Scoped users always book in their own branch; a chain user must pick one. */
function resolveBranch(scope: number | null, branchId: number | null | undefined): number {
  const resolved = scope ?? branchId;
  if (!resolved) throw new HttpError(400, "VALIDATION", "Select a branch");
  return resolved;
}

/**
 * Rooms of the branch with no active booking overlapping [checkIn, checkOut)
 * — the same test rule R3 applies on insert — and the ACTIVE rate covering the
 * check-in date (R1 guarantees at most one). Out-of-service rooms are left out.
 */
export function listAvailableRooms(
  scope: number | null,
  filter: { branchId?: number; checkIn: string; checkOut: string },
): Promise<AvailableRoom[]> {
  return query<AvailableRoom>(
    `SELECT r.room_id AS "roomId", r.room_number AS "roomNumber", r.room_name AS "roomName", r.floor,
       r.room_status AS "roomStatus", rt.type_name AS "typeName", rt.capacity, rt.bed_type AS "bedType",
       rr.rate_id AS "rateId", rr.rate_name AS "rateName", rr.price_per_night AS "pricePerNight",
       rr.min_nights AS "minNights"
     FROM room r
     JOIN room_type rt ON rt.room_type_id = r.room_type_id
     JOIN room_rate rr ON rr.branch_id = r.branch_id AND rr.room_type_id = r.room_type_id
                      AND rr.rate_status = 'ACTIVE' AND $2::date BETWEEN rr.start_date AND rr.end_date
     WHERE r.branch_id = $1
       AND r.room_status <> 'OUT_OF_SERVICE'
       AND NOT EXISTS (
         SELECT 1
         FROM booking_room br
         JOIN booking b ON b.booking_id = br.booking_id
         WHERE br.room_id = r.room_id
           AND b.booking_status NOT IN ('CANCELLED', 'NO_SHOW')
           AND daterange(b.check_in_date, b.check_out_date, '[)') && daterange($2::date, $3::date, '[)')
       )
     ORDER BY r.room_number`,
    [resolveBranch(scope, filter.branchId), filter.checkIn, filter.checkOut],
  );
}

/**
 * Inserts the booking and its rooms in the caller's transaction. The database
 * does the rest: price snapshot + nights + totals (085), branch/rate/overlap (R3),
 * promotion (R8), status log (R9), capacity at COMMIT (R11), min nights (R12).
 */
export async function createBooking(
  db: Db,
  scope: number | null,
  employeeId: number,
  input: BookingCreateInput,
): Promise<BookingCreated> {
  const branchId = resolveBranch(scope, input.branchId);

  const { rows: checks } = await db.query<{ past: boolean; branchStatus: string | null }>(
    `SELECT $1::date < current_date AS past,
       (SELECT branch_status FROM branch WHERE branch_id = $2) AS "branchStatus"`,
    [input.checkInDate, branchId],
  );
  if (checks[0].past) throw new HttpError(422, "PAST_DATE", "Check-in cannot be in the past");
  if (!checks[0].branchStatus) throw new HttpError(422, "INVALID_REFERENCE", "Selected branch does not exist");
  if (checks[0].branchStatus !== "ACTIVE") throw new HttpError(422, "BRANCH_INACTIVE", "This branch is not taking bookings");

  let promotionId: number | null = null;
  if (input.promotionCode) {
    const { rows } = await db.query<{ promotionId: number }>(
      `SELECT promotion_id AS "promotionId" FROM promotion WHERE upper(promotion_code) = $1`,
      [input.promotionCode],
    );
    if (!rows[0]) throw new HttpError(422, "INVALID_PROMOTION", `Promotion code ${input.promotionCode} does not exist`);
    promotionId = rows[0].promotionId;
  }

  const { rows } = await db.query<BookingCreated>(
    `INSERT INTO booking (customer_id, branch_id, promotion_id, created_by_emp_id,
                          check_in_date, check_out_date, guest_count, booking_channel)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING booking_id AS "bookingId", booking_code AS "bookingCode"`,
    [
      input.customerId,
      branchId,
      promotionId,
      employeeId,
      input.checkInDate,
      input.checkOutDate,
      input.guestCount,
      input.bookingChannel,
    ],
  );
  const booking = rows[0];

  for (const roomId of input.roomIds) {
    const { rows: found } = await db.query<{ roomNumber: string; roomStatus: string; rateId: number | null }>(
      `SELECT r.room_number AS "roomNumber", r.room_status AS "roomStatus", rr.rate_id AS "rateId"
       FROM room r
       LEFT JOIN room_rate rr ON rr.branch_id = r.branch_id AND rr.room_type_id = r.room_type_id
                             AND rr.rate_status = 'ACTIVE' AND $2::date BETWEEN rr.start_date AND rr.end_date
       WHERE r.room_id = $1`,
      [roomId, input.checkInDate],
    );
    const room = found[0];
    if (!room) throw new HttpError(422, "INVALID_REFERENCE", "A selected room does not exist");
    if (room.roomStatus === "OUT_OF_SERVICE") throw new HttpError(422, "ROOM_UNAVAILABLE", `Room ${room.roomNumber} is out of service`);
    if (!room.rateId) throw new HttpError(422, "NO_RATE", `Room ${room.roomNumber} has no active rate on the check-in date`);
    // price_per_night omitted → snapshotted from the rate by trg_booking_room_20_compute
    await db.query(`INSERT INTO booking_room (booking_id, room_id, rate_id) VALUES ($1, $2, $3)`, [
      booking.bookingId,
      roomId,
      room.rateId,
    ]);
  }

  if (input.confirm) {
    await db.query(`UPDATE booking SET booking_status = 'CONFIRMED' WHERE booking_id = $1`, [booking.bookingId]);
  }
  return booking;
}
