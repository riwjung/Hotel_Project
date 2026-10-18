---
tags: [plan]
date: 2026-10-18
---

# แผน 2026-10-18 · ทำโมดูลที่เหลือให้ครบ

ผู้ใช้: "ทำส่วนที่เหลือให้เสร็จก่อน แล้วค่อย trace/review ทีหลัง" → ทำครบ 18 เมนูที่ยังเป็น "soon"
แต่ละโมดูลเป็น branch แยก ซ้อนต่อจาก `feature/member-tier-rules` (merge ได้ด้วย fast-forward ทีเดียว)

| ลำดับ | branch | โมดูล | หน้าจอ | กฎใน DB ใหม่ |
|---|---|---|---|---|
| 5 | `feature/maintenance` | F | `/maintenance` + ของกลางที่ทุกหน้าใช้ | R15 ห้องที่มีงานซ่อมค้าง = MAINTENANCE · R16 คนที่ถูก assign ต้องอยู่สาขาเดียวกัน |
| 6 | `feature/finance-cx` | G | `/payments` `/promotions` `/member-tiers` `/reviews` | R14 ได้แต้มตอน check-out · R17 ยอดชำระ/คืนเงินห้ามเกิน · R18 promotion ที่ถูกใช้แล้วห้ามแก้เงื่อนไขส่วนลด |
| 7 | `feature/rooms-setup` | C | `/rooms` (CRUD + เปลี่ยนสถานะ) `/room-types` `/amenities` `/room-rates` | R11c ลด capacity ไม่ได้ถ้า booking ที่ active จะเกิน |
| 8 | `feature/services` | E | `/services` `/branch-services` `/service-orders` `/assignments` `/skills` + สั่งบริการจากหน้า booking | R19 workflow ของ order + ต้องมีคนรับงานก่อนเริ่ม + assignment ตาม order |
| 9 | `feature/org-access` | A | `/employees` `/roles` | R20 ต้องมี role ที่ยังถือ ROLE_MANAGE เสมอ |
| 10 | `feature/workforce` | B | `/shifts` `/schedules` `/attendance` + รายงานรายเดือน | R21 กะของพนักงานห้ามทับเวลา · R22 สถานะลงเวลาคำนวณจากเวลาจริง + view `v_attendance_monthly` |

## ของกลาง (ทำครั้งเดียวใช้ทุกหน้า — กติกา "ครั้งที่ 3 ย้ายขึ้น lib")
- `app/lib/use-crud-editor.ts` — state modal + save/delete (Branch/Customer editor ซ้ำกันแล้ว 2 ครั้ง)
- `app/components/portal/BranchFilter.tsx` — Select สาขาสำหรับผู้ใช้ระดับเครือ (ซ้ำแล้ว 3 หน้า)
- `parseQuery()` ใน `http.ts` — zod parse query string (ซ้ำแล้ว 4 route)
- `GET /api/employees/options` — รายชื่อพนักงานในสาขา (ใช้ใน maintenance, assignment, skill, schedule)
- palette สถานะที่เหลือทั้งหมดใน `status.tsx` (ตรงกับ CHECK ใน [[physical-design]])

## เกณฑ์รับงาน (ต่อหน้า)
- typecheck / lint / build ผ่าน · `db:test` ผ่าน (มี test ทุกกฎใหม่)
- headless Chrome: OWNER / MANAGER / STAFF, ไม่มี console warning, 375px ไม่มี scroll แนวนอน,
  role ที่ไม่มีสิทธิ์เห็น 403 (หน้า) และได้ 403 (API)
- อย่างน้อย 1 flow ต่อโมดูลกดผ่าน UI จริง (กันบั๊กแบบ check-in ที่ API ผ่านแต่ฟอร์มพัง)

## นอกขอบเขต (ไม่ทำรอบนี้)
- รูปห้อง (`room_image`) upload / แนบสลิป — ยังไม่มีที่เก็บไฟล์
- เว็บฝั่งลูกค้า + login ลูกค้า
- ข้อความตอบรีวิว — ตาราง `review` มีแค่ `reply_by_emp_id` (ไม่มีคอลัมน์ข้อความ) จึงบันทึกเป็น "ผู้ดูแลรีวิว" แทน
