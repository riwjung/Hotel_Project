import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import {
  branchServiceFilterSchema,
  branchServiceInputSchema,
  createBranchService,
  getBranchService,
  listBranchServices,
} from "@/app/lib/server/repos/branch-service.repo";
import { withTx } from "@/app/lib/server/tx";

export const GET = route({ permission: "SERVICE_VIEW" }, async ({ req, session }) =>
  listBranchServices(branchScope(session), parseQuery(req, branchServiceFilterSchema)),
);

export const POST = route({ permission: "SERVICE_MANAGE", body: branchServiceInputSchema }, async ({ session, body }) => {
  const scope = branchScope(session);
  const row = await withTx(session, async (db) => getBranchService(db, await createBranchService(db, scope, body), scope));
  return Response.json(row, { status: 201 });
});
