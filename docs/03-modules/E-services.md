---
tags: [module]
module: E
status: done
---

# E · บริการ

**ตาราง:** `service_category` · `service` · `branch_service` · `booking_service` · `service_assignment` · `employee_service_skill`
**DDL:** `db/schema/060_e_services.sql` · **Rules:** R4 สาขาตรงกัน, R5 ต้องมี skill, R6 live assignment 1 แถว — [[physical-design]]

## การตัดสินใจหลัก (จาก [[er-design]])
`SERVICE` เป็น master ตัวเดียว ไม่แยกของพนักงาน/ลูกค้า แล้วแตกตามบทบาท:

| เชื่อมกับ | ผ่าน | เก็บอะไร |
|---|---|---|
| BRANCH | `branch_service` | ราคาสาขา, เปิดขายไหม, เวลาเปิด–ปิด |
| CUSTOMER | `booking` → `booking_service` | จำนวน, ราคา ณ วันสั่ง (snapshot), เวลานัด, สถานะ |
| EMPLOYEE | `employee_service_skill` | ใครทำอะไรเป็น + ระดับ |
| EMPLOYEE | `service_assignment` | ใครลงมือทำ order ไหน — **append-only history** |

เปลี่ยนคนทำ = UPDATE แถวเดิมเป็น `REASSIGNED` แล้ว INSERT แถวใหม่ (ทำใน `withTx` เดียวกัน) — ห้าม update `employee_id` ทับ

## หน้าจอ
| path | สถานะ | permission |
|---|---|---|
| `/services` | ✅ catalog: services + categories CRUD (แก้ได้เฉพาะ account ระดับเครือ) | `SERVICE_VIEW` / `SERVICE_MANAGE` |
| `/branch-services` | ✅ ราคาสาขา, เปิด/ปิดขาย (switch), เวลาเปิด, เพิ่ม/ลบ | 〃 |
| `/service-orders` | ✅ list/filter, สั่ง (และจากหน้า booking), schedule, start, complete, cancel, assign/reassign | `SERVICE_VIEW` / `SERVICE_ORDER_MANAGE` (+ `ASSIGNMENT_MANAGE` สำหรับ assign) |
| `/assignments` | ✅ คิวที่รอคน, คะแนนคุณภาพต่อพนักงาน, ประวัติ (append-only) + ให้คะแนน | `ASSIGNMENT_MANAGE` |
| `/skills` | ✅ matrix พนักงาน × บริการที่ต้องมีคนทำ | `ASSIGNMENT_MANAGE` |

## Backlog
- [x] Catalog CRUD (category + service) — 2026-10-18
- [x] Branch services: เปิด/ปิด, ราคาสาขา, เวลาเปิด
- [x] Service orders (REQUESTED → SCHEDULED → IN_PROGRESS → COMPLETED) — workflow ใน DB (R19), ยอดบริการเข้า booking ผ่าน totals trigger
- [x] Assign / reassign — dropdown แสดงเฉพาะพนักงานที่มี skill ในสาขาเดียวกัน เรียงตามระดับ + งานค้าง; reassign = แถวเดิม REASSIGNED + insert ใหม่
- [x] Skill matrix พนักงาน × service
- [x] รายงานคะแนนคุณภาพ (`quality_score`) ต่อพนักงาน (หน้า assignments)
