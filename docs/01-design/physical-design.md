---
tags: [design, database]
updated: 2026-10-10
---

# Physical design (PostgreSQL 17)

แปลง [[er-design]] เป็น DDL จริงใน `db/schema/` — ไฟล์เรียงตามลำดับ FK dependency

| ไฟล์ | เนื้อหา |
|---|---|
| `000_reset.sql` | drop schema + `btree_gist` |
| `010_a_org_access.sql` | branch, role, permission, role_permission, employee |
| `020_b_workforce.sql` | shift, work_schedule, attendance |
| `030_c_rooms.sql` | room_type, amenity, room_type_amenity, room, room_image, room_rate |
| `040_g_master.sql` | member_tier, promotion (ต้องมาก่อน D) |
| `050_d_booking.sql` | customer, booking, booking_room, guest, booking_status_log |
| `060_e_services.sql` | service_category, service, branch_service, booking_service, service_assignment, employee_service_skill |
| `070_f_operations.sql` | housekeeping_task, maintenance_request |
| `075_g_transactions.sql` | payment, review |
| `080_business_rules.sql` | R1–R12 (ด้านล่าง) |
| `085_totals_triggers.sql` | ยอดรวม — [[ADR-003-stored-totals-with-triggers]] |
| `090_views.sql` | `v_dashboard_branch_today`, `v_booking_overview` |

`npm run db:reset` ตรวจหลังรันว่าได้ **31 tables / 49 FKs** ตรงกับ ER — ไม่ตรง = fail

## Type mapping
| logical | physical | เหตุผล |
|---|---|---|
| `int` PK | `integer GENERATED ALWAYS AS IDENTITY` | มาตรฐาน SQL, กัน insert id มั่ว (seed ใช้ `OVERRIDING SYSTEM VALUE` + `190_sync_identity.sql`) |
| `datetime` | `timestamptz` | เก็บ timezone; DB ตั้ง `timezone=Asia/Bangkok` |
| `varchar(20)` status | `varchar(20)` + `CHECK (… IN …)` | คงตาม ER แต่บังคับค่าที่ยอมรับ |
| `decimal(p,s)` | `numeric(p,s)` | `pg` parse เป็น number ใน `app/lib/server/db.ts` |
| `date` | `date` | `pg` คืนเป็น string `YYYY-MM-DD` (กันวันเลื่อนจาก TZ) |

- ชื่อตาราง/คอลัมน์ snake_case ตัวเล็ก; API alias เป็น camelCase ใน SQL (`branch_code AS "branchCode"`)
- ตั้งชื่อ constraint เอง: `uq_*`, `ck_*`, `fk_<child>_<col>`, `ex_*`, `ix_*` → error message อ่านออก
- **Index ทุก FK column** (Postgres ไม่สร้างให้อัตโนมัติ) + index ตาม query จริง (`booking(branch_id, check_in_date, check_out_date)`)
- Unique เพิ่มจาก ER: `room(branch_id, room_number)`, `branch_service(branch_id, service_id)`, `work_schedule(employee_id, work_date, shift_id)`, `booking_room(booking_id, room_id)`
- Partial unique: cover image 1 รูป/ห้อง, primary guest 1 คน/ห้อง, assignment ที่ยัง active 1 แถว/order

## Status codes (ต้องตรงกับ `app/lib/status.tsx` และ `types.ts` ของ feature)
| ตาราง.คอลัมน์ | ค่า (ลำดับ = workflow) |
|---|---|
| branch.branch_status | ACTIVE, INACTIVE |
| role.scope_level | CHAIN, BRANCH |
| employee.employee_status | ACTIVE, ON_LEAVE, RESIGNED |
| work_schedule.schedule_status | SCHEDULED, COMPLETED, ABSENT, CANCELLED |
| attendance.attendance_status | ON_TIME, LATE, EARLY_LEAVE, ABSENT |
| room.room_status | AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE, OUT_OF_SERVICE |
| room_rate.rate_status | ACTIVE, INACTIVE |
| booking.booking_channel | WALK_IN, WEBSITE, PHONE, OTA |
| booking.booking_status | PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, NO_SHOW |
| booking_service.order_status | REQUESTED, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| service_assignment.assignment_status | ASSIGNED, IN_PROGRESS, COMPLETED, REASSIGNED, CANCELLED |
| employee_service_skill.skill_level | JUNIOR, SENIOR, EXPERT |
| housekeeping_task.task_type | CHECKOUT_CLEAN, STAYOVER_CLEAN, DEEP_CLEAN, INSPECTION |
| housekeeping_task.task_status | PENDING, IN_PROGRESS, DONE, VERIFIED, CANCELLED |
| maintenance_request.priority | LOW, MEDIUM, HIGH, URGENT |
| maintenance_request.maintenance_status | OPEN, IN_PROGRESS, RESOLVED, CANCELLED |
| promotion.discount_type | PERCENT, FIXED |
| promotion.promotion_status | ACTIVE, INACTIVE, EXPIRED |
| payment.payment_type | DEPOSIT, FULL, BALANCE, REFUND |
| payment.payment_method | CASH, CARD, TRANSFER, QR |
| payment.payment_status | PENDING, PAID, FAILED, REFUNDED |
| review.review_status | PENDING, PUBLISHED, HIDDEN |

