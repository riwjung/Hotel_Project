---
tags: [standard, api]
updated: 2026-10-10
---

# API conventions (Route Handlers)

## รูปแบบ handler
```ts
// app/api/branches/route.ts
export const GET = route({ permission: "BRANCH_VIEW" }, async ({ session }) =>
  listBranches(branchScope(session)),
);

export const POST = route(
  { permission: "BRANCH_MANAGE", body: branchInputSchema },   // zod — body ผ่าน validate แล้ว
  async ({ session, body }) => {
    const branch = await withTx(session, async (db) => getBranch(await createBranch(db, body), null, db));
    return Response.json(branch, { status: 201 });
  },
);
```
`route()` (`app/lib/server/http.ts`) ทำ: session → permission → parse body → handler → JSON
และจับ error ทุกชนิดแปลงเป็น `{ error: { code, message } }`

- dynamic segment: `idParam(params)` → int > 0 หรือ 400
- not found: `throw new HttpError(404, "NOT_FOUND", "Branch not found")`
- query string: parse ด้วย zod (`z.coerce.number()`) ดู `app/api/rooms/route.ts`

## Response
| กรณี | status | body |
|---|---|---|
| สำเร็จ | 200 / 201 | JSON ของข้อมูลตรง ๆ (ไม่ห่อ `data`) |
| ไม่ได้ login | 401 | `UNAUTHENTICATED` |
| ไม่มีสิทธิ์ | 403 | `FORBIDDEN` |
| body ผิด | 400 | `VALIDATION` — `"field: message"` |
| ไม่พบ | 404 | `NOT_FOUND` |
| ซ้ำ (23505) | 409 | `DUPLICATE` — `Branch code "BKK" already exists` |
| ถูกอ้างอิงอยู่ (23503) | 409 | `IN_USE` — `Cannot delete: it is still used by employee records` |
| ช่วงวันทับ (23P01) | 409 | `OVERLAP` |
| CHECK (23514) | 422 | `INVALID_VALUE` — map ชื่อ constraint ได้ใน `CHECK_MESSAGES` |
| business rule (P0001) | 422 | `BUSINESS_RULE` — **ข้อความจาก trigger ตรง ๆ** |
| DB ล่ม | 503 | `DB_UNAVAILABLE` |

UI แสดง `message` ตรง ๆ: `message.error(err instanceof Error ? err.message : "Action failed")` ([[ui-standard]] §5 Feedback)

## Transaction + actor
ทุกการเขียนผ่าน `withTx(session, fn, { statusRemark? })` (`app/lib/server/tx.ts`)
- `BEGIN` → `set_config('app.emp_id', …, true)` → fn → `COMMIT` / `ROLLBACK`
- trigger อ่าน `current_setting('app.emp_id', true)` เพื่อบันทึกว่าใครทำ (เช่น `booking_status_log`)
- `true` = transaction-local → ไม่รั่วไป request อื่นที่ใช้ connection เดียวกันใน pool

## Branch scope
`branchScope(session)` → `null` (ทั้งเครือ) หรือ `branch_id` — repo ต้องใช้เสมอ:
```sql
WHERE ($1::int IS NULL OR r.branch_id = $1)
```
และ **ห้ามให้ filter จาก query string ขยาย scope** (`const branchId = scope ?? filter.branchId`)
