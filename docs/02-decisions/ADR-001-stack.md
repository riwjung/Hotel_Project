---
tags: [adr]
status: accepted
date: 2026-10-10
---

# ADR-001 · Stack: Next.js 16 + Ant Design 6 + PostgreSQL (raw SQL)

## Context
งาน Advanced Database ต้องโชว์ SQL ได้เต็มที่ (DDL, constraint, trigger, view, transaction)
และมีหน้าเว็บ mock ระบบโรงแรมตาม [[ui-standard]]

## Decision
| ชั้น | เลือก | เวอร์ชัน |
|---|---|---|
| Web | Next.js App Router + Route Handlers (`app/api/**/route.ts`) | 16.4.0 |
| UI | Ant Design เท่านั้น (ไม่มี Tailwind) + `@ant-design/nextjs-registry` | antd 6.6.5 |
| DB | PostgreSQL ใน Docker Compose | 17-alpine |
| DB access | **raw SQL** ผ่าน `pg` (ไม่มี ORM) | pg 8.23 |
| Validation | zod | 4.x |
| Auth | jose (JWT HS256) + bcryptjs | — |

## Why raw SQL
- อาจารย์/ผู้ตรวจเห็น SQL ทุกบรรทัด — schema, rule, query อยู่ในไฟล์ `.sql` และ repo `*.repo.ts`
- trigger / EXCLUDE / partial index เขียนเป็น SQL อยู่แล้ว ORM ไม่ช่วย
- ข้อเสีย: ไม่มี type จาก schema อัตโนมัติ → type เขียนเองใน `types.ts` ของ feature และ alias คอลัมน์ให้ตรง

## Consequences
- ทุก query ต้อง parameterized (`$1`) — ห้ามต่อ string
- เปลี่ยน schema = แก้ไฟล์ใน `db/schema/` แล้ว `npm run db:reset` (ยังไม่มี migration แบบ incremental — พอสำหรับงานวิชา)
- DB port ของโปรเจกต์นี้คือ **5433** (5432 ถูก container `family-js-db` ของโปรเจกต์อื่นใช้)
