---
tags: [moc]
updated: 2026-10-17
---

# Hotel AdvDB — Home

ระบบจัดการโรงแรมแบบเครือหลายสาขา (วิชา Advanced Database) · **31 ตาราง · 49 FK · 7 โมดูล**
Next.js 16 (Route Handlers) + Ant Design 6 + PostgreSQL 17 (raw SQL ผ่าน `pg`)

> เริ่มที่นี่ทุกครั้ง — ทั้งคนและ AI agent (CLAUDE.md ที่ root ชี้มาที่ไฟล์นี้)

## สถานะล่าสุด
- [[2026-10-17-session-log|Session log 2026-10-17]] — R11 capacity / R12 min nights, QA `/bookings` + `/housekeeping` (แก้ bug check-in), Customers CRUD, Create booking
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

## Modules
| | โมดูล | สถานะหน้าจอ |
|---|---|---|
| A | [[A-org-access]] | Branches ✅ · Employees, Roles ⏳ |
| B | [[B-workforce]] | ⏳ |
| C | [[C-rooms]] | Rooms (read-only) ✅ · ที่เหลือ ⏳ |
| D | [[D-booking]] | Booking list/detail/lifecycle ✅ · Create booking ✅ · Customers ✅ |
| E | [[E-services]] | ⏳ |
| F | [[F-operations]] | Housekeeping ✅ · Maintenance ⏳ |
| G | [[G-finance-cx]] | ⏳ |

DB ของทุกโมดูลพร้อมแล้ว (DDL + rules + seed + tests) — ที่ยังขาดคือ API + หน้าจอ

## Standards
- [[ui-standard]] — หน้าตา (antd-only, tokens, กติกา component)
- [[web-project-standard]] — โครงโปรเจกต์ต้นแบบ (มี deviation → ADR-002)
- [[project-structure]] — ไฟล์อยู่ตรงไหน, เพิ่ม feature ใหม่ยังไง
- [[api-conventions]] — route handler, error shape, transaction

## Dev
- [[setup]] — Docker → db:reset → dev, user ทดสอบ
