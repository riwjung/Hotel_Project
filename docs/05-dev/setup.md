---
tags: [dev]
updated: 2026-10-10
---

# Dev setup

## ต้องมี
- Node ≥ 20.9 (เครื่องนี้ 20.12.2) · Docker Desktop · Obsidian (เปิดโฟลเดอร์ `docs/` เป็น vault)
- ไม่ต้องลง `psql` — script ใช้ `pg` ผ่าน Node

## ครั้งแรก
```bash
cp .env.example .env          # แล้วตั้ง AUTH_SECRET ใหม่ (คำสั่ง generate อยู่ในไฟล์)
npm install
# เปิด Docker Desktop ก่อน
npm run db:up                 # postgres:17 → localhost:5433 (รอจน healthy)
npm run db:reset              # schema + seed → ต้องเห็น "tables 31 ✓  FKs 49 ✓"
npm run db:test               # 20 business-rule tests
npm run dev                   # http://localhost:3000
```

> Port **5433** เพราะ 5432 ถูก container `family-js-db` ของโปรเจกต์อื่นใช้อยู่ — เปลี่ยนได้ที่ `POSTGRES_PORT` + `DATABASE_URL` ใน `.env`

## User ทดสอบ (รหัสผ่านเดียวกัน `Hotel@1234` — dev เท่านั้น)
| email | role | เห็นอะไร |
|---|---|---|
| `owner@hotel.local` | OWNER (CHAIN) | ทุกสาขา, จัดการสาขาได้ |
| `manager.bkk@hotel.local` | MANAGER (BKK) | เฉพาะ BKK, ดูสาขาได้แต่แก้ไม่ได้ |
| `staff.bkk@hotel.local` | STAFF (BKK) | งานหน้างาน — `/branches` ได้ 403 |
| `manager.cnx@…` · `manager.hkt@…` · `staff.cnx@…` · `staff.hkt@…` | ตามสาขา | |

## คำสั่ง
| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | dev server |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` (ต้อง typegen ก่อนเพราะ `PageProps`/`LayoutProps` เป็น type ที่ Next generate) |
| `npm run lint` | ESLint (Next 16 ไม่มี `next lint` แล้ว) |
| `npm run build` | production build |
| `npm run db:up` / `db:down` | เปิด/ปิด container (data อยู่ใน volume `hotel-project_hotel-pgdata`) |
| `npm run db:reset` | **ลบทุกอย่าง** แล้วสร้างใหม่จาก `db/` |
| `npm run db:test` | ทดสอบ rule (ไม่แก้ข้อมูล) |

## Obsidian
- เปิด vault ที่ `Hotel-Project/docs` (ไม่ใช่ root — กัน `node_modules` ถูก index)
- เปิด core plugin **Templates** → template อยู่ที่ `_templates/` (ตั้งไว้ใน `.obsidian/templates.json` แล้ว)
- รูปแนบลง `01-design/attachments/`
- `.obsidian/workspace*.json` ถูก gitignore (สถานะหน้าต่างต่อเครื่อง)

## ปัญหาที่เจอแล้ว
| อาการ | แก้ |
|---|---|
| `db:up` → `port is already allocated` | มี Postgres อื่นใช้ port — เปลี่ยน `POSTGRES_PORT` |
| `db:reset` → `Cannot connect` | Docker Desktop ยังไม่เปิด / container ยังไม่ healthy |
| `next build` → `Math.random()` in a Client Component | เปิด `cacheComponents` อยู่ — ดู [[ADR-005-cache-components-off]] |
| `tsc` → `Cannot find name 'PageProps'` | รัน `npm run typecheck` (มี typegen) แทน `npx tsc` ตรง ๆ |