ตอนนี้ `status.tsx` มี palette ของ branch, room, booking — โมดูลอื่นเพิ่มตอนทำหน้าจอ

## Business rules — `080_business_rules.sql`
ทุกข้อ raise SQLSTATE `P0001` พร้อมข้อความภาษาคน → API ส่งต่อให้ UI ตรง ๆ (422)

| # | กฎ | กลไก |
|---|---|---|
| R1 | ROOM_RATE ช่วงวันห้ามทับใน (branch, room_type) เฉพาะ ACTIVE | `EXCLUDE USING gist (… daterange(start,end,'[]') WITH &&) WHERE ACTIVE` → 23P01 |
| R2 | role CHAIN ต้องไม่มี branch_id, role BRANCH ต้องมี | trigger `employee` |
| R3 | booking_room: สาขาห้อง = สาขา booking, rate ตรงสาขา+ประเภทห้อง, **ห้องห้ามจองทับวัน** (`[in, out)` ต่อกันได้) | trigger + `SELECT … FOR UPDATE` ที่แถว room กัน race |
| R4 | booking_service ต้องเป็นบริการของสาขาเดียวกัน และต้อง is_available ตอนสั่ง | trigger |
| R5 | service_assignment: พนักงานต้องมี skill ของ service นั้น | trigger |
| R6 | assignment ที่ยัง live ได้ 1 แถว/order (เปลี่ยนคน = แถวเดิม REASSIGNED + insert ใหม่) | partial unique index |
| R7 | booking status workflow (PENDING→CONFIRMED→CHECKED_IN→CHECKED_OUT; ยกเลิก/no-show ตามจุด) | trigger BEFORE UPDATE OF booking_status |
| R8 | promotion ต้อง ACTIVE, อยู่ในช่วงวัน, ยังไม่เกิน usage_limit | trigger |
| R9 | ทุกการเปลี่ยนสถานะ booking → `booking_status_log` พร้อมผู้ทำ | trigger AFTER; actor จาก `current_setting('app.emp_id')` ที่ `withTx()` ตั้ง |
| R10 | review ได้เฉพาะ booking ที่ CHECKED_OUT | trigger |
| R11 | ผู้เข้าพักต้องไม่เกินความจุห้อง: (a) แถว `guest` ต่อห้อง ≤ `room_type.capacity` (b) `booking.guest_count` ≤ Σ capacity ของทุกห้องใน booking | (a) trigger BEFORE บน `guest` + `FOR UPDATE` แถว booking_room กัน race · (b) **`CONSTRAINT TRIGGER … DEFERRABLE INITIALLY DEFERRED`** ตรวจตอน COMMIT เพราะ booking ถูก insert ก่อนห้อง (4 คน 2 ห้อง × 2 จะ "เกิน" หลังห้องแรก) — booking ที่ยังไม่มีห้องข้ามไป |
| R12 | จำนวนคืนต้อง ≥ `room_rate.min_nights` (ส่วน min_nights ≥ 1 คือ CHECK `ck_room_rate_min_nights`) | trigger BEFORE บน `booking_room`; การย่อวันของ booking ถูกจับด้วยเพราะ touch-lines ยิง trigger ซ้ำ |

เมื่อเปลี่ยนวัน/สาขาของ booking → trigger "touch" แถว booking_room/booking_service → R3/R4/R12 ถูกตรวจซ้ำ + คิด night_count ใหม่อัตโนมัติ

ทดสอบทั้งหมด: `npm run db:test` (26 cases ใน `db/tests/business_rules.test.sql`, รันใน transaction แล้ว ROLLBACK;
เทสต์ของ R11b ใช้ `SET CONSTRAINTS … IMMEDIATE` บังคับให้ deferred trigger ทำงานก่อน ROLLBACK)

## ยังไม่ได้บังคับ (backlog)
- [x] `room_rate.min_nights` เทียบกับจำนวนคืนจริง → R12 (2026-10-17)
- [x] `guest` จำนวนคนต่อห้อง ≤ `room_type.capacity` → R11 (2026-10-17)
- [ ] พนักงานที่ assign ต้องอยู่สาขาเดียวกับ booking
- [ ] ส่วนลด member tier (ตอนนี้ `discount_amount` = promotion อย่างเดียว — ดู ADR-003)
- [ ] เปลี่ยน room_status อัตโนมัติตอน check-in/out
