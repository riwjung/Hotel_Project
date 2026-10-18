---
tags: [module]
module: A
status: done
---

# A · องค์กร & สิทธิ์เข้าถึง

**ตาราง:** `branch` · `role` · `permission` · `role_permission` · `employee`
**DDL:** `db/schema/010_a_org_access.sql` · **Rules:** R2 (role scope ↔ branch) — [[physical-design]]

owner = แถวใน `employee` ที่ role `OWNER`, `scope_level='CHAIN'`, `branch_id=NULL` — ไม่มีตาราง OWNER แยก

## หน้าจอ
| path | สถานะ | permission |
|---|---|---|
| `/branches` | ✅ CRUD + detail (ข้อมูลสาขา, ห้อง, พนักงาน, booking ที่ active) | `BRANCH_VIEW` / `BRANCH_MANAGE` |
| `/employees` | ✅ list/filter, สร้าง/แก้ (สถานะแทนการลบ), reset password | `EMPLOYEE_VIEW` / `EMPLOYEE_MANAGE` |
| `/roles` | ✅ roles CRUD + matrix role × permission (checkbox) | `ROLE_MANAGE` |

## API
| method | path | สถานะ |
|---|---|---|
| GET/POST | `/api/branches` | ✅ |
| GET/PATCH/DELETE | `/api/branches/:id` | ✅ |
| GET | `/api/branches/options` | ✅ รายการสำหรับ header switcher; ไม่ถูก working-branch scope บัง |
| POST | `/api/auth/login` · `/api/auth/logout` · GET `/api/auth/me` | ✅ |

## Backlog
- [x] Employees: list (filter สาขา/สถานะ + ค้นหา), create/edit, reset password, เปลี่ยน manager (R2b) — 2026-10-18
  - กัน privilege escalation: ให้ role ได้เฉพาะที่สิทธิ์ ⊆ สิทธิ์ของผู้ให้ (manager ตั้ง owner ไม่ได้, reset รหัสคนที่สิทธิ์สูงกว่าไม่ได้)
  - ไม่มีปุ่มลบ: booking/งาน/log อ้างถึงพนักงาน → ใช้สถานะ RESIGNED (login ไม่ได้)
- [x] แสดง error ของ R2 ตอนเลือก role CHAIN แล้วใส่สาขา (ฟอร์มปิดช่องสาขาเมื่อเลือก role ระดับเครือ)
- [x] Roles & Permissions: matrix role × permission (checkbox) → `role_permission`; R20 กันถอน ROLE_MANAGE คนสุดท้าย; มีผลเมื่อ login ใหม่ (ADR-004)
- [x] Branch detail: Descriptions + จำนวนห้อง/พนักงาน/booking ที่ active — 2026-10-18
- [x] Header branch switcher สำหรับ OWNER — เลือก working branch แล้ว API ทุกโมดูลรับ effective branch scope ฝั่ง server; manager/staff ปลอม header ข้ามสาขาไม่ได้ — 2026-10-18
