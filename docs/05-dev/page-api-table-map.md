---
tags: [dev, data-flow, onboarding]
updated: 2026-10-11
---

# Page → API → Table map

ใช้เอกสารนี้ trace หนึ่ง feature ตั้งแต่หน้าจอถึงฐานข้อมูล และใช้เป็น checklist ตอน review PR

## เส้นทางที่พร้อมใช้งาน

| Page                                    | Permission            | API                                | Repository               | Read                                                                                                                                                                                                                | Write / side effects                                                                        |
| --------------------------------------- | --------------------- | ---------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `/rooms`                                | `ROOM_VIEW`           | `GET /api/rooms`                   | `room.repo.ts`           | `room`, `room_type`, `branch`                                                                                                                                                                                       | —                                                                                           |
| `/rooms` · สร้าง / แก้ / ลบ / สถานะ | `ROOM_MANAGE` | `POST /api/rooms`, `PATCH/DELETE /api/rooms/:id`, `POST /api/rooms/:id/status` | `room.repo.ts` | `room`, `room_type` | insert/update/delete `room`; R3d ห้ามเปลี่ยน type ระหว่างมี booking; R15 อาจคง MAINTENANCE (API คืนสถานะจริง) |
| `/room-types` | `ROOM_VIEW` (แก้: `ROOM_MANAGE` + ระดับเครือ) | `GET/POST /api/room-types`, `PATCH/DELETE /api/room-types/:id` | `room-type.repo.ts` | `room_type`, `room_type_amenity`, `amenity`, `room`, `room_rate` | insert/update/delete `room_type` + แทนชุด `room_type_amenity`; R11c ตรวจ capacity |
| `/amenities` | `ROOM_VIEW` (แก้: `ROOM_MANAGE` + ระดับเครือ) | `GET/POST /api/amenities`, `PATCH/DELETE /api/amenities/:id` | `amenity.repo.ts` | `amenity`, `room_type_amenity` | insert/update/delete `amenity` (ลบ → `room_type_amenity` cascade) |
| `/room-rates` | `RATE_MANAGE` | `GET/POST /api/room-rates`, `PATCH/DELETE /api/room-rates/:id` | `rate.repo.ts` | `room_rate`, `branch`, `room_type`, `booking_room` | insert/update/delete `room_rate`; R1 EXCLUDE ช่วงทับ → 409; ถูกใช้แล้วลบไม่ได้ |
| `/bookings`                             | `BOOKING_VIEW`        | `GET /api/bookings`                | `booking-list.repo.ts`   | `v_booking_overview` → `booking`, `branch`, `customer`, `member_tier`, `booking_room`, `payment`                                                                                                                    | —                                                                                           |
| `/bookings/new` · ห้องว่าง              | `BOOKING_MANAGE`      | `GET /api/bookings/availability`   | `booking-create.repo.ts` | `room`, `room_type`, `room_rate` (ACTIVE ที่ครอบวัน check-in), `booking_room`, `booking` (กันห้องที่ทับวัน แบบเดียวกับ R3)                                                                                          | —                                                                                           |
| `/bookings/new` · สร้าง booking         | `BOOKING_MANAGE`      | `POST /api/bookings`               | `booking-create.repo.ts` | `branch`, `promotion`, `room`, `room_rate`                                                                                                                                                                          | insert `booking` (code จาก `booking_code_seq`) + `booking_room` ต่อห้อง; trigger: R3, R8, R12, ราคา/ยอดรวม + snapshot อัตรา member (085), R9 log; R11 ตรวจตอน COMMIT; เลือก "Confirm now" → update เป็น CONFIRMED ใน transaction เดียวกัน |
| `/bookings/[id]`                        | `BOOKING_VIEW`        | `GET /api/bookings/:id`            | `booking-detail.repo.ts` | `booking`, `branch`, `customer`, `member_tier`, `promotion`, `employee`, `booking_room`, `room`, `room_type`, `room_rate`, `guest`, `booking_service`, `branch_service`, `service`, `payment`, `booking_status_log` | —                                                                                           |
| Booking detail · confirm/cancel/no-show | `BOOKING_MANAGE`      | `POST /api/bookings/:id/status`    | `booking-action.repo.ts` | `booking`                                                                                                                                                                                                           | update `booking`; R7 ตรวจ transition; R9 insert `booking_status_log`                        |
| Booking detail · check-in               | `BOOKING_MANAGE`      | `POST /api/bookings/:id/check-in`  | `booking-action.repo.ts` | `booking`, `booking_room`, `room`                                                                                                                                                                                   | insert `guest`; update `booking_room`, `room`, `booking`; R9 insert log                     |
| Booking detail · payment                | `PAYMENT_MANAGE`      | `POST /api/bookings/:id/payments`  | `booking-action.repo.ts` | `booking`, `payment`                                                                                                                                                                                                | insert `payment`; `v_booking_overview.paid_total` และ balance เปลี่ยนตาม query              |
| Booking detail · check-out              | `BOOKING_MANAGE`      | `POST /api/bookings/:id/check-out` | `booking-action.repo.ts` | `booking`, `booking_room`, `room`, `employee`                                                                                                                                                                       | update `booking_room`, `room`, `booking`; insert `housekeeping_task` ต่อห้อง; R9 insert log; R14 เพิ่ม `customer.member_point` (→ R13 tier) |
| `/services` | `SERVICE_VIEW` (แก้: `SERVICE_MANAGE` + ระดับเครือ) | `GET/POST /api/services`, `/api/service-categories` (+ `PATCH/DELETE /:id`) | `service.repo.ts` | `service`, `service_category`, `branch_service` | insert/update/delete `service`, `service_category` |
| `/branch-services` | `SERVICE_VIEW` / `SERVICE_MANAGE` | `GET/POST /api/branch-services`, `PATCH/DELETE /api/branch-services/:id` | `branch-service.repo.ts` | `branch_service`, `service`, `service_category`, `booking_service` | insert/update/delete `branch_service` (ซ้ำ → 409) |
| `/service-orders` (+ ปุ่มในหน้า booking) | `SERVICE_VIEW` / `SERVICE_ORDER_MANAGE` | `GET/POST /api/service-orders`, `POST /api/service-orders/:id/status` | `service-order.repo.ts` | `booking_service`, `booking`, `booking_room`, `room`, `customer`, `branch_service`, `service`, `service_assignment`, `employee` | insert/update `booking_service` → R4, R19, totals trigger อัปเดต `booking.service_total`/`grand_total`; R19 sync `service_assignment` |
| Service orders · assign / reassign | `ASSIGNMENT_MANAGE` | `GET /api/service-orders/:id/eligible-employees`, `POST /api/service-orders/:id/assign` | `service-order.repo.ts` | `employee_service_skill`, `employee`, `service_assignment` | update แถวเดิมเป็น REASSIGNED + insert ใหม่ (R5 skill, R6 live 1 แถว, R16 สาขา, R19 order ต้องเปิด) |
| `/assignments` | `ASSIGNMENT_MANAGE` | `GET /api/assignments`, `GET /api/assignments/quality`, `PATCH /api/assignments/:id` | `assignment.repo.ts` | `service_assignment`, `booking_service`, `booking`, `service`, `employee` | update `quality_score` (เฉพาะงาน COMPLETED) |
| `/skills` | `ASSIGNMENT_MANAGE` | `GET/PUT /api/skills` | `skill.repo.ts` | `employee`, `service`, `employee_service_skill` | upsert / delete `employee_service_skill` |
| `/housekeeping`                         | `HOUSEKEEPING_VIEW`   | `GET /api/housekeeping`            | `housekeeping.repo.ts`   | `housekeeping_task`, `room`, `branch`, `employee`                                                                                                                                                                   | —                                                                                           |
| Housekeeping actions                    | `HOUSEKEEPING_MANAGE` | `PATCH /api/housekeeping/:id`      | `housekeeping.repo.ts`   | `housekeeping_task`, `room`                                                                                                                                                                                         | update task; ตอน VERIFIED update `room.room_status = AVAILABLE`                             |
| `/maintenance`                          | `MAINTENANCE_VIEW`    | `GET /api/maintenance`             | `maintenance.repo.ts`    | `maintenance_request`, `branch`, `room`, `employee` | — |
| Maintenance · report / edit / status    | `MAINTENANCE_MANAGE`  | `POST /api/maintenance`, `PATCH /api/maintenance/:id`, `POST /api/maintenance/:id/status` | `maintenance.repo.ts` | `maintenance_request`, `room`, `housekeeping_task` | insert/update `maintenance_request`; R15 เปลี่ยน `room.room_status` (MAINTENANCE ↔ CLEANING/AVAILABLE), R16 ตรวจสาขาช่าง |
| `/payments` | `PAYMENT_VIEW` | `GET /api/payments` | `payment.repo.ts` | `payment`, `booking`, `branch`, `customer`, `employee` | — |
| Payments · ยืนยัน / ล้มเหลว | `PAYMENT_MANAGE` | `POST /api/payments/:id/status` | `payment.repo.ts` | `payment`, `booking` | update `payment.payment_status`; R17 ตรวจ workflow + ยอดค้าง |
| Payments / booking detail · คืนเงิน | `PAYMENT_MANAGE` | `POST /api/bookings/:id/refunds` | `payment.repo.ts` | `booking`, `payment` | insert `payment` (REFUND, REFUNDED); R17 ห้ามเกินยอดที่จ่าย; `v_booking_overview.paid_total` ลดลง |
| `/promotions` | `PROMOTION_MANAGE` | `GET/POST /api/promotions`, `PATCH/DELETE /api/promotions/:id` | `promotion.repo.ts` | `promotion`, `booking` (ใช้ไปกี่ครั้ง) | insert/update/delete `promotion`; R18 ล็อกเงื่อนไขส่วนลด; ถูกใช้แล้ว → ลบไม่ได้ (FK) |
| `/member-tiers` | `PROMOTION_MANAGE` | `GET/POST /api/member-tiers`, `PATCH/DELETE /api/member-tiers/:id` | `member-tier.repo.ts` | `member_tier`, `customer` | insert/update/delete `member_tier`; R13 re-tier ลูกค้าทุกคน (update `customer.tier_id`) |
| `/reviews` | `REVIEW_VIEW` | `GET /api/reviews`, `GET /api/reviews/summary` | `review.repo.ts` | `review`, `booking`, `branch`, `customer`, `employee` | — |
| Reviews · บันทึก / publish / hide | `REVIEW_REPLY` | `POST /api/reviews`, `GET /api/reviews/reviewable-bookings`, `POST /api/reviews/:id/status` | `review.repo.ts` | `booking`, `review` | insert `review` (R10 เฉพาะ CHECKED_OUT, 1 รีวิว/booking); update สถานะ + `reply_by_emp_id` |
| ทุกหน้าที่มี dropdown พนักงาน            | (login)               | `GET /api/employees/options`       | `employee.repo.ts`       | `employee`, `role` (ACTIVE, ในสาขาตาม scope) | — |
| `/customers`                            | `CUSTOMER_VIEW`       | `GET /api/customers`, `GET /api/member-tiers` | `customer.repo.ts` | `customer`, `member_tier`, `booking` (นับ booking + วันเข้าพักล่าสุด)                                                                                                                                    | —                                                                                           |
| Customers · create/edit/delete          | `CUSTOMER_MANAGE`     | `POST /api/customers`, `PATCH`/`DELETE /api/customers/:id` | `customer.repo.ts` | `customer`                                                                                                                                                                                                | insert/update/delete `customer`; R13 ตั้ง `tier_id` จาก `member_point`; email ซ้ำ → 409 (`uq_customer_email`); มี booking → 409 (FK)  |

