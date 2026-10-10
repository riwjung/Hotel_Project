import { branchScope } from "@/app/lib/server/auth";
import { HttpError, idParam, route } from "@/app/lib/server/http";
import { withTx } from "@/app/lib/server/tx";
import {
  branchInputSchema,
  deleteBranch,
  getBranch,
  updateBranch,
} from "@/app/lib/server/repos/branch.repo";

const notFound = () => new HttpError(404, "NOT_FOUND", "Branch not found");

export const GET = route({ permission: "BRANCH_VIEW" }, async ({ session, params }) => {
  const branch = await getBranch(idParam(params), branchScope(session));
  if (!branch) throw notFound();
  return branch;
});

export const PATCH = route(
  { permission: "BRANCH_MANAGE", body: branchInputSchema },
  async ({ session, params, body }) => {
    const id = idParam(params);
    return withTx(session, async (db) => {
      if (!(await updateBranch(db, id, body))) throw notFound();
      return getBranch(id, null, db);
    });
  },
);

export const DELETE = route({ permission: "BRANCH_MANAGE" }, async ({ session, params }) => {
  const id = idParam(params);
  await withTx(session, async (db) => {
    if (!(await deleteBranch(db, id))) throw notFound();
  });
  return { ok: true };
});
