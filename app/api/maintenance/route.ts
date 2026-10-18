import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import {
  createMaintenance,
  getMaintenance,
  listMaintenance,
  maintenanceFilterSchema,
  maintenanceInputSchema,
} from "@/app/lib/server/repos/maintenance.repo";
import { withTx } from "@/app/lib/server/tx";

export const GET = route({ permission: "MAINTENANCE_VIEW" }, async ({ req, session }) =>
  listMaintenance(branchScope(session), parseQuery(req, maintenanceFilterSchema)),
);

export const POST = route(
  { permission: "MAINTENANCE_MANAGE", body: maintenanceInputSchema },
  async ({ session, body }) => {
    const scope = branchScope(session);
    const created = await withTx(session, async (db) =>
      getMaintenance(db, await createMaintenance(db, scope, session.employeeId, body), null),
    );
    return Response.json(created, { status: 201 });
  },
);
