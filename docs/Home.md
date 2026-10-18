---
tags: [moc]
updated: 2026-10-18
---

# Hotel AdvDB — Home

ระบบจัดการโรงแรมแบบเครือหลายสาขา (วิชา Advanced Database) · **31 ตาราง · 49 FK · 7 โมดูล**
Next.js 16 (Route Handlers) + Ant Design 6 + PostgreSQL 17 (raw SQL ผ่าน `pg`)

> เริ่มที่นี่ทุกครั้ง — ทั้งคนและ AI agent (CLAUDE.md ที่ root ชี้มาที่ไฟล์นี้)

## สถานะล่าสุด
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

ครบ 24/24 เมนู (2026-10-18) · กฎใน DB R1–R22 · 44 triggers · 3 views · 57 DB tests — ดู [[2026-10-18-session-log]]

## Standards
- [[ui-standard]] — หน้าตา (antd-only, tokens, กติกา component)
- [[web-project-standard]] — โครงโปรเจกต์ต้นแบบ (มี deviation → ADR-002)
- [[project-structure]] — ไฟล์อยู่ตรงไหน, เพิ่ม feature ใหม่ยังไง
- [[api-conventions]] — route handler, error shape, transaction

## Dev
- [[setup]] — Docker → db:reset → dev, user ทดสอบ
- [[presentation-demo]] — ขั้นตอนซ้อมและพรีเซนต์เว็บทีละหน้า
