---
tags: [adr]
status: accepted
date: 2026-10-10
---

# ADR-002 · ใช้ Route Handlers + Next server (ไม่ใช่ static export)

## Context
[[web-project-standard]] (X-Ray Centralize pattern) บังคับ:
- `output: "export"` deploy ขึ้น IIS
- ห้ามมี `app/api` / backend ใน repo, ข้อมูลมาจาก external API เท่านั้น

แต่โปรเจกต์นี้ผู้ใช้สั่งชัดว่า **ใช้ route handler + api handler และเก็บข้อมูลใน PostgreSQL** — เป็น full-stack ในตัว

## Decision
**ไม่ทำตาม** ข้อ static export / no-backend ของ standard นั้น — รันเป็น Next server ปกติ

**ยังทำตาม** ส่วนที่เหลือ:
- feature-first: `types.ts`, `<feature>.api.ts`, `use<Feature>Data.ts`, `use<Feature>Editor.ts`, Table/Modal แยกไฟล์
- route page บางที่สุด (รับ params → เลือก component)
- SQL ไม่ปนใน component/page — อยู่ใน `db/` (schema/seed/tests) และ `app/lib/server/repos/`
- registry กลางอยู่ใน `app/lib/` (`nav.ts`, `permissions.ts`, `status.tsx`)

## Layering
```
app/api/**/route.ts      ← บาง: เรียก route() + repo
app/lib/server/http.ts   ← route(): session → permission → zod → handler → JSON / error mapping
app/lib/server/tx.ts     ← withTx(): transaction + actor สำหรับ trigger
app/lib/server/repos/    ← SQL ล้วน
```
ไฟล์ใน `app/lib/server/` ทั้งหมด `import "server-only"` — import จาก client = build error

## Consequences
- deploy ต้องมี Node runtime (`next start`) ไม่ใช่ IIS static
- `docs/04-standards/web-project-standard.md` ยังเก็บไว้เป็นต้นแบบ แต่ ADR นี้มีน้ำหนักกว่าในโปรเจกต์นี้
