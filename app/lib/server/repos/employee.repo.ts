import "server-only";
import type { EmployeeOption } from "@/app/components/portal/employee/types";
import { query } from "../db";

/**
 * Active employees of one branch, for assignment dropdowns. Branch-scoped users
 * only ever get their own branch; chain users get the branch they ask for (or all).
 */
export function listEmployeeOptions(scope: number | null, branchId?: number): Promise<EmployeeOption[]> {
  return query<EmployeeOption>(
    `SELECT e.employee_id AS "employeeId", e.employee_code AS "employeeCode",
       e.first_name || ' ' || e.last_name AS "fullName", e.branch_id AS "branchId", r.role_name AS "roleName"
     FROM employee e
     JOIN role r ON r.role_id = e.role_id
     WHERE e.employee_status = 'ACTIVE'
       AND ($1::int IS NULL OR e.branch_id = $1)
     ORDER BY e.first_name, e.last_name`,
    [scope ?? branchId ?? null],
  );
}
