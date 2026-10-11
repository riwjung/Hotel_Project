import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { changeBookingStatus, statusInputSchema } from "@/app/lib/server/repos/booking-action.repo";
import { withTx } from "@/app/lib/server/tx";

export const POST = route(
  { permission: "BOOKING_MANAGE", body: statusInputSchema },
  async ({ session, params, body }) => {
    await withTx(
      session,
      (db) => changeBookingStatus(db, idParam(params), branchScope(session), body.toStatus),
      { statusRemark: body.remark ?? undefined },
    );
    return { ok: true };
  },
);
