---
tags: [handoff]
date: 2026-10-11
to: Codex
from: Claude Code
---

# Handoff to Codex: Hotel AdvDB (state as of 2026-10-11)

You are continuing a multi-branch **hotel management system** built for an **Advanced Database** university course.
The skeleton is done and verified. Your job is to build out the remaining feature modules, starting with **D · Booking**.

Read this file fully before you change anything. It is self-contained. Deeper detail lives in the Obsidian vault at `docs/`.
Start from `docs/Home.md`.

---

## 1. What the project is

- **Domain:** a hotel chain with 3 branches (BKK, CNX, HKT). There are 3 staff roles: OWNER (whole chain), MANAGER and STAFF (one branch each).
- **Course focus:** the database matters more than the UI. Graders look at the SQL: constraints, triggers, views, the normalization rationale and transactions.
- **Source of truth for the data model:** `docs/01-design/er-design.md` and `docs/01-design/attachments/hotel-erd-full-schema.png`. It has 31 tables, 49 foreign keys and 7 modules (A to G). Do not add or remove tables or FKs without the user's approval. `npm run db:reset` asserts both counts.

| Layer | Choice |
|---|---|
| Web | Next.js **16.4.0** App Router with **Route Handlers** (`app/api/**/route.ts`), React 19.3 |
| UI | **Ant Design 6.6.5 only.** No Tailwind or shadcn. CSS Modules only where antd cannot do the job |
| DB | PostgreSQL **17** in Docker Compose, accessed with **raw SQL via `pg`** (no ORM) |
| Validation and auth | zod 4, jose (JWT HS256 in an httpOnly cookie), bcryptjs |

Repository: `https://github.com/riwjung/Hotel_Project.git`, branch `main`. The user's commit `d67dd49 Initial commit` contains the skeleton.

---

## 2. Current state (verified 2026-10-11)

| Check | Result |
|---|---|
| `npm run db:reset` | ✅ 31 tables ✓, 49 FKs ✓, 14 triggers, 2 views, 318 seed rows, every table has data |
| `npm run db:test` | ✅ 20/20. It also passes with every booking shifted 3 days, so it does not depend on the seed date |
| `npm run typecheck` / `npm run lint` | ✅ |
| `npm run build` (last run 2026-10-10) | ✅ 34 pages |
| API (curl) and headless Chrome UI checks (2026-10-10) | ✅ 18/18 UI checks pass. No antd deprecation warnings in the console |

**Uncommitted changes at handoff.** The user decides when to commit.
- `db/tests/business_rules.test.sql`: three R3 tests used `current_date`, which broke once a day had passed since the seed. They now anchor on the dates of the seeded BK-0001 and BK-0002 bookings.
- This handoff file, plus a pointer section added to `AGENTS.md`.

### Built
| Area | Status |
|---|---|
| DB: all 31 tables, business rules R1 to R10, totals triggers, 2 views, seed, tests | ✅ complete for **all** modules |
| Auth: login, logout, `/api/auth/me`, `proxy.ts` redirect, permission codes, branch scoping | ✅ |
| Portal shell: Sider (a Drawer on mobile), permission-filtered menu, header with user and branch, 403/404 pages | ✅ |
| **Dashboard** (`/dashboard`): metric grid and per-branch table from `v_dashboard_branch_today` | ✅ |
| **Branches** (`/branches`): full CRUD. **This is the reference pattern to copy** | ✅ |
| **Rooms** (`/rooms`): read-only list with branch/status filters and a status legend | ✅ |
| 21 other menu items | ⏳ They render a "ComingSoon" page through the catch-all route `app/(portal)/[...slug]` |

---

## 3. Run it

**Environment:** Windows 10, PowerShell plus Git Bash, Node 20.12.2 (Next 16 needs ≥ 20.9), Docker Desktop.

```bash
cp .env.example .env        # set AUTH_SECRET (the generate command is inside the file)
npm install
npm run db:up               # postgres:17 on localhost:5433 (Docker Desktop must be running)
npm run db:reset            # DROPS EVERYTHING, rebuilds from db/, asserts 31 tables / 49 FKs
npm run db:test             # 20 business-rule tests, run inside BEGIN … ROLLBACK
npm run dev                 # http://localhost:3000
npm run typecheck           # next typegen && tsc --noEmit
npm run lint                # eslint (Next 16 removed `next lint`)
npm run build
```

