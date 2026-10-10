# Hotel Management System — Skeleton Plan (Next.js 16 + Ant Design 6 + PostgreSQL)

## Context

งานวิชา Advanced Database: ระบบจัดการโรงแรมแบบเครือหลายสาขา **31 ตาราง · 49 FK · 7 โมดูล (A–G)**
ตาม `er-design.md` + ภาพ ERD ที่แนบมา ตอนนี้ `C:\Users\sawettachats\source\Hotel-Project` มีแค่ `er-design.md`

เป้าหมายรอบนี้ = **ขึ้นโครงหลัก** ให้ต่อยอด feature ทีละโมดูลได้ภายหลัง:
- Next.js App Router + **Route Handlers** (`app/api/**/route.ts`) → handler layer → raw SQL ผ่าน `pg`
- UI ตาม `Riw_UI_STANDARD(ChangeMmg).md` (antd v6 เท่านั้น, ไม่มี Tailwind, Layout+Sider, tokens `#2f6bff` / `#f4f6fb`)
- PostgreSQL 17 ใน Docker Compose, DDL ครบ 31 ตาราง + business rules ที่ FK บังคับไม่ได้
- `docs/` เป็น Obsidian vault (second brain) — handoff/decision/note ทั้งหมดอยู่ในนั้น

### การตัดสินใจที่ยืนยันแล้ว
| เรื่อง | เลือก |
|---|---|
| DB access | Raw SQL + `pg` (ไม่ใช้ ORM) |
| Postgres | Docker Compose `postgres:17-alpine` (ต้องเปิด Docker Desktop ก่อน — ตอนนี้ daemon ยังไม่รัน) |
| Vault | `docs/` (ย้าย `er-design.md` เข้าไป) |
| คอลัมน์คำนวณได้ | เก็บไว้ตาม diagram + trigger คำนวณให้อัตโนมัติ, บันทึกเหตุผลเป็น ADR |
| ภาษา UI | อังกฤษ + `locale={enUS}` ตาม UI standard (เปลี่ยนเป็น th_TH ทีหลังได้ทั้งระบบ) |
| ขอบเขตรอบนี้ | Staff back-office portal + staff login. หน้าลูกค้า (customer site) = backlog |

**Deviation จาก `Riw_Standard_WebProject_Skill.md`:** มาตรฐานนั้นห้าม `app/api` + บังคับ static export/IIS —
ผู้ใช้สั่งให้ใช้ route handler + Postgres โดยตรง จึงรันเป็น Next server ปกติ (ไม่มี `output: "export"`)
แต่ยังคงกติกา feature-first, route page บาง, SQL แยกไฟล์ → บันทึกเป็น ADR-002

### Environment ที่ตรวจแล้ว
Node 20.12.2 (Next 16 ต้อง ≥20.9 ✓) · npm 10.5 · git 2.47 · Docker 26.1 (daemon ปิดอยู่) · ไม่มี psql (ใช้ node script แทน)
เวอร์ชันที่จะ pin: `next@16.4.0` `antd@6.6.5` `@ant-design/icons@6.3.4` `@ant-design/nextjs-registry@1.3.0`
`pg@8.23.1` `zod@4.6.5` `jose@6.2.12` `bcryptjs@3.0.3` `dayjs@1.11.23` (+ `@types/pg`, `server-only`)

---

## โครงสร้างปลายทาง

