---
tags: [module]
module: E
status: planned
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
| `/services` | ⏳ | `SERVICE_VIEW` / `SERVICE_MANAGE` |
| `/branch-services` | ⏳ | 〃 |
| `/service-orders` | ⏳ | `SERVICE_VIEW` / `SERVICE_ORDER_MANAGE` |
| `/assignments` | ⏳ | `ASSIGNMENT_MANAGE` |
| `/skills` | ⏳ | `ASSIGNMENT_MANAGE` |

## Backlog
- [ ] Catalog CRUD (category + service)
- [ ] Branch services: เปิด/ปิด, ราคาสาขา, เวลาเปิด
- [ ] Service orders board (REQUESTED → SCHEDULED → IN_PROGRESS → COMPLETED)
- [ ] Assign / reassign — dropdown แสดงเฉพาะพนักงานที่มี skill (ลด error R5)
- [ ] Skill matrix พนักงาน × service
- [ ] รายงานคะแนนคุณภาพ (`quality_score`) ต่อพนักงาน
