import { route } from "@/app/lib/server/http";
import { createRole, getRoleMatrix, roleInputSchema } from "@/app/lib/server/repos/role.repo";
import { withTx } from "@/app/lib/server/tx";

export const GET = route({ permission: "ROLE_MANAGE" }, async () => getRoleMatrix());

export const POST = route({ permission: "ROLE_MANAGE", body: roleInputSchema }, async ({ session, body }) => {
  const roleId = await withTx(session, (db) => createRole(db, body));
  return Response.json({ roleId }, { status: 201 });
});