```
Hotel-Project/
├── CLAUDE.md                     # ชี้ไป docs/Home.md + กติกาหลัก + คำสั่ง
├── docker-compose.yml  .env.example  .env (gitignored)
├── proxy.ts                      # Next 16 (แทน middleware.ts) — redirect ไป /login ถ้าไม่มี session
├── db/
│   ├── schema/   000_reset.sql · 010_a_org_access.sql · 020_b_workforce.sql · 030_c_rooms.sql
│   │             040_g_master.sql (member_tier, promotion) · 050_d_booking.sql · 060_e_services.sql
│   │             070_f_operations.sql · 075_g_transactions.sql (payment, review)
│   │             080_business_rules.sql · 085_totals_triggers.sql · 090_views.sql
│   ├── seed/     100_master.sql · 110_demo.sql
│   └── tests/    business_rules.test.sql
├── scripts/  db-reset.mjs · db-test.mjs      # ใช้ pg + `node --env-file=.env`
├── app/
│   ├── layout.tsx  providers.tsx  globals.css  page.tsx(redirect /dashboard)
│   ├── login/page.tsx
│   ├── (portal)/layout.tsx                    # server: อ่าน session → <SessionProvider><PortalShell>
│   ├── (portal)/dashboard/page.tsx  branches/page.tsx  rooms/page.tsx
│   ├── (portal)/[...slug]/page.tsx            # หน้าที่ยังไม่ทำ → <ComingSoon> จาก nav registry, ไม่อยู่ใน registry → notFound()
│   ├── api/auth/{login,logout,me}/route.ts
│   ├── api/dashboard/route.ts
│   ├── api/branches/route.ts  api/branches/[id]/route.ts
│   ├── api/rooms/route.ts
│   ├── components/
│   │   ├── auth/LoginForm.tsx
│   │   └── portal/
│   │       ├── PortalShell.tsx PortalSider.tsx PortalHeader.tsx
│   │       ├── ComingSoon.tsx RequirePermission.tsx StatusTag.tsx
│   │       ├── dashboard/  types.ts dashboard.api.ts DashboardPage.tsx dashboard.module.css
│   │       ├── branch/     types.ts branch.api.ts useBranchData.ts BranchPage.tsx BranchTable.tsx BranchModal.tsx
│   │       └── room/       types.ts room.api.ts RoomPage.tsx RoomTable.tsx
│   └── lib/
│       ├── api-client.ts table-sort.ts auth-client.ts nav.ts status.ts format.ts
│       └── server/  (ทุกไฟล์ `import "server-only"`)
│           ├── db.ts        # Pool singleton (globalThis กัน HMR), type parsers
│           ├── tx.ts        # withTx(session, fn) → BEGIN + set_config('app.emp_id') + COMMIT/ROLLBACK
│           ├── auth.ts      # jose sign/verify, cookie, getSession, requirePermission, branchScope
│           ├── http.ts      # route(opts, fn) wrapper: auth + zod + pg error → JSON
│           └── repos/       auth.repo.ts dashboard.repo.ts branch.repo.ts room.repo.ts
└── docs/   ← Obsidian vault (ดูหัวข้อ Vault)
```

---

## ขั้นตอน

### Phase 0 — Vault + handoff (ทำก่อน create-next-app เพราะ `docs/` เป็นชื่อที่ create-next-app ยอมให้มีอยู่ก่อน)
1. สร้าง `docs/` และย้าย `er-design.md` → `docs/01-design/er-design.md`
2. copy ภาพ ERD จาก temp (`...\15ca20fd-...\images\1.png`) → `docs/01-design/attachments/hotel-erd-full-schema.png`
3. copy `Desktop\Standard Skill.md\Riw_UI_STANDARD(ChangeMmg).md` → `docs/04-standards/ui-standard.md`
   และ `Riw_Standard_WebProject_Skill.md` → `docs/04-standards/web-project-standard.md`
4. copy plan นี้ → `docs/00-handoff/2026-10-10-skeleton-plan.md`

### Phase 1 — Scaffold
- `create-next-app` ใช้ชื่อโฟลเดอร์ `Hotel-Project` ไม่ได้ (npm ห้ามตัวพิมพ์ใหญ่) → generate ใน scratchpad:
  `npx create-next-app@16.4.0 hotel-project --ts --eslint --app --no-tailwind --no-src-dir --import-alias "@/*" --use-npm --skip-install --disable-git --yes`
  แล้ว copy เข้า root (ไม่ทับ `docs/`), ลบ boilerplate CSS/หน้า default
