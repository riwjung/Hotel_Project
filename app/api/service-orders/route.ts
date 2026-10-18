import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import { createOrder, getOrder, listOrders, orderFilterSchema, orderInputSchema } from "@/app/lib/server/repos/service-order.repo";
import { withTx } from "@/app/lib/server/tx";

export const GET = route({ permission: "SERVICE_VIEW" }, async ({ req, session }) =>
  listOrders(branchScope(session), parseQuery(req, orderFilterSchema)),
);

export const POST = route({ permission: "SERVICE_ORDER_MANAGE", body: orderInputSchema }, async ({ session, body }) => {
  const scope = branchScope(session);
  const order = await withTx(session, async (db) => getOrder(db, await createOrder(db, scope, body), scope));
  return Response.json(order, { status: 201 });
});
