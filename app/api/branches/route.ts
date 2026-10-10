import { branchScope } from "@/app/lib/server/auth";
import { route } from "@/app/lib/server/http";
import { withTx } from "@/app/lib/server/tx";
import {
  branchInputSchema,
  createBranch,
  getBranch,
  listBranches,
} from "@/app/lib/server/repos/branch.repo";

export const GET = route({ permission: "BRANCH_VIEW" }, async ({ session }) =>
  listBranches(branchScope(session)),
);

export const POST = route(
  { permission: "BRANCH_MANAGE", body: branchInputSchema },
  async ({ session, body }) => {
    const branch = await withTx(session, async (db) => {
      const id = await createBranch(db, body);
      return getBranch(id, null, db);
    });
    return Response.json(branch, { status: 201 });
  },
);
