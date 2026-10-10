---
tags: [module]
module: B
status: planned
---

# B · กำลังคน & เวลาทำงาน

**ตาราง:** `shift` · `work_schedule` · `attendance`
**DDL:** `db/schema/020_b_workforce.sql`

- `attendance` ไม่เก็บ `employee_id` (3NF — ได้จาก `schedule_id`)
- `attendance.schedule_id` UNIQUE → 1 เวร : 0..1 การลงเวลา
- กะข้ามคืน (`is_overnight`) ยอมให้ `end_time < start_time`

## หน้าจอ
| path | สถานะ | permission |
|---|---|---|
| `/shifts` | ⏳ | `SCHEDULE_VIEW` / `SCHEDULE_MANAGE` |
| `/schedules` | ⏳ | `SCHEDULE_VIEW` / `SCHEDULE_MANAGE` |
| `/attendance` | ⏳ | `ATTENDANCE_VIEW` / `ATTENDANCE_MANAGE` |

## Backlog
- [ ] Shifts CRUD ต่อสาขา
- [ ] Schedule: ตารางสัปดาห์ (พนักงาน × วัน) — อาจต้อง CSS Module สำหรับ grid (ui-standard อนุญาต)
- [ ] Attendance: clock-in/out, คำนวณ LATE จาก shift.start_time (+ grace period?)
- [ ] รายงานขาด/สายรายเดือน (query ข้าม 3 ตาราง — เหมาะใส่ในรายงานวิชา)
