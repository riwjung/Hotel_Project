import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { checkOutBooking, checkOutSchema } from "@/app/lib/server/repos/booking-action.repo";
import { withTx } from "@/app/lib/server/tx";

export const POST = route(
  { permission: "BOOKING_MANAGE", body: checkOutSchema },
  async ({ session, params, body }) => {
    await withTx(
      session,
      (db) => checkOutBooking(db, idParam(params), branchScope(session), body),
      { statusRemark: body.remark ?? undefined },
    );
    return { ok: true };
  },
);
