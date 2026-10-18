import { branchScope } from "@/app/lib/server/auth";
import { HttpError, idParam, route } from "@/app/lib/server/http";
import { deleteShift, getShift, shiftInputSchema, updateShift } from "@/app/lib/server/repos/shift.repo";
import { withTx } from "@/app/lib/server/tx";

const notFound = () => new HttpError(404, "NOT_FOUND", "Shift not found");

export const PATCH = route({ permission: "SCHEDULE_MANAGE", body: shiftInputSchema }, async ({ session, params, body }) => {
  const id = idParam(params);
  const scope = branchScope(session);
  return withTx(session, async (db) => {
    if (!(await updateShift(db, id, scope, body))) throw notFound();
    return getShift(db, id, scope);
  });
});

export const DELETE = route({ permission: "SCHEDULE_MANAGE" }, async ({ session, params }) => {
  const id = idParam(params);
  await withTx(session, async (db) => {
    if (!(await deleteShift(db, id, branchScope(session)))) throw notFound();
  });
  return { ok: true };
});
