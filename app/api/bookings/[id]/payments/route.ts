import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { paymentInputSchema, recordPayment } from "@/app/lib/server/repos/booking-action.repo";
import { withTx } from "@/app/lib/server/tx";

export const POST = route(
  { permission: "PAYMENT_MANAGE", body: paymentInputSchema },
  async ({ session, params, body }) => {
    await withTx(session, (db) =>
      recordPayment(db, idParam(params), branchScope(session), session.employeeId, body),
    );
    return { ok: true };
  },
);
