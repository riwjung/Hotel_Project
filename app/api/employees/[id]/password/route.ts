import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { passwordSchema, setEmployeePassword } from "@/app/lib/server/repos/employee.repo";
import { withTx } from "@/app/lib/server/tx";

export const POST = route({ permission: "EMPLOYEE_MANAGE", body: passwordSchema }, async ({ session, params, body }) => {
  await withTx(session, (db) => setEmployeePassword(db, session, idParam(params), branchScope(session), body.password));
  return { ok: true };
});
