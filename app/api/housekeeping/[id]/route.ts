import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { housekeepingUpdateSchema, updateHousekeepingStatus } from "@/app/lib/server/repos/housekeeping.repo";
import { withTx } from "@/app/lib/server/tx";

export const PATCH = route(
  { permission: "HOUSEKEEPING_MANAGE", body: housekeepingUpdateSchema },
  async ({ session, params, body }) => {
    await withTx(session, (db) =>
      updateHousekeepingStatus(db, idParam(params), branchScope(session), session.employeeId, body.toStatus),
    );
    return { ok: true };
  },
);