- **The port is 5433, not 5432.** On the user's machine, 5432 belongs to another project's container (`family-js-db`). Do not stop or modify that container.
- **No Docker in your sandbox?** Any PostgreSQL 17 with the `btree_gist` extension works. Point `DATABASE_URL` at it.
- **Dev logins** all use the password `Hotel@1234`:
  - `owner@hotel.local` is OWNER and sees every branch.
  - `manager.bkk@hotel.local` is MANAGER for BKK.
  - `staff.bkk@hotel.local` is STAFF for BKK and gets a 403 on `/branches`.
  - `manager.cnx@…`, `manager.hkt@…`, `staff.cnx@…` and `staff.hkt@…` follow the same pattern.

---

## 4. Code map

```
db/schema/        000_reset · 010_a … 075_g (DDL in FK order) · 080_business_rules · 085_totals_triggers · 090_views
db/seed/          100_master · 110_demo (dates relative to current_date at reset time) · 190_sync_identity
db/tests/         business_rules.test.sql
scripts/          db-reset.mjs · db-test.mjs          (use pg directly; psql is not needed)
proxy.ts          Next 16's replacement for middleware: optimistic login redirect only
app/
  (portal)/layout.tsx           SessionProvider + PortalShell (static; session loaded client-side)
  (portal)/{dashboard,branches,rooms}/page.tsx   thin: <RequirePermission><FeaturePage/></RequirePermission>
  (portal)/[...slug]/page.tsx   ComingSoon for nav items with status "planned"
  api/…/route.ts                thin; call route() + repo
  components/portal/            PortalShell, PortalNav, PortalHeader, RequirePermission, ComingSoon, StatusTag, LoadError
  components/portal/<feature>/  types.ts · <feature>.api.ts · use<Feature>Data.ts · use<Feature>Editor.ts · <Feature>Page/Table/Modal.tsx
  lib/permissions.ts            PermissionCode union + SessionUser (shared by client and server)
  lib/nav.ts                    THE menu registry (path, label, icon key, permission, status, tables)
  lib/status.tsx                status palettes: code → { label, color, icon }
  lib/table-sort.ts             sortText / sortNumber / sortDate / sortByOrder (empty values always last)
  lib/api-client.ts             api<T>() → throws ApiError carrying the server's user-facing message
  lib/auth-client.tsx           SessionProvider, useSession(), can()
  lib/use-api-data.ts           load + reload hook (useEffectEvent, AbortController)
  lib/server/                   every file starts with `import "server-only"`
    db.ts                       Pool singleton + pg type parsers
    tx.ts                       withTx(session, fn, { statusRemark })
    auth.ts                     getSession, startSession, endSession, branchScope
    session-token.ts            jose sign/verify (also used by proxy.ts)
    http.ts                     route(), HttpError, parseBody, idParam, Postgres error → HTTP mapping
    repos/*.repo.ts             all SQL + the zod input schemas
docs/                           Obsidian vault (Home.md, ADRs, module backlogs, standards)
```

---

## 5. Rules you must follow

1. **UI standard:** `docs/04-standards/ui-standard.md`. Key points:
   - Cards use `variant="outlined"`. A card that holds a table uses `styles={{ body: { padding: 0 } }}`, with filters in `extra`.
   - Tables: `rowKey`, `size="middle"`, `scroll={{ x: "max-content" }}`, `pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}`.
   - **Every sortable column gets a sorter from `table-sort.ts`.** Action columns are `fixed: "right"`, and buttons inside a row call `e.stopPropagation()`.
   - Forms: `layout="vertical"`. In a Modal with `destroyOnHidden`, use `preserve={false}` and never call `form.resetFields()`. Prefill through `initialValues`, never `setFieldsValue` before the modal opens.
   - Irreversible actions go through `modal.confirm` with `okButtonProps={{ danger: true }}` and a message that states the consequence. Never use Popconfirm.
   - Feedback comes from `App.useApp()` (`message`, `modal`), never a static `import { message }`. Errors show the server message: `message.error(err instanceof Error ? err.message : "…")`.
   - Page states: no permission → `<Result status="403">`; empty → `<Empty>` that explains how to get data; loading → the `loading` prop; load error → `<LoadError>` (an inline Alert), not just a toast.
   - All user-facing text is in **English**. `ConfigProvider` uses `locale={enUS}`.
