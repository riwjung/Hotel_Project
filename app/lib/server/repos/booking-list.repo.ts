import "server-only";
import type { BookingFilter, BookingListItem } from "@/app/components/portal/booking/types";
import { query } from "../db";

export function listBookings(scope: number | null, filter: BookingFilter): Promise<BookingListItem[]> {
  const branchId = scope ?? filter.branchId ?? null;
  const q = filter.q?.trim() || null;
  return query<BookingListItem>(
    `SELECT
       booking_id AS "bookingId", booking_code AS "bookingCode",
       branch_id AS "branchId", branch_code AS "branchCode",
       customer_id AS "customerId", customer_name AS "customerName", tier_name AS "tierName",
       check_in_date AS "checkInDate", check_out_date AS "checkOutDate", nights,
       guest_count AS "guestCount", room_count AS "roomCount",
       grand_total AS "grandTotal", paid_total AS "paidTotal",
       booking_channel AS "bookingChannel", booking_status AS "bookingStatus"
     FROM v_booking_overview
     WHERE ($1::int IS NULL OR branch_id = $1)
       AND ($2::varchar IS NULL OR booking_status = $2)
       AND ($3::date IS NULL OR check_out_date > $3)
       AND ($4::date IS NULL OR check_in_date <= $4)
       AND ($5::varchar IS NULL OR booking_code ILIKE '%' || $5 || '%' OR customer_name ILIKE '%' || $5 || '%')
     ORDER BY check_in_date DESC, booking_code`,
    [branchId, filter.status ?? null, filter.from ?? null, filter.to ?? null, q],
  );
}
