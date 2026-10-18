import { HttpError, idParam, requireChainScope, route } from "@/app/lib/server/http";
import { categoryInputSchema, deleteCategory, getCategory, updateCategory } from "@/app/lib/server/repos/service.repo";
import { withTx } from "@/app/lib/server/tx";

const notFound = () => new HttpError(404, "NOT_FOUND", "Category not found");

export const PATCH = route({ permission: "SERVICE_MANAGE", body: categoryInputSchema }, async ({ session, params, body }) => {
  requireChainScope(session, "Service categories");
  const id = idParam(params);
  return withTx(session, async (db) => {
    if (!(await updateCategory(db, id, body))) throw notFound();
    return getCategory(db, id);
  });
});

export const DELETE = route({ permission: "SERVICE_MANAGE" }, async ({ session, params }) => {
  requireChainScope(session, "Service categories");
  const id = idParam(params);
  await withTx(session, async (db) => {
    if (!(await deleteCategory(db, id))) throw notFound();
  });
  return { ok: true };
});
