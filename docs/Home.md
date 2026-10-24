---
tags: [moc]
updated: 2026-10-24
---

# Hotel AdvDB — Home

ระบบจัดการโรงแรมแบบเครือหลายสาขา (วิชา Advanced Database) · **31 ตาราง · 49 FK · 7 โมดูล**
Next.js 16 (Route Handlers) + Ant Design 6 + PostgreSQL 17 (raw SQL ผ่าน `pg`)

> เริ่มที่นี่ทุกครั้ง — ทั้งคนและ AI agent (CLAUDE.md ที่ root ชี้มาที่ไฟล์นี้)

## สถานะล่าสุด
- Amenities: ไอคอนสีข้างชื่อในตาราง Rooms / Room types และรายละเอียดห้อง + คอลัมน์ Icon และตัวเลือกใช้สีเดียวกัน — ดู [[2026-10-24-session-log#Amenities icons across room tables — Codex]]
- Dashboard: สไลด์รูปใต้วันที่ เล่นอัตโนมัติทุก 5 วินาที + ลูกศรซ้าย/ขวา + หยุด/เล่น; ใช้รูป Gallery ตาม working branch — ดู [[2026-10-24-session-log#Dashboard branch photo slideshow — Codex]]
- Deck พรีเซนต์ 23 หน้า ตาม 5 หัวข้อหลัก (ที่ตั้ง · บริการ · ระบบ · จุดบอด · ER + หน้าเว็บ) + ภาพห้อง + tech stack — ดู [[2026-10-24-session-log#Deck: 5 หัวข้อหลัก — Claude]] และ [[presentation-script]]
- Gallery หน้า Room มีรูปจริงครบ 15 ห้อง (ภาพ AI ตาม [[room-image-prompts]]) — ดู [[2026-10-24-session-log#Room photos in gallery + deck tech stack — Claude]]
- [[2026-10-24-session-log|Session log 2026-10-24]] — แก้ check-in BK-0013 ไม่ได้: R11b เพิ่มขาล่าง จำนวนห้อง ≤ `guest_count` + Alert ในฟอร์ม Create booking
- ภาพสำรองเดโม/สไลด์: ยังรอเชื่อม Chrome; DB tests รอบล่าสุด 54 passed แล้วหยุด R21 เนื่องจากวันที่ fixture — ดู [[2026-10-23-session-log#Demo backup capture request]]
- แก้พื้น sidebar ให้ต่อเนื่องเต็มความสูงในหน้ายาว เช่น Attendance — ดู [[2026-10-23-session-log#Sidebar background on long pages]]
- Portal: ภาพพื้นหลังและ panorama ใต้เนื้อหาทุกหน้า + favicon โลโก้ Sand & Sky + ธีมตารางทรายทอง/งาช้าง/ฟ้าเทาร่วมทั้งระบบ; Dashboard มีการ์ดสีพาสเทล — ดู [[2026-10-23-session-log#Dashboard styling — Codex]]
- [[2026-10-23-session-log|Session log 2026-10-23]] — สไลด์ใหม่ 14 หน้าเน้นความสัมพันธ์ DB คู่เดโมสด + ผลตรวจ mock หน้าจองลูกค้า (ดู [[presentation-demo]])
- [[2026-10-18-session-log|Session log 2026-10-18]] — ครบทุกโมดูล + availability grid, room/branch detail, room gallery และ OWNER working-branch switcher; กฎ R2b, R3d, R11c, R14–R22
- [[2026-10-17-session-log|Session log 2026-10-17]] — R11 capacity / R12 min nights, QA `/bookings` + `/housekeeping` (แก้ bug check-in), Customers CRUD, Create booking, R13 tier ตามแต้ม + ส่วนลด tier ซ้อน promotion; มีประเมินความคืบหน้า %
- [[2026-10-11-session-log|Session log 2026-10-11]] — booking lifecycle + housekeeping พร้อม API integration test
- [[2026-10-11-handoff-codex|Handoff → Codex 2026-10-11]] — สรุปทั้งหมดสำหรับ agent ที่ทำต่อ (เริ่มที่ Task 1: Bookings list)
- [[2026-10-10-session-log|Session log 2026-10-10]] — skeleton เสร็จ, verify แล้ว
- [[2026-10-10-skeleton-plan|Skeleton plan]] — แผนที่อนุมัติ (มี deviation บันทึกใน session log)

## Design
- [[er-design]] — logical ER (ต้นฉบับจากผู้ใช้) · ![[hotel-erd-full-schema.png|300]]
- [[physical-design]] — Postgres types, status codes, triggers, indexes

## Decisions (ADR)
- [[ADR-001-stack]] — Next.js 16 + antd 6 + raw SQL `pg`
- [[ADR-002-route-handlers-not-static-export]] — ต่างจาก web-project-standard ตรงไหน
- [[ADR-003-stored-totals-with-triggers]] — เก็บยอดรวม + trigger
- [[ADR-004-staff-auth-jwt-cookie]] — login พนักงาน, permission
- [[ADR-005-cache-components-off]] — ปิด cacheComponents เพราะ antd registry
- [[ADR-006-member-tier-discount-and-derived-tier]] — ส่วนลด tier ซ้อน promotion (snapshot อัตรา) + tier ตามแต้มด้วย trigger

## Modules
| | โมดูล | สถานะหน้าจอ |
|---|---|---|
| A | [[A-org-access]] | Branches + detail ✅ · Employees ✅ · Roles & Permissions ✅ · Header branch switcher ✅ |
| B | [[B-workforce]] | Shifts ✅ · Work schedules ✅ · Attendance ✅ |
| C | [[C-rooms]] | Rooms CRUD/detail/gallery ✅ · Room types ✅ · Amenities ✅ · Room rates ✅ |
| D | [[D-booking]] | Booking list/detail/lifecycle ✅ · Create booking ✅ · Availability ✅ · Customers ✅ |
| E | [[E-services]] | Catalog ✅ · Branch services ✅ · Service orders ✅ · Assignments ✅ · Skills ✅ |
| F | [[F-operations]] | Housekeeping ✅ · Maintenance ✅ |
| G | [[G-finance-cx]] | Payments ✅ · Promotions ✅ · Member tiers ✅ · Reviews ✅ |

ครบ 24/24 เมนู (2026-10-18) · กฎใน DB R1–R22 · 44 triggers · 3 views · 58 DB tests (2026-10-24) — ดู [[2026-10-18-session-log]]

## Standards
- [[ui-standard]] — หน้าตา (antd-only, tokens, กติกา component)
- [[web-project-standard]] — โครงโปรเจกต์ต้นแบบ (มี deviation → ADR-002)
- [[project-structure]] — ไฟล์อยู่ตรงไหน, เพิ่ม feature ใหม่ยังไง
- [[api-conventions]] — route handler, error shape, transaction

## Dev
- [[setup]] — Docker → db:reset → dev, user ทดสอบ
- [[presentation-demo]] — ขั้นตอนซ้อมและพรีเซนต์เว็บทีละหน้า
- [[presentation-script]] — บทพูดทีละสไลด์ของ deck 23 หน้า (5 หัวข้อหลัก) + รายการภาพหน้าจอสำรอง
- [[room-image-prompts]] — prompt gen รูปห้อง 10 ชุด (สาขา × ประเภท) สำหรับ Gallery หน้า Room
