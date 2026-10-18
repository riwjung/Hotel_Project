import { idParam, route } from "@/app/lib/server/http";
import { grantSchema, setGrant } from "@/app/lib/server/repos/role.repo";
import { withTx } from "@/app/lib/server/tx";

// R20 refuses a revoke that would leave nobody able to manage roles.
export const PUT = route({ permission: "ROLE_MANAGE", body: grantSchema }, async ({ session, params, body }) => {
  await withTx(session, (db) => setGrant(db, idParam(params), body));
  return { ok: true };
});