2. **antd v6 deprecations.** Using any of these prints a console warning:
   - Drawer `width` → `size`
   - Space `direction` → `orientation`, `split` → `separator`
   - Alert `message` → `title`
   - Modal/Drawer `destroyOnClose` → `destroyOnHidden`
   - Card `bordered` → `variant`
   - Tag `bordered={false}` → `variant="filled"`
   - Button `iconPosition` → `iconPlacement`
   - Statistic `valueStyle` → `styles.content`
   - Descriptions: use `items` and `styles.label`
   - Do not use `<List>` (deprecated in v6).
3. **`@ant-design/icons` has no `"use client"` directive.** Render icons only inside client components. This is why `nav.ts` stores icon *keys* and `nav-icons.tsx` maps them to components.
4. **Every API handler uses `route({ permission, body }, handler)`.** **Every write goes through `withTx(session, …)`**. That call sets `app.emp_id` so triggers can record who acted.
5. **Branch scope:**
   - Every repo that reads branch data takes `branchScope(session)`. It returns `null` for the whole chain, otherwise a branch id.
   - In SQL: `WHERE ($1::int IS NULL OR x.branch_id = $1)`.
   - A query-string filter must never widen the scope: `const branchId = scope ?? filter.branchId`.
6. **Permissions:** check them with `can("CODE")` or `<RequirePermission>`. **Never compare `roleCode` in components.** Codes live in `app/lib/permissions.ts` and must match `db/seed/100_master.sql`.
7. **SQL:**
   - SQL lives only in `db/` and `app/lib/server/repos/`. Always parameterize (`$1`), never concatenate strings.
   - Alias columns to camelCase in SQL (`booking_code AS "bookingCode"`). The client then needs no adapter.
   - Keep feature types in `app/components/portal/<feature>/types.ts`.
8. **Business rules belong in the database:**
   - Put new rules in `db/schema/080_business_rules.sql`. Raise them with `RAISE EXCEPTION 'message for end users'` (SQLSTATE P0001). `http.ts` returns that text verbatim as a 422.
   - Add a test case to `db/tests/business_rules.test.sql` using the existing PASS/FAIL pattern.
   - Anchor test dates on seeded rows, not `current_date`.
9. **Status codes:**
   - CHECK constraints are the source of truth (full table in `docs/01-design/physical-design.md`).
   - The TypeScript `*_STATUSES` constants and the `status.tsx` palettes must match them.
   - Render statuses with `<StatusTag>` (label, color and icon). Never show a raw code.
   - Palettes exist only for branch, room and booking so far. Add others when you build their screens.
10. **Totals are owned by triggers (ADR-003).** Never write these from the app: `night_count`, `subtotal`, `room_total`, `service_total`, `discount_amount`, `grand_total`. `price_per_night` and `unit_price` are snapshots; omit them on insert and the trigger copies the current price.
11. **Reassigning a service is append-only:** set the old `service_assignment` row to `REASSIGNED`, then insert a new row in the same `withTx`. Never update `employee_id` in place.
12. Keep `route.ts` and `page.tsx` thin. If you write the same logic a third time, move it into `app/lib/`.

---

## 6. Gotchas already hit (don't repeat them)

| Gotcha | Detail |
|---|---|
| Next 16 is not the Next you know | Read `node_modules/next/dist/docs/` before using an unfamiliar API (`AGENTS.md` says the same). Middleware is now **`proxy.ts`**. Route/page `params` is a **Promise**. Use `RouteContext` / `PageProps` / `LayoutProps` |
| `PageProps` / `LayoutProps` not found | They are generated types. Run `npm run typecheck`, which runs `next typegen` first, not bare `tsc` |
| `cacheComponents` must stay **off** | `@ant-design/nextjs-registry` calls `Math.random()` during render and the build fails at prerender. See `docs/02-decisions/ADR-005-cache-components-off.md` |
| The catch-all serves "planned" pages through `generateStaticParams` | When you build a real page for a nav item, **flip its `status` to `"ready"` in `app/lib/nav.ts`** in the same change. Otherwise the catch-all keeps prerendering that path alongside your new route and the menu keeps its "soon" tag (the build behaviour of that overlap is untested) |
| `pg` type parsing | NUMERIC and INT8 come back as `number`. DATE comes back as a `'YYYY-MM-DD'` string on purpose, to avoid timezone day shifts. TIME is a string, so format it with `to_char(t, 'HH24:MI')` in SQL |
| Seed dates are relative to the day of `db:reset` | The dashboard's "today" numbers drift on later days. Run `npm run db:reset` to re-anchor them. Tests anchor on seeded bookings |
| Login and logout use `window.location.assign` | Intentional full reload so no stale user state survives. The eslint rule is suppressed with a comment at both places |
| Editing SQL from a JS script | `String.replace(str, "…$$…")` turns `$$` into `$` and breaks PL/pgSQL bodies. Use a function replacement or plain file edits |
| A stray `package-lock.json` in the user's home folder | Handled with `turbopack.root` in `next.config.ts`. Do not delete that file |
| `npm audit`: 5 high | All inside `eslint-config-next`'s dev tooling. `npm audit fix --force` would downgrade it to v14, so don't |

