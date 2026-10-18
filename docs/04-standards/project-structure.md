---
tags: [standard]
updated: 2026-10-10
---

# Project structure

```
Hotel-Project/
├── CLAUDE.md · AGENTS.md          # คำสั่งสำหรับ AI agent (AGENTS.md สร้างโดย Next — อย่าลบ block ของมัน)
├── docker-compose.yml             # postgres:17 → localhost:5433
├── .env.example → .env            # DATABASE_URL, AUTH_SECRET
├── next.config.ts                 # redirect / → /dashboard, cacheComponents OFF (ADR-005)
├── proxy.ts                       # Next 16 "middleware" — optimistic login redirect
├── db/
│   ├── schema/                    # DDL ตามลำดับ dependency + rules + totals + views
│   ├── seed/                      # master, demo (วันที่ relative กับ current_date), sync identity
│   └── tests/                     # business-rule tests (BEGIN … ROLLBACK)
├── scripts/                       # db-reset.mjs, db-test.mjs
├── app/
│   ├── layout.tsx · providers.tsx · globals.css · not-found.tsx
│   ├── login/page.tsx
│   ├── (portal)/                  # ทุกหน้าหลัง login — layout = SessionProvider + PortalShell
│   │   ├── dashboard/ branches/ rooms/   ← หน้าที่ทำแล้ว (page.tsx บาง)
│   │   └── [...slug]/             # ComingSoon สำหรับเมนู status "planned"
│   ├── api/                       # Route Handlers (บาง) → app/lib/server
│   ├── components/
│   │   ├── auth/LoginForm.tsx
│   │   └── portal/
│   │       ├── PortalShell · PortalNav · PortalHeader · nav-icons
│   │       ├── RequirePermission · ComingSoon · StatusTag · LoadError
│   │       └── <feature>/         # types.ts · <feature>.api.ts · use<Feature>Data.ts · use<Feature>Editor.ts · <Feature>Page/Table/Modal.tsx
│   └── lib/
│       ├── permissions.ts         # PermissionCode, SessionUser (ใช้ทั้ง client/server)
│       ├── nav.ts                 # registry เมนูเดียว (path, label, icon key, permission, status, tables)
│       ├── status.tsx             # palette สถานะ: label + สี + ไอคอน
│       ├── table-sort.ts          # sorter กลาง (ค่าว่างจมล่าง, numeric, workflow order)
│       ├── api-client.ts          # fetch wrapper → ApiError(message จาก server)
│       ├── auth-client.tsx        # SessionProvider, useSession(), can()
│       ├── use-api-data.ts        # hook โหลดข้อมูล + reload
│       ├── format.ts              # เงินบาท, วันที่
│       └── server/                # "server-only" ทั้งหมด
│           ├── db.ts · tx.ts · auth.ts · session-token.ts · http.ts
│           └── repos/<feature>.repo.ts   # SQL + zod input schema
└── docs/                          # Obsidian vault (ไฟล์นี้)
```

## เพิ่มหน้าจอใหม่ (recipe) — ลอก Branches
1. **DB** — ตารางมีแล้ว ถ้าต้องเพิ่ม rule ใส่ `db/schema/080_*.sql` + test ใน `db/tests/` → `npm run db:reset && npm run db:test`
2. **types** — `app/components/portal/<feature>/types.ts` (domain type + `*_STATUSES` const ให้ตรง CHECK)
3. **repo** — `app/lib/server/repos/<feature>.repo.ts` (SQL alias camelCase, รับ `scope`, zod schema สำหรับ input)
4. **route** — `app/api/<feature>/route.ts` ใช้ `route({ permission, body }, handler)`; เขียนผ่าน `withTx(session, …)`
5. **client api** — `<feature>.api.ts` เรียก `api<T>()`
6. **hooks** — `use<Feature>Data.ts` (useApiData) + `use<Feature>Editor.ts` (modal/save/delete + `App.useApp()`)
7. **UI** — `<Feature>Page.tsx` (Card + extra filters) · `<Feature>Table.tsx` · `<Feature>Modal.tsx`
8. **page** — `app/(portal)/<path>/page.tsx` = `<RequirePermission permission=…><FeaturePage/></RequirePermission>`
9. **nav** — `app/lib/nav.ts` เปลี่ยน `status: "planned"` → `"ready"`
10. **status palette** — เพิ่มใน `app/lib/status.tsx` ถ้ามีสถานะใหม่
11. **docs** — อัปเดต note ของโมดูลใน `docs/03-modules/` + checklist ใน [[ui-standard]] §8

**กติกาข้อ 3 ครั้ง:** logic เดียวกันเขียนครั้งที่ 3 → ย้ายขึ้น `app/lib/`

## ของกลางที่ย้ายขึ้นมาแล้ว (2026-10-18)
| ใช้เมื่อ | ไฟล์ |
|---|---|
| หน้า CRUD: state ของ modal + save/delete + ข้อความ | `app/lib/use-crud-editor.ts` → `useCrudEditor({ noun, label, create, update, remove, onChanged })` (แทนการเขียน `use<Feature>Editor.ts` ใหม่ทุกครั้ง) |
| filter สาขาใน `extra` ของ Card | `app/components/portal/BranchFilter.tsx` (ไม่แสดงสำหรับผู้ใช้ระดับสาขา) |
| ฟอร์มที่ผู้ใช้ระดับเครือต้องเลือกสาขา | `app/components/portal/branch/useBranchOptions.ts` |
| dropdown พนักงาน | `GET /api/employees/options` + `employeeSelectOptions()` ใน `employee/employee.api.ts` |
| parse query string ใน route | `parseQuery(req, schema)` ใน `app/lib/server/http.ts` |
| เขียนข้อมูลกลางที่ทุกสาขาใช้ร่วม (room type, amenity, service catalog) | `requireChainScope(session, "Room types")` ใน `http.ts` — ผู้จัดการสาขาที่มี permission ก็แก้ไม่ได้ (เช็ค scope ไม่ใช่ role) |
| ป้ายของรหัสที่ไม่ใช่สถานะ (`WALK_IN` → "Walk in") | `codeLabel()` ใน `app/lib/format.ts` |
