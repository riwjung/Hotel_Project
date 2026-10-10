---
tags: [adr, security]
status: accepted
date: 2026-10-10
---

# ADR-004 · Staff login: JWT ใน httpOnly cookie + permission codes

## Decision
- `POST /api/auth/login` → bcrypt เทียบ `employee.password_hash` → โหลด role + `permission_code[]`
  → JWT HS256 (`AUTH_SECRET`) อายุ 8 ชม. ใน cookie `hotel_session` (httpOnly, sameSite=lax, secure ใน production)
- payload = `SessionUser` (`app/lib/permissions.ts`) — ไม่มีข้อมูลลับ
- **3 ชั้นป้องกัน**
  1. `proxy.ts` — optimistic: cookie ไม่ valid → redirect `/login?next=…` (ไม่แตะ DB)
  2. `route()` ใน `app/lib/server/http.ts` — ทุก API ตรวจ session + permission เองเสมอ (ของจริง)
  3. `RequirePermission` / `can()` ฝั่ง UI — แค่ซ่อน/แสดง 403, ไม่ใช่ security
- **Branch scope**: `branchScope(session)` → `null` = ทั้งเครือ (OWNER/CHAIN), ไม่งั้น = branch_id ของตัวเอง
  ทุก repo ที่อ่านข้อมูลรายสาขาต้องรับ scope และ filter ไม่ให้ query string ขยาย scope ได้

## ห้าม
- เช็ค `roleCode === "OWNER"` ใน component — ใช้ `can("PERMISSION_CODE")` เท่านั้น (บทเรียนจาก [[ui-standard]] §7)

## Trade-offs
- permission อยู่ใน token → เปลี่ยนสิทธิ์ role ต้อง login ใหม่ถึงมีผล; พนักงานที่ถูก RESIGNED ระหว่าง session ยังใช้ได้จนหมดอายุ
  (ถ้าต้องการ: ตรวจ `employee_status` จาก DB ใน `route()` — เพิ่ม 1 query ต่อ request)
- ลูกค้า (CUSTOMER) ยังไม่มี login — backlog ของ [[D-booking]]
