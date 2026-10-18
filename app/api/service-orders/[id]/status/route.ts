import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { changeOrderStatus, orderStatusSchema } from "@/app/lib/server/repos/service-order.repo";
import { withTx } from "@/app/lib/server/tx";

// Workflow, "needs someone assigned" and the assignment sync are DB rule R19.
export const POST = route({ permission: "SERVICE_ORDER_MANAGE", body: orderStatusSchema }, async ({ session, params, body }) => {
  await withTx(session, (db) => changeOrderStatus(db, idParam(params), branchScope(session), body));
  return { ok: true };
});
