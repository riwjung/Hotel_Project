---
tags: [module]
module: B
status: done
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
| `/shifts` | ✅ CRUD ต่อสาขา (overnight) | `SCHEDULE_VIEW` / `SCHEDULE_MANAGE` |
| `/schedules` | ✅ ตารางสัปดาห์ พนักงาน × วัน, เพิ่มกะ, ยกเลิก/คืน/ทำเครื่องหมายขาด | `SCHEDULE_VIEW` / `SCHEDULE_MANAGE` |
| `/attendance` | ✅ กะของฉัน (clock in/out), ตารางรายวัน + แก้ไข, รายงานรายเดือน | `ATTENDANCE_VIEW` / `ATTENDANCE_MANAGE` |

## Backlog
- [x] Shifts CRUD ต่อสาขา — 2026-10-18
- [x] Schedule: ตารางสัปดาห์ (พนักงาน × วัน) ด้วย antd Table (ไม่ต้องใช้ CSS Module); กะทับเวลาไม่ได้ (R21)
- [x] Attendance: clock-in/out (ของตัวเอง หรือผู้มี ATTENDANCE_MANAGE แก้ให้), สถานะคำนวณใน DB ผ่อนผัน 5 นาที (R22)
- [x] รายงานขาด/สายรายเดือน — view `v_attendance_monthly` (work_schedule × employee × attendance × shift)
