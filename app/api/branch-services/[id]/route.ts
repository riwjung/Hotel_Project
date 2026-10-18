import { branchScope } from "@/app/lib/server/auth";
import { HttpError, idParam, route } from "@/app/lib/server/http";
import {
  branchServiceInputSchema,
  deleteBranchService,
  getBranchService,
  updateBranchService,
} from "@/app/lib/server/repos/branch-service.repo";
import { withTx } from "@/app/lib/server/tx";

const notFound = () => new HttpError(404, "NOT_FOUND", "Branch service not found");

export const PATCH = route({ permission: "SERVICE_MANAGE", body: branchServiceInputSchema }, async ({ session, params, body }) => {
  const id = idParam(params);
  const scope = branchScope(session);
  return withTx(session, async (db) => {
    if (!(await updateBranchService(db, id, scope, body))) throw notFound();
    return getBranchService(db, id, scope);
  });
});

export const DELETE = route({ permission: "SERVICE_MANAGE" }, async ({ session, params }) => {
  const id = idParam(params);
  await withTx(session, async (db) => {
    if (!(await deleteBranchService(db, id, branchScope(session)))) throw notFound();
  });
  return { ok: true };
});
