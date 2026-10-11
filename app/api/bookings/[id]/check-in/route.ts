import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { checkInBooking, checkInSchema } from "@/app/lib/server/repos/booking-action.repo";
import { withTx } from "@/app/lib/server/tx";

export const POST = route(
  { permission: "BOOKING_MANAGE", body: checkInSchema },
  async ({ session, params, body }) => {
    await withTx(session, (db) =>
      checkInBooking(db, idParam(params), branchScope(session), session.employeeId, body),
    );
    return { ok: true };
  },
);
