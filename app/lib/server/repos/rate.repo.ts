import "server-only";
import { z } from "zod";
import { RATE_STATUSES, type RateFilter, type RateInput, type RoomRate } from "@/app/components/portal/rate/types";
import { HttpError } from "../http";
import { query, type Db } from "../db";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const rateFilterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  roomTypeId: z.coerce.number().int().positive().optional(),
  status: z.enum(RATE_STATUSES).optional(),
});

export const rateInputSchema = z
  .object({
    branchId: z.number().int().positive().nullish(),
    roomTypeId: z.number().int().positive(),
    rateName: z.string().trim().min(1).max(50),
    startDate: isoDate,
    endDate: isoDate,
    pricePerNight: z.number().min(0).multipleOf(0.01),
    minNights: z.number().int().min(1).max(60),
    rateStatus: z.enum(RATE_STATUSES),
  })
  .refine((v) => v.startDate <= v.endDate, { message: "End date must be on or after start date", path: ["endDate"] }) satisfies z.ZodType<RateInput>;

const SELECT_RATE = `
  SELECT rr.rate_id AS "rateId", rr.branch_id AS "branchId", b.branch_code AS "branchCode",
    rr.room_type_id AS "roomTypeId", t.type_name AS "typeName", rr.rate_name AS "rateName",
    rr.start_date AS "startDate", rr.end_date AS "endDate", rr.price_per_night AS "pricePerNight",
    rr.min_nights AS "minNights", rr.rate_status AS "rateStatus",
    (SELECT count(*) FROM booking_room br WHERE br.rate_id = rr.rate_id) AS "bookingCount",
    (rr.rate_status = 'ACTIVE' AND current_date BETWEEN rr.start_date AND rr.end_date) AS "isCurrent"
  FROM room_rate rr
  JOIN branch b    ON b.branch_id = rr.branch_id
  JOIN room_type t ON t.room_type_id = rr.room_type_id`;

export function listRates(scope: number | null, filter: RateFilter): Promise<RoomRate[]> {
  return query<RoomRate>(
    `${SELECT_RATE}
     WHERE ($1::int IS NULL OR rr.branch_id = $1)
       AND ($2::int IS NULL OR rr.room_type_id = $2)
       AND ($3::varchar IS NULL OR rr.rate_status = $3)
     ORDER BY b.branch_code, t.base_price, rr.start_date`,
    [scope ?? filter.branchId ?? null, filter.roomTypeId ?? null, filter.status ?? null],
  );
}

export async function getRate(db: Db, id: number, scope: number | null): Promise<RoomRate | null> {
  const { rows } = await db.query<RoomRate>(
    `${SELECT_RATE} WHERE rr.rate_id = $1 AND ($2::int IS NULL OR rr.branch_id = $2)`,
    [id, scope],
  );
  return rows[0] ?? null;
}

/** Overlapping ACTIVE periods for the same (branch, type) are rejected by R1 (EXCLUDE, 23P01 → 409). */
export async function createRate(db: Db, scope: number | null, input: RateInput): Promise<number> {
  const branchId = scope ?? input.branchId;
  if (!branchId) throw new HttpError(400, "VALIDATION", "Select a branch");
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO room_rate (branch_id, room_type_id, rate_name, start_date, end_date, price_per_night, min_nights, rate_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING rate_id AS id`,
    [branchId, input.roomTypeId, input.rateName, input.startDate, input.endDate, input.pricePerNight, input.minNights, input.rateStatus],
  );
  return rows[0].id;
}

/** Booked rooms keep their price_per_night snapshot, so a new price only affects new bookings. */
export async function updateRate(db: Db, id: number, scope: number | null, input: RateInput): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE room_rate SET room_type_id = $3, rate_name = $4, start_date = $5, end_date = $6,
       price_per_night = $7, min_nights = $8, rate_status = $9
     WHERE rate_id = $1 AND ($2::int IS NULL OR branch_id = $2)`,
    [id, scope, input.roomTypeId, input.rateName, input.startDate, input.endDate, input.pricePerNight, input.minNights, input.rateStatus],
  );
  return rowCount === 1;
}

/** Rates already used by booked rooms are still referenced → 409 IN_USE. */
export async function deleteRate(db: Db, id: number, scope: number | null): Promise<boolean> {
  const { rowCount } = await db.query(
    `DELETE FROM room_rate WHERE rate_id = $1 AND ($2::int IS NULL OR branch_id = $2)`,
    [id, scope],
  );
  return rowCount === 1;
}
