import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import { createSchedule, getWeek, scheduleInputSchema, weekFilterSchema } from "@/app/lib/server/repos/schedule.repo";
import { withTx } from "@/app/lib/server/tx";

export const GET = route({ permission: "SCHEDULE_VIEW" }, async ({ req, session }) => {
  const { branchId, from } = parseQuery(req, weekFilterSchema);
  return getWeek(branchScope(session), branchId, from);
});

// R16 (employee and shift in one branch) and R21 (no overlapping shifts) are DB rules.
export const POST = route({ permission: "SCHEDULE_MANAGE", body: scheduleInputSchema }, async ({ session, body }) => {
  const scheduleId = await withTx(session, (db) => createSchedule(db, branchScope(session), body));
  return Response.json({ scheduleId }, { status: 201 });
});
