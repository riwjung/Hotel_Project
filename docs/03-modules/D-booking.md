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
| `/customers` | ⏳ | `CUSTOMER_VIEW` / `CUSTOMER_MANAGE` |

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
- [ ] สร้าง booking: เลือกลูกค้า → วัน → ห้องว่าง (query ห้องที่ไม่ชน R3) → rate → promotion
- [x] Booking detail: Descriptions + ห้อง + guests + services + payments + timeline จาก `booking_status_log`
- [x] Check-in: บันทึก `actual_check_in`, `checkin_by_emp_id`, `key_card_no`, guests; ปรับ room_status → OCCUPIED
- [x] Check-out: `actual_check_out`, room_status → CLEANING, สร้าง housekeeping_task อัตโนมัติ ([[F-operations]])
- [x] Cancel / No-show ผ่าน `modal.confirm` danger
- [ ] Customers CRUD + tier/points
- [ ] Customer self-service site + customer login (แยก route group `(site)`) — ยังไม่อยู่ในขอบเขต skeleton
