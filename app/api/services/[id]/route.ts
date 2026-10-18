import { HttpError, idParam, requireChainScope, route } from "@/app/lib/server/http";
import { deleteService, getService, serviceInputSchema, updateService } from "@/app/lib/server/repos/service.repo";
import { withTx } from "@/app/lib/server/tx";

const notFound = () => new HttpError(404, "NOT_FOUND", "Service not found");

export const PATCH = route({ permission: "SERVICE_MANAGE", body: serviceInputSchema }, async ({ session, params, body }) => {
  requireChainScope(session, "Catalog services");
  const id = idParam(params);
  return withTx(session, async (db) => {
    if (!(await updateService(db, id, body))) throw notFound();
    return getService(db, id);
  });
});

export const DELETE = route({ permission: "SERVICE_MANAGE" }, async ({ session, params }) => {
  requireChainScope(session, "Catalog services");
  const id = idParam(params);
  await withTx(session, async (db) => {
    if (!(await deleteService(db, id))) throw notFound();
  });
  return { ok: true };
});
