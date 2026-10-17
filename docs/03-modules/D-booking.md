---
tags: [module]
module: D
status: in-progress
priority: next
---

# D · การจอง & เข้าพัก (หัวใจของระบบ)

**ตาราง:** `customer` · `booking` · `booking_room` · `guest` · `booking_status_log`
**DDL:** `db/schema/050_d_booking.sql` · **Rules:** R3 ห้องห้ามจองทับ, R7 workflow, R8 promotion, R9 audit log — [[physical-design]]
**Totals:** trigger คำนวณทั้งหมด — [[ADR-003-stored-totals-with-triggers]]
**View:** `v_booking_overview` (พร้อมใช้สำหรับหน้า list)

## Status flow
```
PENDING ──► CONFIRMED ──► CHECKED_IN ──► CHECKED_OUT
   │            ├──► CANCELLED
   └──► CANCELLED └──► NO_SHOW
```
palette อยู่ใน `app/lib/status.tsx › BOOKING_STATUS` แล้ว

## หน้าจอ
| path | สถานะ | permission |
|---|---|---|
| `/bookings` | ✅ list/filter + lifecycle actions | `BOOKING_VIEW` / `BOOKING_MANAGE` |
| `/bookings/[id]` | ✅ detail/check-in/payment/check-out | 〃 |
| `/bookings/new` | ✅ create booking | `BOOKING_MANAGE` |
| `/customers` | ✅ list/search/tier filter + create/edit/delete | `CUSTOMER_VIEW` / `CUSTOMER_MANAGE` |

**Customer = ข้อมูลระดับเครือ** (`customer` ไม่มี `branch_id`) จึงไม่ใช้ `branchScope` — แขกคนเดียวกันใช้ได้ทุกสาขา
ลบลูกค้าที่มี booking ไม่ได้ (FK → 409 `IN_USE`); tier ตามแต้มอัตโนมัติ (R13 — ฟอร์มแก้ได้แค่แต้ม, แสดง tier ล่วงหน้า)
ส่วนลด tier ซ้อนกับ promotion และถูก snapshot ลง `booking.member_discount_rate` ตอนจอง — [[ADR-006-member-tier-discount-and-derived-tier]]

## วิธีเขียน status change (สำคัญ)
```ts
await withTx(session, (db) =>
  db.query("UPDATE booking SET booking_status = $2 WHERE booking_id = $1", [id, "CHECKED_IN"]),
  { statusRemark: "Early check-in" },
);
// trigger R7 ตรวจ transition, R9 เขียน booking_status_log พร้อม changed_by_emp_id ให้เอง
```

## Backlog
- [x] Bookings list จาก `v_booking_overview` (filter สาขา/สถานะ/ช่วงวัน, sort สถานะตาม workflow)
- [x] สร้าง booking `/bookings/new` (2026-10-17): ลูกค้า (+ สร้างลูกค้าใหม่ในหน้าเดียวกัน) → สาขา/วัน/จำนวนคน → ห้องว่าง
      (`GET /api/bookings/availability` ใช้เงื่อนไขเดียวกับ R3) → rate = ACTIVE rate ที่ครอบวัน check-in (R1 รับประกันว่ามีอันเดียว)
      → promotion code (R8) → ยืนยันทันทีได้; `booking_code` มาจาก `booking_code_seq` (`fn_next_booking_code()`)
      — sequence ไม่ rollback จึงอาจมีเลขข้าม ถ้า insert ล้ม (เช่น BK-0011 ถูกใช้แล้วโดน R11 ปฏิเสธ)
- [x] Booking detail: Descriptions + ห้อง + guests + services + payments + timeline จาก `booking_status_log`
- [x] Check-in: บันทึก `actual_check_in`, `checkin_by_emp_id`, `key_card_no`, guests; ปรับ room_status → OCCUPIED
- [x] Check-out: `actual_check_out`, room_status → CLEANING, สร้าง housekeeping_task อัตโนมัติ ([[F-operations]])
- [x] Cancel / No-show ผ่าน `modal.confirm` danger
- [x] Customers CRUD + tier/points (2026-10-17)
- [ ] Customer self-service site + customer login (แยก route group `(site)`) — ยังไม่อยู่ในขอบเขต skeleton
