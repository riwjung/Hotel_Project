@AGENTS.md

# Hotel AdvDB — guide for AI agents

Multi-branch hotel management system for an Advanced Database course.
Next.js 16 (App Router + Route Handlers) · Ant Design 6 · PostgreSQL 17 via raw SQL (`pg`).

**Start every session by reading `docs/Home.md`** — it is the Obsidian vault index (second brain) and links to the
ER design, physical design, ADRs, module backlogs and standards. Record decisions and handoffs there, not only in chat.

## Non-negotiables
- UI follows `docs/04-standards/ui-standard.md`: Ant Design only (no Tailwind/shadcn), tokens in `app/providers.tsx`,
  CSS Modules only where antd cannot do it. `message`/`modal` come from `App.useApp()`, never static imports.
- No antd deprecated props (v6): Drawer `size` not `width`, Space `orientation`, Alert `title`, Modal `destroyOnHidden`,
  Card `variant="outlined"`. Check the browser console for warnings before finishing a screen.
- Feature-first layout — recipe in `docs/04-standards/project-structure.md`. Copy the Branches feature
  (`app/components/portal/branch/`, `app/api/branches/`, `app/lib/server/repos/branch.repo.ts`).
- SQL lives only in `db/` and `app/lib/server/repos/`. Always parameterized. Alias columns to camelCase in SQL.
- Every route handler uses `route({ permission, body }, …)` from `app/lib/server/http.ts`; writes go through
  `withTx(session, …)` so triggers know the acting employee. Repos take `branchScope(session)`.
- Check permissions with `can("CODE")` / `RequirePermission` — never compare role codes in components.
- Status codes must match the CHECK constraints (`docs/01-design/physical-design.md`) and be rendered via
  `app/lib/status.tsx` (label + color + icon), never raw.
- Business rules belong in the database (`db/schema/080_business_rules.sql`) with a test in `db/tests/`.
- `cacheComponents` is intentionally off (ADR-005).

## Commands
```bash
npm run db:up      # postgres on localhost:5433 (Docker Desktop must be running)
npm run db:reset   # rebuild schema + seed; asserts 31 tables / 49 FKs
npm run db:test    # business-rule tests (rolled back)
npm run dev
npm run typecheck  # next typegen + tsc
npm run lint
npm run build
```
Dev logins: `owner@hotel.local`, `manager.bkk@hotel.local`, `staff.bkk@hotel.local` — password `Hotel@1234`.
