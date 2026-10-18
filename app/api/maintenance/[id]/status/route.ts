import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { changeMaintenanceStatus, maintenanceStatusSchema } from "@/app/lib/server/repos/maintenance.repo";
import { withTx } from "@/app/lib/server/tx";

// The workflow and the room status side effects are DB rule R15.
export const POST = route(
  { permission: "MAINTENANCE_MANAGE", body: maintenanceStatusSchema },
  async ({ session, params, body }) => {
    await withTx(session, (db) => changeMaintenanceStatus(db, idParam(params), branchScope(session), body));
    return { ok: true };
  },
);
