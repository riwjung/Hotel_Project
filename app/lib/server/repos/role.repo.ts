import "server-only";
import { z } from "zod";
import {
  ROLE_STATUSES,
  SCOPE_LEVELS,
  type GrantInput,
  type RoleInput,
  type RoleMatrix,
  type RoleOption,
} from "@/app/components/portal/role/types";
import type { Session } from "../auth";
import { HttpError } from "../http";
import { query, type Db } from "../db";

export const roleInputSchema = z.object({
  roleCode: z.string().trim().toUpperCase().min(2).max(30).regex(/^[A-Z0-9_]+$/, "Use letters, digits or _"),
  roleName: z.string().trim().min(1).max(50),
  scopeLevel: z.enum(SCOPE_LEVELS),
  roleStatus: z.enum(ROLE_STATUSES),
}) satisfies z.ZodType<RoleInput>;

export const grantSchema = z.object({ permissionId: z.number().int().positive(), granted: z.boolean() }) satisfies z.ZodType<GrantInput>;

export async function getRoleMatrix(): Promise<RoleMatrix> {
  const [roles, permissions, grants] = await Promise.all([
    query<RoleMatrix["roles"][number]>(
      `SELECT r.role_id AS "roleId", r.role_code AS "roleCode", r.role_name AS "roleName", r.scope_level AS "scopeLevel",
         r.role_status AS "roleStatus", (SELECT count(*) FROM employee e WHERE e.role_id = r.role_id) AS "employeeCount"
       FROM role r ORDER BY r.role_id`,
    ),
    query<RoleMatrix["permissions"][number]>(
      `SELECT permission_id AS "permissionId", permission_code AS "permissionCode", module_name AS "moduleName", description
       FROM permission ORDER BY permission_id`,
    ),
    query<RoleMatrix["grants"][number]>(`SELECT role_id AS "roleId", permission_id AS "permissionId" FROM role_permission`),
  ]);
  return { roles, permissions, grants };
}

/** Roles the caller may give: active, every permission already held by the caller, and branch roles for branch users. */
export function listRoleOptions(session: Session, scope: number | null): Promise<RoleOption[]> {
  return query<RoleOption>(
    `SELECT r.role_id AS "roleId", r.role_code AS "roleCode", r.role_name AS "roleName", r.scope_level AS "scopeLevel"
     FROM role r
     WHERE r.role_status = 'ACTIVE'
       AND ($2::int IS NULL OR r.scope_level = 'BRANCH')
       AND NOT EXISTS (
         SELECT 1 FROM role_permission rp JOIN permission p ON p.permission_id = rp.permission_id
         WHERE rp.role_id = r.role_id AND NOT (p.permission_code = ANY($1::text[]))
       )
     ORDER BY r.role_id`,
    [session.permissions, scope],
  );
}

export async function createRole(db: Db, input: RoleInput): Promise<number> {
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO role (role_code, role_name, scope_level, role_status) VALUES ($1, $2, $3, $4) RETURNING role_id AS id`,
    [input.roleCode, input.roleName, input.scopeLevel, input.roleStatus],
  );
  return rows[0].id;
}

/** Scope is fixed once employees hold the role (R2 checked them against it). R20 guards deactivation. */
export async function updateRole(db: Db, id: number, input: RoleInput): Promise<boolean> {
  const { rows } = await db.query<{ scope: string; employees: number }>(
    `SELECT scope_level AS scope, (SELECT count(*) FROM employee e WHERE e.role_id = r.role_id)::int AS employees
     FROM role r WHERE role_id = $1 FOR UPDATE`,
    [id],
  );
  if (!rows[0]) return false;
  if (rows[0].scope !== input.scopeLevel && rows[0].employees > 0) {
    throw new HttpError(422, "SCOPE_LOCKED", "Employees hold this role, so its scope cannot change");
  }
  await db.query(
    `UPDATE role SET role_code = $2, role_name = $3, scope_level = $4, role_status = $5 WHERE role_id = $1`,
    [id, input.roleCode, input.roleName, input.scopeLevel, input.roleStatus],
  );
  return true;
}

/** Roles that employees hold are still referenced → 409 IN_USE; grants go with it (cascade). */
export async function deleteRole(db: Db, id: number): Promise<boolean> {
  const { rowCount } = await db.query(`DELETE FROM role WHERE role_id = $1`, [id]);
  return rowCount === 1;
}

/** Grant or revoke one permission; R20 refuses a revoke that leaves nobody able to manage roles. */
export async function setGrant(db: Db, roleId: number, input: GrantInput) {
  if (input.granted) {
    await db.query(
      `INSERT INTO role_permission (role_id, permission_id) VALUES ($1, $2) ON CONFLICT (role_id, permission_id) DO NOTHING`,
      [roleId, input.permissionId],
    );
  } else {
    await db.query(`DELETE FROM role_permission WHERE role_id = $1 AND permission_id = $2`, [roleId, input.permissionId]);
  }
}
