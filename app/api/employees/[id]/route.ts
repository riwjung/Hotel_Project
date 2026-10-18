import { branchScope } from "@/app/lib/server/auth";
import { HttpError, idParam, route } from "@/app/lib/server/http";
import { employeeUpdateSchema, getEmployee, updateEmployee } from "@/app/lib/server/repos/employee.repo";
import { withTx } from "@/app/lib/server/tx";

// Employees are never deleted (bookings, tasks and logs point at them) — set them RESIGNED.
export const PATCH = route({ permission: "EMPLOYEE_MANAGE", body: employeeUpdateSchema }, async ({ session, params, body }) => {
  const id = idParam(params);
  const scope = branchScope(session);
  return withTx(session, async (db) => {
    if (!(await updateEmployee(db, session, id, scope, body))) throw new HttpError(404, "NOT_FOUND", "Employee not found");
    return getEmployee(db, id, scope);
  });
});
