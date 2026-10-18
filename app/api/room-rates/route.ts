import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import { createRate, getRate, listRates, rateFilterSchema, rateInputSchema } from "@/app/lib/server/repos/rate.repo";
import { withTx } from "@/app/lib/server/tx";

export const GET = route({ permission: "RATE_MANAGE" }, async ({ req, session }) =>
  listRates(branchScope(session), parseQuery(req, rateFilterSchema)),
);

export const POST = route({ permission: "RATE_MANAGE", body: rateInputSchema }, async ({ session, body }) => {
  const scope = branchScope(session);
  const rate = await withTx(session, async (db) => getRate(db, await createRate(db, scope, body), scope));
  return Response.json(rate, { status: 201 });
});