## Core lifecycle

```text
customer
   ↓ booking.customer_id
booking ──→ booking_status_log
   ↓
booking_room ──→ guest
   ↓ room_id          booking ──→ payment
room
   ↓ เมื่อ check-out
housekeeping_task
   ↓ เมื่อ VERIFIED
room.room_status = AVAILABLE
```

- ทุก query ที่เป็นข้อมูลสาขาต้องรับ `branchScope(session)`; query-string filter ห้ามขยาย scope
- ทุก write อยู่ใน `withTx()` จึง rollback ทั้งชุดเมื่อขั้นตอนใดขั้นตอนหนึ่งล้มเหลว
- check-in: ห้องทุกห้องต้อง `AVAILABLE`, payload ต้องมี booking room ครบ และ guest รวมต้องเท่ากับ `booking.guest_count`;
  DB rule R11 ปฏิเสธ guest ที่เกิน `room_type.capacity` ของห้องนั้น (ทั้ง transaction rollback)
- payment: lock booking ก่อนรวมยอด, ปฏิเสธจำนวนที่เกิน balance และ booking ที่ CANCELLED / NO_SHOW
- check-out: ตรวจ assignee ว่า active และอยู่สาขาเดียวกับ booking ก่อนสร้าง task
- verify: ผู้ตรวจต้องไม่ใช่ `assigned_emp_id`; สำเร็จแล้วห้องที่เป็น `CLEANING` กลับเป็น `AVAILABLE`
  (stay-over clean ของห้องที่ยังมีแขกอยู่ ห้องยัง `OCCUPIED`)

## PR review questions

1. ผู้ใช้เปิดหน้าใด
2. หน้าเรียก API ใด
3. API ใช้ permission ใด
4. route ส่งต่อไป repository ใด
5. query อ่าน table/view ใด
6. operation เขียน table ใด
7. trigger/constraint ใดทำงานต่อ
8. ถ้า transaction ล้มเหลว ข้อมูลใดต้อง rollback