- `npm install` + deps ข้างบน, `git init` (ยังไม่ commit จนกว่าผู้ใช้สั่ง)
- scripts: `dev` `build` `start` `lint`(eslint — Next 16 ตัด `next lint` ออกแล้ว) `typecheck`(tsc --noEmit)
  `db:up`(docker compose up -d) `db:reset` `db:test`
- `.gitignore` เพิ่ม `.env`, `docs/.obsidian/workspace*.json`
- อ่าน docs ที่มากับ Next 16 ใน `node_modules/next/dist/docs/` เรื่อง Route Handlers / proxy / async `params` ก่อนเขียน

### Phase 2 — Database (physical design)
**Type mapping:** `int PK` → `integer GENERATED ALWAYS AS IDENTITY` · `datetime` → `timestamptz` · ชื่อตาราง snake_case ตัวเล็ก ·
status `varchar(20)` + `CHECK (... IN (...))` · index ทุก FK column (Postgres ไม่สร้างให้) · composite PK สำหรับ 3 ตาราง M:N

**Status codes** (ชุดเดียวกับ `app/lib/status.ts` — ห้ามให้ CHECK กับ TS ไม่ตรงกัน):
- room: `AVAILABLE OCCUPIED CLEANING MAINTENANCE OUT_OF_SERVICE`
- booking (ลำดับ workflow): `PENDING CONFIRMED CHECKED_IN CHECKED_OUT CANCELLED NO_SHOW`
- order/assignment/task/maintenance/payment/review: กำหนดใน `docs/01-design/physical-design.md` (assignment มี `REASSIGNED`)

**`080_business_rules.sql`** (ข้อ "กฎที่ FK บังคับไม่ได้" ใน ER doc + เพิ่ม):
| กฎ | กลไก |
|---|---|
| ห้องเดียวกันห้ามจองช่วงทับกัน | trigger บน `booking_room` (+ บน `booking` เมื่อเปลี่ยนวัน/สถานะ) ตรวจ `[check_in, check_out)` ซ้อนกับ booking ที่ไม่ใช่ CANCELLED/NO_SHOW, ล็อกแถว `room … FOR UPDATE` กัน race |
| `booking.branch_id` = สาขาของ room และ branch_service | trigger บน `booking_room`, `booking_service` |
| ROOM_RATE ช่วงวันห้ามทับใน (branch, room_type) | `EXCLUDE USING gist (branch_id WITH =, room_type_id WITH =, daterange(start_date,end_date,'[]') WITH &&)` (`btree_gist` ใน 000) |
| SERVICE_ASSIGNMENT ต้องมี skill | trigger ตรวจคู่ (employee, service) ใน `employee_service_skill` |
| assignment active ได้ทีละคน (เปลี่ยนคน = insert ใหม่ + เดิม REASSIGNED) | partial unique index `WHERE assignment_status NOT IN ('REASSIGNED','CANCELLED')` |
| role scope BRANCH ต้องมี branch_id, OWNER/CHAIN ต้อง NULL | trigger บน `employee` |
| audit การเปลี่ยนสถานะ booking | AFTER UPDATE OF booking_status → insert `booking_status_log`, `changed_by_emp_id = current_setting('app.emp_id', true)` ที่ API ตั้งผ่าน `withTx` |

**`085_totals_triggers.sql`:** BEFORE trigger คิด `booking_room.night_count/subtotal`, `booking_service.subtotal`;
AFTER trigger เรียก `fn_recalc_booking(booking_id)` → `room_total, service_total, discount_amount (promotion PERCENT/FIXED + minimum_amount), grand_total`
**`090_views.sql`:** `v_dashboard_today` (เช็คอิน/เอาท์วันนี้, ห้องตามสถานะ, แจ้งซ่อมค้าง ต่อสาขา)

