import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { createRefund, refundSchema } from "@/app/lib/server/repos/payment.repo";
import { withTx } from "@/app/lib/server/tx";

export const POST = route(
  { permission: "PAYMENT_MANAGE", body: refundSchema },
  async ({ session, params, body }) => {
    await withTx(session, (db) => createRefund(db, idParam(params), branchScope(session), session.employeeId, body));
    return Response.json({ ok: true }, { status: 201 });
  },
);
