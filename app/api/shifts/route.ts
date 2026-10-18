import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import { createShift, getShift, listShifts, shiftFilterSchema, shiftInputSchema } from "@/app/lib/server/repos/shift.repo";
import { withTx } from "@/app/lib/server/tx";

export const GET = route({ permission: "SCHEDULE_VIEW" }, async ({ req, session }) =>
  listShifts(branchScope(session), parseQuery(req, shiftFilterSchema).branchId),
);

export const POST = route({ permission: "SCHEDULE_MANAGE", body: shiftInputSchema }, async ({ session, body }) => {
  const scope = branchScope(session);
  const shift = await withTx(session, async (db) => getShift(db, await createShift(db, scope, body), scope));
  return Response.json(shift, { status: 201 });
});
