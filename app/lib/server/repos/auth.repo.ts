import "server-only";
import type { PermissionCode, ScopeLevel, SessionUser } from "@/app/lib/permissions";
import { queryOne } from "../db";

type LoginRow = {
  employeeId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  employeeStatus: string;
  roleCode: string;
  roleName: string;
  roleStatus: string;
  scopeLevel: ScopeLevel;
  branchId: number | null;
  branchCode: string | null;
  branchName: string | null;
  permissions: PermissionCode[];
};

export async function findEmployeeForLogin(email: string): Promise<LoginRow | null> {
  return queryOne<LoginRow>(
    `SELECT
       e.employee_id      AS "employeeId",
       e.employee_code    AS "employeeCode",
       e.first_name       AS "firstName",
       e.last_name        AS "lastName",
       e.email,
       e.password_hash    AS "passwordHash",
       e.employee_status  AS "employeeStatus",
       r.role_code        AS "roleCode",
       r.role_name        AS "roleName",
       r.role_status      AS "roleStatus",
       r.scope_level      AS "scopeLevel",
       b.branch_id        AS "branchId",
       b.branch_code      AS "branchCode",
       b.branch_name      AS "branchName",
       COALESCE(
         (SELECT array_agg(p.permission_code ORDER BY p.permission_code)
          FROM role_permission rp
          JOIN permission p ON p.permission_id = rp.permission_id
          WHERE rp.role_id = r.role_id),
         '{}'
       ) AS permissions
     FROM employee e
     JOIN role r        ON r.role_id = e.role_id
     LEFT JOIN branch b ON b.branch_id = e.branch_id
     WHERE lower(e.email) = lower($1)`,
    [email],
  );
}

export function toSessionUser(row: LoginRow): SessionUser {
  return {
    employeeId: row.employeeId,
    employeeCode: row.employeeCode,
    name: `${row.firstName} ${row.lastName}`,
    email: row.email,
    roleCode: row.roleCode,
    roleName: row.roleName,
    scopeLevel: row.scopeLevel,
    branchId: row.branchId,
    branchCode: row.branchCode,
    branchName: row.branchName,
    permissions: row.permissions,
  };
}