**Seed:** 3 สาขา (BKK/CNX/HKT), role OWNER/MANAGER/STAFF, permission codes ต่อโมดูล (`BRANCH_VIEW`, `BRANCH_MANAGE`, `ROOM_VIEW`, …),
user `owner@hotel.local` / `manager.bkk@hotel.local` / `staff.bkk@hotel.local` รหัส dev `Hotel@1234` (bcrypt hash generate ตอน implement แล้วฝังใน SQL),
room types/amenities/rooms/rates, member tiers, booking ตัวอย่างไม่กี่รายการ

**`scripts/db-reset.mjs`:** รัน `db/schema/*` แล้ว `db/seed/*` ตามลำดับชื่อไฟล์ จากนั้น assert
`BASE TABLE = 31` และ `FOREIGN KEY = 49` (ตรงกับ ER doc) — ไม่ตรง = exit 1
**`scripts/db-test.mjs`:** รัน `db/tests/*.sql` — แต่ละเคสเป็น `DO $$ … EXCEPTION …` ที่ต้อง raise ตามคาด, ทั้งหมดใน transaction แล้ว ROLLBACK

### Phase 3 — Server layer
- `db.ts`: `pg.types.setTypeParser` NUMERIC(1700)/INT8(20) → number, DATE(1082) → string (กันวันเลื่อนจาก timezone)
- `auth.ts`: login → bcrypt compare → โหลด role + `permission_code[]` → JWT HS256 (`AUTH_SECRET`) ใน httpOnly cookie `hotel_session` 8 ชม.;
  `branchScope(session)` → CHAIN เห็นทุกสาขา, BRANCH เห็นแค่ `branch_id` ตัวเอง (repo ทุกตัวรับ scope)
- `http.ts`: `route({ permission, body: zodSchema }, async ({ session, body, params }) => …)`;
  error shape `{ error: { code, message } }` — map pg: `23505`→409 ซ้ำ, `23503`→409 ถูกใช้อยู่, `23P01`→409 ช่วงวันทับ, `P0001`(RAISE จาก trigger)→422 ส่งข้อความ trigger ตรง ๆ
- repos: SQL parameterized เท่านั้น, alias เป็น camelCase (`branch_code AS "branchCode"`) → client ไม่ต้องมี adapter
- route.ts บางที่สุด: parse → เรียก repo → return (Next 16: `params` เป็น Promise)

### Phase 4 — UI shell (ตาม ui-standard.md)
- `layout.tsx`: `next/font/google` Hanken_Grotesk / Fraunces / Noto_Sans_Thai เป็น CSS var + `<AntdRegistry>`
- `providers.tsx`: themeConfig ตาม §2 ของ standard, `ConfigProvider locale={enUS}` + `<App>`
- `globals.css`: tokens §3
- `PortalShell`: Layout+Sider (ยุบได้, < md เปลี่ยนเป็น Drawer), Header = ชื่อหน้า + user/role/สาขา + logout,
  Content `padding: clamp(16px,3vw,28px); minWidth: 0`
- `nav.ts` = registry เดียวของเมนู (path, label, icon, permission, module) จัดกลุ่ม:
  Dashboard · **Organization** (Branches, Employees, Roles & Permissions) · **Workforce** (Shifts, Schedules, Attendance) ·
  **Rooms** (Rooms, Room Types, Amenities, Room Rates) · **Reservations** (Bookings, Customers) ·
  **Services** (Catalog, Branch Services, Service Orders, Assignments, Skills) · **Operations** (Housekeeping, Maintenance) ·
  **Finance & CX** (Payments, Promotions, Member Tiers, Reviews)
  — Sider กรองตาม permission, catch-all page ใช้ registry เดียวกันแสดง ComingSoon (`Empty` + บอกว่าอยู่ใน backlog โมดูลไหน)
- `RequirePermission` → `<Result status="403">` + ปุ่มกลับ dashboard
- `status.ts`: code → { label, color, icon } (สี+ไอคอนเสมอ), `table-sort.ts`: ค่าว่างจมล่าง, numeric localeCompare, เรียงสถานะตามลำดับ workflow
- `api-client.ts`: fetch + throw `Error(server message)` → `message.error(err.message)`

