---
tags: [module]
module: F
status: done
---

# F · ปฏิบัติการหน้างาน

**ตาราง:** `housekeeping_task` · `maintenance_request`
**DDL:** `db/schema/070_f_operations.sql`

งานภายในที่ไม่มีลูกค้าสั่ง/ไม่มีราคา จึงแยกออกจาก SERVICE ([[E-services]])

- housekeeping: ผู้ตรวจ (`verified_by_emp_id`) ต้องไม่ใช่คนทำ (CHECK)
- maintenance: `room_id` NULL = พื้นที่ส่วนกลาง (ล็อบบี้, สระ)

## หน้าจอ
| path | สถานะ | permission |
|---|---|---|
| `/housekeeping` | ✅ list/filter + workflow | `HOUSEKEEPING_VIEW` / `HOUSEKEEPING_MANAGE` |
| `/maintenance` | ✅ list/filter, แจ้งซ่อม, แก้, start/resolve (+ค่าใช้จ่าย)/cancel | `MAINTENANCE_VIEW` / `MAINTENANCE_MANAGE` |

## Backlog
- [x] Housekeeping board วันนี้ (PENDING / IN_PROGRESS / DONE / VERIFIED), assign แม่บ้าน
- [x] สร้าง CHECKOUT_CLEAN อัตโนมัติเมื่อ check-out ([[D-booking]]) — ทำใน API transaction
- [x] VERIFIED แล้ว → room_status AVAILABLE
- [x] Maintenance: แจ้งซ่อม, priority, assign ช่าง, ปิดงาน + cost; ห้องที่ซ่อม → room_status MAINTENANCE (R15, ช่างต้องอยู่สาขาเดียวกัน R16) — 2026-10-18
- [x] Dashboard: การ์ด open maintenance / housekeeping pending / arrivals ลิงก์ไปหน้าที่เกี่ยวข้อง (เฉพาะคนที่มีสิทธิ์)
