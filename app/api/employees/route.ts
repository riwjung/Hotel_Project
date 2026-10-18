import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import {
  createEmployee,
  employeeCreateSchema,
  employeeFilterSchema,
  getEmployee,
  listEmployees,
} from "@/app/lib/server/repos/employee.repo";
import { withTx } from "@/app/lib/server/tx";

export const GET = route({ permission: "EMPLOYEE_VIEW" }, async ({ req, session }) =>
  listEmployees(branchScope(session), parseQuery(req, employeeFilterSchema)),
);

export const POST = route({ permission: "EMPLOYEE_MANAGE", body: employeeCreateSchema }, async ({ session, body }) => {
  const scope = branchScope(session);
  const employee = await withTx(session, async (db) => getEmployee(db, await createEmployee(db, session, scope, body), scope));
  return Response.json(employee, { status: 201 });
});
