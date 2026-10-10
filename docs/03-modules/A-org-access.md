---
tags: [module]
module: A
status: in-progress
---

# A · องค์กร & สิทธิ์เข้าถึง

**ตาราง:** `branch` · `role` · `permission` · `role_permission` · `employee`
**DDL:** `db/schema/010_a_org_access.sql` · **Rules:** R2 (role scope ↔ branch) — [[physical-design]]

owner = แถวใน `employee` ที่ role `OWNER`, `scope_level='CHAIN'`, `branch_id=NULL` — ไม่มีตาราง OWNER แยก

## หน้าจอ
| path | สถานะ | permission |
|---|---|---|
| `/branches` | ✅ CRUD เต็ม (reference pattern) | `BRANCH_VIEW` / `BRANCH_MANAGE` |
| `/employees` | ⏳ | `EMPLOYEE_VIEW` / `EMPLOYEE_MANAGE` |
| `/roles` | ⏳ | `ROLE_MANAGE` |

## API
| method | path | สถานะ |
|---|---|---|
| GET/POST | `/api/branches` | ✅ |
| GET/PATCH/DELETE | `/api/branches/:id` | ✅ |
| POST | `/api/auth/login` · `/api/auth/logout` · GET `/api/auth/me` | ✅ |

## Backlog
- [ ] Employees: list (filter สาขา/role/สถานะ), create/edit, reset password, เปลี่ยน manager
- [ ] แสดง error ของ R2 ตอนเลือก role CHAIN แล้วใส่สาขา (ข้อความมาจาก trigger อยู่แล้ว)
- [ ] Roles & Permissions: matrix role × permission (checkbox) → `role_permission`
- [ ] Branch detail: Descriptions + จำนวนห้อง/พนักงาน/booking ที่ active
- [ ] Header branch switcher สำหรับ OWNER (เลือกดูทีละสาขาทั้งแอป)
