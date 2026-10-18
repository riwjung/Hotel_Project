import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { changePaymentStatus, paymentStatusSchema } from "@/app/lib/server/repos/payment.repo";
import { withTx } from "@/app/lib/server/tx";

// PENDING → PAID | FAILED; the workflow and the balance cap are DB rule R17.
export const POST = route(
  { permission: "PAYMENT_MANAGE", body: paymentStatusSchema },
  async ({ session, params, body }) => {
    await withTx(session, (db) => changePaymentStatus(db, idParam(params), branchScope(session), body.toStatus));
    return { ok: true };
  },
);
