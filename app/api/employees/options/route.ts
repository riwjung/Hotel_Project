import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import { employeeOptionsSchema, listEmployeeOptions } from "@/app/lib/server/repos/employee.repo";

// Any signed-in employee: names for assignment dropdowns, always inside the caller's branch scope.
export const GET = route({}, async ({ req, session }) => {
  const { branchId, includeChain } = parseQuery(req, employeeOptionsSchema);
  return listEmployeeOptions(branchScope(session), branchId, includeChain);
});
