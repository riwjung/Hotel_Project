import { HttpError, idParam, route } from "@/app/lib/server/http";
import { deleteRole, roleInputSchema, updateRole } from "@/app/lib/server/repos/role.repo";
import { withTx } from "@/app/lib/server/tx";

const notFound = () => new HttpError(404, "NOT_FOUND", "Role not found");

export const PATCH = route({ permission: "ROLE_MANAGE", body: roleInputSchema }, async ({ session, params, body }) => {
  const id = idParam(params);
  await withTx(session, async (db) => {
    if (!(await updateRole(db, id, body))) throw notFound();
  });
  return { ok: true };
});

export const DELETE = route({ permission: "ROLE_MANAGE" }, async ({ session, params }) => {
  const id = idParam(params);
  await withTx(session, async (db) => {
    if (!(await deleteRole(db, id))) throw notFound();
  });
  return { ok: true };
});
