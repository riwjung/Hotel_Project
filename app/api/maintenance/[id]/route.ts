import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { getMaintenance, maintenanceInputSchema, updateMaintenance } from "@/app/lib/server/repos/maintenance.repo";
import { withTx } from "@/app/lib/server/tx";

export const PATCH = route(
  { permission: "MAINTENANCE_MANAGE", body: maintenanceInputSchema },
  async ({ session, params, body }) => {
    const id = idParam(params);
    const scope = branchScope(session);
    return withTx(session, async (db) => {
      await updateMaintenance(db, id, scope, body);
      return getMaintenance(db, id, scope);
    });
  },
);