---

## 7. Recipe: add a screen (copy Branches)

1. **DB:** the tables already exist. Add any new rule and its test, then run `npm run db:reset && npm run db:test`.
2. **Types:** `app/components/portal/<feature>/types.ts`. Add the domain type and a `*_STATUSES` const that matches the CHECK constraint.
3. **Repo:** `app/lib/server/repos/<feature>.repo.ts`. SQL with camelCase aliases, a `scope` parameter, and the zod input schema.
4. **Route:** `app/api/<feature>/route.ts` (and `[id]/route.ts`) using `route()`. Writes go through `withTx`.
5. **Client API:** `<feature>.api.ts` calls `api<T>()`.
6. **Hooks:** `use<Feature>Data.ts` (wraps `useApiData`) and `use<Feature>Editor.ts` (modal state, save, delete via `App.useApp()`).
7. **UI:** `<Feature>Page.tsx` (Card plus filters in `extra`), `<Feature>Table.tsx`, `<Feature>Modal.tsx`.
8. **Page:** `app/(portal)/<path>/page.tsx` renders `<RequirePermission permission="…"><FeaturePage/></RequirePermission>` and sets `metadata.title`.
9. **Nav:** set the item's `status: "ready"` in `app/lib/nav.ts`.
10. **Status palette:** add one in `app/lib/status.tsx` if the feature has statuses.
11. **Docs:** tick the backlog in `docs/03-modules/<X>.md` and update the status table in `docs/Home.md`.

---

## 8. Next work, in priority order

### Task 1 · D · Bookings list (`/bookings`) ← start here
- **API:** `GET /api/bookings?branchId=&status=&from=&to=&q=`. Requires `BOOKING_VIEW` and applies the branch scope.
- **Source:** the existing view `v_booking_overview`. Its columns are `booking_id`, `booking_code`, `branch_id`, `branch_code`, `customer_id`, `customer_name`, `tier_name`, `check_in_date`, `check_out_date`, `nights`, `guest_count`, `room_count`, `grand_total`, `paid_total`, `booking_channel` and `booking_status`.
- **Filters:**
  - `from`/`to` match stays that overlap the range.
  - `q` matches `booking_code` or `customer_name` with ILIKE.
  - Validate all of them with zod, as in `app/api/rooms/route.ts`.
- **UI:**
  - Table columns: code, customer (with tier), branch (shown only for chain-wide users), stay dates, nights, rooms, guests, grand total, balance (`grand_total − paid_total`), channel, status.
  - Sort the status column with `sortByOrder` over `Object.keys(BOOKING_STATUS)`; that palette already exists.
  - Use `formatMoney` and `formatDate` from `app/lib/format.ts`.
  - Clicking a row opens the detail page.
- **Done when:**
  - Owner sees all 7 seeded bookings and staff.bkk sees only BKK.
  - Every column sorts.
  - Filters are combinable.
  - At 375px wide the page has no horizontal scroll at body level.

### Task 2 · D · Booking detail (`/bookings/[id]`)
- **API:** `GET /api/bookings/:id` returns the header plus rooms (`booking_room` joined to `room` and `room_rate`), guests, services (`booking_service` joined to `branch_service` and `service`), payments, and the timeline from `booking_status_log` with the employee's name. Return 404 if the booking is outside the caller's scope.
- **UI:** a `Descriptions` block (`column={{ xs: 1, sm: 2, lg: 3 }}`, bordered, small), cards for rooms, guests, services and payments, and an antd `Timeline` for the status log.

