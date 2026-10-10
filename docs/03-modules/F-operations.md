---
tags: [module]
module: F
status: planned
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
| `/housekeeping` | ⏳ | `HOUSEKEEPING_VIEW` / `HOUSEKEEPING_MANAGE` |
| `/maintenance` | ⏳ | `MAINTENANCE_VIEW` / `MAINTENANCE_MANAGE` |

## Backlog
- [ ] Housekeeping board วันนี้ (PENDING / IN_PROGRESS / DONE / VERIFIED), assign แม่บ้าน
- [ ] สร้าง CHECKOUT_CLEAN อัตโนมัติเมื่อ check-out ([[D-booking]]) — trigger หรือใน API transaction
- [ ] VERIFIED แล้ว → room_status AVAILABLE
- [ ] Maintenance: แจ้งซ่อม, priority, assign ช่าง, ปิดงาน + cost; ห้องที่ซ่อม → room_status MAINTENANCE
- [ ] Dashboard มีตัวเลข open maintenance / housekeeping pending แล้ว (ลิงก์ไปหน้านี้เมื่อทำเสร็จ)