### Phase 5 — Vertical slices อ้างอิง (pattern ให้โมดูลอื่นลอก)
1. **Dashboard** — metric grid (`.metricGrid` §4) จาก `v_dashboard_today`, loading ผ่าน Card, error = `<Alert>` คาที่
2. **Branches (CRUD เต็ม)** — Card outlined + Table (body padding 0, sorter ทุกคอลัมน์, action `fixed:right`),
   BranchModal (`layout="vertical"`, `preserve={false}`, `initialValues` ตอนแก้), ลบผ่าน `modal.confirm` danger + "This cannot be undone",
   ข้อความ 409 จาก server แสดงตรง ๆ, ต้องมี `BRANCH_MANAGE` ถึงเห็นปุ่มแก้ไข
3. **Rooms (read-only list)** — join branch/room_type, filter สาขา/สถานะใน `extra`, StatusTag, เคารพ branchScope

### Phase 6 — Vault content (`docs/`)
```
docs/
├── Home.md                         # MOC: ลิงก์ทุกหมวด + สถานะโมดูล
├── 00-handoff/  2026-10-10-skeleton-plan.md · 2026-10-10-session-log.md (ทำอะไรไป/verify อะไร/ต่อไปทำอะไร)
├── 01-design/   er-design.md · physical-design.md (type mapping, status codes, triggers, indexes) · attachments/
├── 02-decisions/ ADR-001-stack.md · ADR-002-route-handlers-not-static-export.md · ADR-003-stored-totals-with-triggers.md · ADR-004-staff-auth-jwt-cookie.md
├── 03-modules/  A-org-access.md … G-finance-cx.md   # ตาราง, หน้าจอ, endpoint, status flow, [[links]], checklist backlog
├── 04-standards/ ui-standard.md · web-project-standard.md · project-structure.md · api-conventions.md
├── 05-dev/      setup.md (Docker → db:up → db:reset → dev, seed users)
├── _templates/  adr.md · module-feature.md · session-log.md
└── .obsidian/   app.json (attachments → 01-design/attachments) · templates.json (_templates)
```
+ `CLAUDE.md` ที่ root: อ่าน `docs/Home.md` ก่อน, ยึด ui-standard, กติกา feature-first, คำสั่ง, เตือนเรื่อง Next 16 bundled docs

---

## Verification
1. เปิด Docker Desktop → `npm run db:up` → `npm run db:reset` ต้องพิมพ์ 31 tables / 49 FKs และ exit 0
2. `npm run db:test` — ทุกเคสผ่าน: จองห้องทับวัน → error, rate ทับช่วง → 23P01, สาขาไม่ตรง → error,
   assignment ไม่มี skill → error, totals คำนวณถูก, เปลี่ยน booking_status แล้วมี log พร้อม actor
3. `npm run typecheck` · `npm run lint` · `npm run build` ผ่าน
4. `npm run dev` แล้วเปิด browser (skill `run`):
   - login owner → dashboard ตัวเลขตรง seed; ยังไม่ login เข้า `/branches` → เด้งไป `/login`
   - Branches: สร้าง/แก้/ลบ (มี confirm); branch_code ซ้ำ → เห็นข้อความ 409 จาก server; ลบสาขาที่มีห้อง → ข้อความ FK
   - login staff → เมนู Branches manage หาย, หน้าที่ไม่มีสิทธิ์ → Result 403; `/employees` → ComingSoon; `/xyz` → 404
   - ย่อจอ 375px → Sider เป็น Drawer, ไม่มี horizontal scroll ที่ body; DevTools console ไม่มี antd warning
5. เขียน `docs/00-handoff/2026-10-10-session-log.md` สรุปผล verify จริง (ผ่าน/ไม่ผ่าน) + next steps