### Task 3 · D · Status actions
- **API:** `POST /api/bookings/:id/status { toStatus, remark? }` with `BOOKING_MANAGE`, implemented as:
  ```ts
  withTx(session, db => db.query("UPDATE booking SET booking_status=$2 WHERE booking_id=$1", [id, toStatus]), { statusRemark: remark })
  ```
  Trigger R7 validates the transition and returns a 422 with a readable message. R9 writes the log with the actor.
- **Check-in** (same transaction):
  - Set `booking_room.actual_check_in = now()`, `checkin_by_emp_id`, `key_card_no`.
  - Insert guests; one primary guest per room is enforced by a unique index.
  - Set `room.room_status = 'OCCUPIED'`.
- **Check-out:**
  - Set `actual_check_out = now()`.
  - Set `room_status = 'CLEANING'`.
  - Insert a `housekeeping_task` (`CHECKOUT_CLEAN`).
- **Cancel / No-show:** `modal.confirm`, danger.
- **Show only the buttons valid for the current status.** The DB re-checks them anyway.

### Task 4 · D · Create booking
- **Steps:** pick a customer → choose dates and branch → pick from **available rooms** → choose the rate → optionally a promotion code.
- **Available rooms:** rooms in the branch with no `booking_room` in an active booking (not CANCELLED or NO_SHOW) whose `[in, out)` overlaps the chosen range. Rule R3 still guards against races.
- **Write:** insert the booking and its rooms in one `withTx`. Omit the price columns; triggers fill them. R8 rejects an invalid promotion with a readable message.

### Then, roughly in this order (backlogs live in `docs/03-modules/*.md`)
- **A:** Employees CRUD; a Roles × Permissions matrix.
- **C:** Room types with an amenity picker; Room rates (shows off the EXCLUDE constraint, error 23P01); room create/edit.
- **D:** Customers CRUD.
- **F:** Housekeeping board; Maintenance requests.
- **E:** Service catalog, branch services, service orders, assignment/reassignment, skill matrix.
- **G:** Payments (balance, refunds), Promotions, Member tiers, Reviews (moderate and reply).
- **B:** Shifts, weekly schedule grid, attendance.

---

## 9. Open decisions: ask the user, don't guess
1. **Member-tier discount:** `discount_amount` currently includes only the promotion. Should the tier discount stack with it? (ADR-003 › Open)
2. **Customer-facing site and customer login:** out of the skeleton's scope. Should it be a separate route group `(site)`, and when?
3. **Payment slip uploads (`slip_url`):** local `public/uploads` or object storage?
4. **Rules not enforced yet:** `room_rate.min_nights`, guest count ≤ `room_type.capacity`, assignee in the same branch as the booking, automatic room status changes. Add each to the DB or leave it to the app?

---

## 10. Definition of done (for every screen)
- [ ] `npm run typecheck`, `npm run lint` and `npm run build` pass. `npm run db:test` passes if you touched SQL.
- [ ] Open the page with DevTools: **no antd deprecation warnings** and no React errors.
- [ ] At 375px wide, no horizontal scroll at body level, and the Sider becomes a Drawer.
- [ ] Every column sorts, with empty values last.
- [ ] Every irreversible action asks for confirmation (`modal.confirm`, danger, consequence stated).
- [ ] A role without the permission gets `Result 403`, and the API returns 403 too (test both).
- [ ] Errors show the server's message. Load failures show an inline `LoadError`.
- [ ] Branch-scoped users cannot see other branches' data, even with crafted query params.
- [ ] `nav.ts` status flipped to `"ready"`. Module note and `docs/Home.md` updated.

## 11. Handoff protocol (the user's Obsidian "second brain")
The user keeps project knowledge in the `docs/` vault, which is opened in Obsidian; the vault root is `docs/`, not the repo root.
- End each session with `docs/00-handoff/<YYYY-MM-DD>-session-log.md`, following `docs/_templates/session-log.md`. Record what was done, what was **actually verified**, deviations, and next steps.
- Record decisions as `docs/02-decisions/ADR-00N-<slug>.md` (template in `docs/_templates/adr.md`).
- Link notes with `[[wikilinks]]`, keep `docs/Home.md` current, and tick backlog checkboxes in the module notes.
- **Do not commit or push unless the user asks.** The user commits themselves.
