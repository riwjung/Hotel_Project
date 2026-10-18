import "server-only";
import { z } from "zod";
import type { GridFilter, GridRoom } from "@/app/components/portal/availability/types";
import { query } from "../db";

export const gridFilterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  days: z.coerce.number().int().min(1, "Show at least 1 night").max(31, "Show at most 31 nights").default(14),
});

/**
 * Every room in scope with the stays that hold it on a night of [from, from + days).
 * Same overlap test as R3 (cancelled / no-show bookings release the room), so an
 * empty cell is exactly a night a new booking can take. One statement, so rooms
 * and stays come from the same snapshot.
 */
export function getAvailabilityGrid(scope: number | null, filter: GridFilter): Promise<GridRoom[]> {
  return query<GridRoom>(
    `SELECT r.room_id AS "roomId", r.branch_id AS "branchId", b.branch_code AS "branchCode",
       b.branch_status AS "branchStatus", r.room_number AS "roomNumber", r.room_name AS "roomName",
       r.floor, r.room_status AS "roomStatus", t.type_name AS "typeName", t.capacity,
       COALESCE(s.stays, '[]'::json) AS stays
     FROM room r
     JOIN branch b    ON b.branch_id = r.branch_id
     JOIN room_type t ON t.room_type_id = r.room_type_id
     LEFT JOIN LATERAL (
       SELECT json_agg(json_build_object(
                'bookingId',     bk.booking_id,
                'bookingCode',   bk.booking_code,
                'customerName',  c.first_name || ' ' || c.last_name,
                'guestCount',    bk.guest_count,
                'checkInDate',   bk.check_in_date,
                'checkOutDate',  bk.check_out_date,
                'bookingStatus', bk.booking_status
              ) ORDER BY bk.check_in_date) AS stays
       FROM booking_room br
       JOIN booking bk  ON bk.booking_id = br.booking_id
       JOIN customer c  ON c.customer_id = bk.customer_id
       WHERE br.room_id = r.room_id
         AND bk.booking_status NOT IN ('CANCELLED', 'NO_SHOW')
         AND daterange(bk.check_in_date, bk.check_out_date, '[)')
             && daterange($2::date, $2::date + $3::int, '[)')
     ) s ON true
     WHERE ($1::int IS NULL OR r.branch_id = $1)
     ORDER BY b.branch_code, r.room_number`,
    [scope ?? filter.branchId ?? null, filter.from, filter.days],
  );
}
