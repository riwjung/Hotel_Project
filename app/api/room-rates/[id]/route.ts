import { branchScope } from "@/app/lib/server/auth";
import { HttpError, idParam, route } from "@/app/lib/server/http";
import { deleteRate, getRate, rateInputSchema, updateRate } from "@/app/lib/server/repos/rate.repo";
import { withTx } from "@/app/lib/server/tx";

const notFound = () => new HttpError(404, "NOT_FOUND", "Rate not found");

export const PATCH = route({ permission: "RATE_MANAGE", body: rateInputSchema }, async ({ session, params, body }) => {
  const id = idParam(params);
  const scope = branchScope(session);
  return withTx(session, async (db) => {
    if (!(await updateRate(db, id, scope, body))) throw notFound();
    return getRate(db, id, scope);
  });
});

export const DELETE = route({ permission: "RATE_MANAGE" }, async ({ session, params }) => {
  const id = idParam(params);
  await withTx(session, async (db) => {
    if (!(await deleteRate(db, id, branchScope(session)))) throw notFound();
  });
  return { ok: true };
});
