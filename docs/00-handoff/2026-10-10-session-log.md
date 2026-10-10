---
tags: [handoff]
date: 2026-10-10
---

# Session log 2026-10-10 — Skeleton

## เป้าหมาย
ขึ้นโครงหลักตาม [[2026-10-10-skeleton-plan]]: Next.js 16 + antd 6 + PostgreSQL, DB ครบ 31 ตาราง,
portal shell + login + หน้าตัวอย่าง, Obsidian vault ที่ `docs/`

## ทำแล้ว
- **Vault** — ย้าย `er-design.md` + รูป ERD + standards 2 ไฟล์เข้า `docs/`, เขียน [[Home]], [[physical-design]], ADR 5 ข้อ, module note 7 ไฟล์, [[setup]], [[project-structure]], [[api-conventions]], templates
- **DB** (`db/`) — DDL 31 ตาราง / 49 FK, business rules R1–R10, totals triggers, 2 views, seed ทุกตาราง (318 rows, วันที่ relative), 20 tests
- **Server** — `pg` pool, `withTx` (actor → trigger), JWT session, `route()` wrapper + map Postgres error → ข้อความคนอ่านได้, repos auth/branch/room/dashboard
- **API** — `/api/auth/{login,logout,me}`, `/api/dashboard`, `/api/branches` (+`/:id` CRUD), `/api/rooms`
- **UI** — theme/tokens ตาม ui-standard, Layout+Sider (มือถือ = Drawer), เมนูจาก `nav.ts` กรองตาม permission,
  Login, Dashboard (metric grid + ตารางรายสาขา), Branches (CRUD เต็ม — reference pattern), Rooms (read-only + filter + legend),
  ComingSoon สำหรับ 21 เมนูที่ยังไม่ทำ, 403/404
- `CLAUDE.md` ที่ root ชี้มาที่ vault · `git init` (ยังไม่ commit)

## Verify (ผลจริง)
| ตรวจอะไร | ผล |
|---|---|
| `npm run db:reset` | ✅ tables 31 ✓ · FKs 49 ✓ · 14 triggers · 2 views · ทุกตารางมีข้อมูล |
| `npm run db:test` | ✅ 20 passed (overlap, branch mismatch, skill, workflow, promotion, audit actor, totals) |
| `npm run typecheck` / `lint` / `build` | ✅ ผ่านทั้งหมด (build 34 pages) |
| API ด้วย curl | ✅ 401/403/404/409/400 ถูกต้อง; manager/staff ถูกจำกัดสาขา แม้ส่ง `?branchId=` อื่นมา |
| Headless Chrome (puppeteer-core) 18 checks | ✅ login redirect + `?next=`, CRUD/confirm/ข้อความ server, 403 staff, เมนูซ่อน, ComingSoon, 404, 375px ไม่มี scroll แนวนอน + Drawer |
| Browser console | ✅ ไม่มี antd deprecation warning (มีแค่ 409/404 ที่ตั้งใจยิงในเทส) |

## เบี่ยงจากแผน
1. **Postgres port 5433** แทน 5432 — 5432 ถูก container `family-js-db` (โปรเจกต์อื่น) ใช้อยู่ ไม่ได้แตะ container นั้น
2. **ปิด `cacheComponents`** — `@ant-design/nextjs-registry` ใช้ `Math.random()` ตอน render → build พัง → [[ADR-005-cache-components-off]]
3. **Session โหลดฝั่ง client** (`/api/auth/me`) แทนอ่าน cookie ใน `(portal)/layout.tsx` — ออกแบบตอนยังเปิด cacheComponents, ยังเหมาะอยู่
4. ไม่มี `app/page.tsx` — ใช้ `redirects()` ใน `next.config.ts` (`/` → `/dashboard`)
5. `npm run typecheck` = `next typegen && tsc` (type `PageProps`/`LayoutProps` ต้อง generate ก่อน)
6. เพิ่ม rule นอกแผน: R7 status workflow, R8 promotion validity, R10 review หลัง check-out, rate/room-type ต้องตรงกัน
7. Dashboard รวม "Available rooms" เข้า caption ของ Occupancy (6 การ์ด = 1 แถวบนจอใหญ่)

## หมายเหตุ
- `npm audit` แจ้ง 5 high ใน chain ของ `eslint-config-next` (braces/micromatch, dev-only) — fix แบบ `--force` จะ downgrade เป็น v14 จึงไม่ทำ
- มี `package-lock.json` หลงอยู่ที่ `C:\Users\sawettachats\` (นอกโปรเจกต์) ทำให้ Turbopack เตือน — ตั้ง `turbopack.root` แล้ว, ไม่ได้ลบไฟล์นั้น

## ต่อไป
- [ ] commit แรก (รอผู้ใช้สั่ง)
- [ ] [[D-booking]] — Bookings list (`v_booking_overview`) → detail → create → check-in/out ← สำคัญที่สุดของวิชา
- [ ] [[A-org-access]] — Employees
- [ ] [[C-rooms]] — Room types / rates (โชว์ EXCLUDE constraint)
- [ ] ตัดสินใจส่วนลด member tier ([[ADR-003-stored-totals-with-triggers]] › Open)
