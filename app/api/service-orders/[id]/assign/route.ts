import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { assignOrder, assignSchema } from "@/app/lib/server/repos/service-order.repo";
import { withTx } from "@/app/lib/server/tx";

// Append-only: a reassignment keeps the old row as REASSIGNED (R5 skill, R6 one live, R16 branch, R19 open order).
export const POST = route({ permission: "ASSIGNMENT_MANAGE", body: assignSchema }, async ({ session, params, body }) => {
  await withTx(session, (db) => assignOrder(db, idParam(params), branchScope(session), session.employeeId, body));
  return { ok: true };
});
