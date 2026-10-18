import { requireChainScope, route } from "@/app/lib/server/http";
import { createService, getService, listServices, serviceInputSchema } from "@/app/lib/server/repos/service.repo";
import { withTx } from "@/app/lib/server/tx";

export const GET = route({ permission: "SERVICE_VIEW" }, async () => listServices());

export const POST = route({ permission: "SERVICE_MANAGE", body: serviceInputSchema }, async ({ session, body }) => {
  requireChainScope(session, "Catalog services");
  const service = await withTx(session, async (db) => getService(db, await createService(db, body)));
  return Response.json(service, { status: 201 });
});
