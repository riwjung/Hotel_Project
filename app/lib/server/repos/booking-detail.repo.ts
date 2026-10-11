import "server-only";
import type {
  BookingDetail,
  BookingGuest,
  BookingPayment,
  BookingRoomDetail,
  BookingService,
  BookingStatusLog,
  EmployeeOption,
} from "@/app/components/portal/booking/types";
import { query, queryOne } from "../db";

type BookingHeader = Omit<
  BookingDetail,
  "rooms" | "guests" | "services" | "payments" | "statusLog" | "housekeepingAssignees"
>;

export async function getBookingDetail(id: number, scope: number | null): Promise<BookingDetail | null> {
  const header = await queryOne<BookingHeader>(
    `SELECT
       v.booking_id AS "bookingId", v.booking_code AS "bookingCode",
       v.branch_id AS "branchId", v.branch_code AS "branchCode",
       v.customer_id AS "customerId", v.customer_name AS "customerName", v.tier_name AS "tierName",
       v.check_in_date AS "checkInDate", v.check_out_date AS "checkOutDate", v.nights,
       v.guest_count AS "guestCount", v.room_count AS "roomCount",
       v.grand_total AS "grandTotal", v.paid_total AS "paidTotal",
       v.booking_channel AS "bookingChannel", v.booking_status AS "bookingStatus",
       b.booking_date AS "bookingDate", b.room_total AS "roomTotal",
       b.service_total AS "serviceTotal", b.discount_amount AS "discountAmount",
       v.grand_total - v.paid_total AS balance,
       p.promotion_code AS "promotionCode", p.promotion_name AS "promotionName",
       concat_ws(' ', creator.first_name, creator.last_name) AS "createdByName"
     FROM v_booking_overview v
     JOIN booking b ON b.booking_id = v.booking_id
     LEFT JOIN promotion p ON p.promotion_id = b.promotion_id
     LEFT JOIN employee creator ON creator.employee_id = b.created_by_emp_id
     WHERE v.booking_id = $1 AND ($2::int IS NULL OR v.branch_id = $2)`,
    [id, scope],
  );
  if (!header) return null;

  const [rooms, guests, services, payments, statusLog, housekeepingAssignees] = await Promise.all([
    query<BookingRoomDetail>(
      `SELECT br.booking_room_id AS "bookingRoomId", r.room_id AS "roomId",
         r.room_number AS "roomNumber", r.room_name AS "roomName", rt.type_name AS "typeName",
         rr.rate_name AS "rateName", br.price_per_night AS "pricePerNight",
         br.night_count AS "nightCount", br.subtotal,
         br.actual_check_in AS "actualCheckIn", br.actual_check_out AS "actualCheckOut",
         br.key_card_no AS "keyCardNo"
       FROM booking_room br
       JOIN room r ON r.room_id = br.room_id
       JOIN room_type rt ON rt.room_type_id = r.room_type_id
       JOIN room_rate rr ON rr.rate_id = br.rate_id
       WHERE br.booking_id = $1 ORDER BY r.room_number`,
      [id],
    ),
    query<BookingGuest>(
      `SELECT g.guest_id AS "guestId", g.booking_room_id AS "bookingRoomId",
         r.room_number AS "roomNumber", g.full_name AS "fullName", g.id_card_no AS "idCardNo",
         g.nationality, g.is_primary AS "isPrimary"
       FROM guest g
       JOIN booking_room br ON br.booking_room_id = g.booking_room_id
       JOIN room r ON r.room_id = br.room_id
       WHERE br.booking_id = $1 ORDER BY r.room_number, g.is_primary DESC, g.full_name`,
      [id],
    ),
    query<BookingService>(
      `SELECT bs.booking_service_id AS "bookingServiceId", s.service_name AS "serviceName",
         bs.quantity, bs.unit_price AS "unitPrice", bs.subtotal,
         bs.scheduled_at AS "scheduledAt", bs.order_status AS "orderStatus", bs.remark
       FROM booking_service bs
       JOIN branch_service bsvc ON bsvc.branch_service_id = bs.branch_service_id
       JOIN service s ON s.service_id = bsvc.service_id
       WHERE bs.booking_id = $1 ORDER BY bs.requested_at`,
      [id],
    ),
    query<BookingPayment>(
      `SELECT p.payment_id AS "paymentId", p.amount, p.payment_type AS "paymentType",
         p.payment_method AS "paymentMethod", p.payment_date AS "paymentDate",
         p.transaction_ref AS "transactionRef", p.payment_status AS "paymentStatus",
         concat_ws(' ', e.first_name, e.last_name) AS "receivedByName"
       FROM payment p LEFT JOIN employee e ON e.employee_id = p.received_by_emp_id
       WHERE p.booking_id = $1 ORDER BY p.payment_date DESC`,
      [id],
    ),
    query<BookingStatusLog>(
      `SELECT l.log_id AS "logId", l.from_status AS "fromStatus", l.to_status AS "toStatus",
         l.changed_at AS "changedAt", concat_ws(' ', e.first_name, e.last_name) AS "changedByName", l.remark
       FROM booking_status_log l LEFT JOIN employee e ON e.employee_id = l.changed_by_emp_id
       WHERE l.booking_id = $1 ORDER BY l.changed_at DESC, l.log_id DESC`,
      [id],
    ),
    query<EmployeeOption>(
      `SELECT e.employee_id AS "employeeId", e.employee_code AS "employeeCode",
         concat_ws(' ', e.first_name, e.last_name) AS "fullName"
       FROM employee e
       WHERE e.branch_id = $1 AND e.employee_status = 'ACTIVE'
       ORDER BY e.first_name, e.last_name`,
      [header.branchId],
    ),
  ]);

  return { ...header, rooms, guests, services, payments, statusLog, housekeepingAssignees };
}
