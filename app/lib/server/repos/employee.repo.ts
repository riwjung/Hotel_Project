import "server-only";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  EMPLOYEE_STATUSES,
  type Employee,
  type EmployeeFilter,
  type EmployeeInput,
  type EmployeeOption,
} from "@/app/components/portal/employee/types";
import type { Session } from "../auth";
import { HttpError } from "../http";
import { query, type Db } from "../db";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const password = z.string().min(8, "Use at least 8 characters").max(72);

export const employeeFilterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  roleId: z.coerce.number().int().positive().optional(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
});

export const employeeOptionsSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  includeChain: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
});

const employeeFields = {
  branchId: z.number().int().positive().nullable(),
  roleId: z.number().int().positive(),
  managerId: z.number().int().positive().nullable(),
  employeeCode: z.string().trim().toUpperCase().min(2).max(20).regex(/^[A-Z0-9_-]+$/, "Use letters, digits, - or _"),
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  phone: z.string().trim().max(20).nullish().transform((v) => v || null),
  email: z.string().trim().toLowerCase().max(100).pipe(z.email()),
  hireDate: isoDate,
  employeeStatus: z.enum(EMPLOYEE_STATUSES),
};
export const employeeCreateSchema = z.object({ ...employeeFields, password }) satisfies z.ZodType<EmployeeInput>;
export const employeeUpdateSchema = z.object(employeeFields) satisfies z.ZodType<EmployeeInput>;
export const passwordSchema = z.object({ password });

/**
 * Active employees for assignment dropdowns. Branch-scoped users only ever get
 * their own branch; includeChain adds chain-level staff (e.g. as a manager).
 */
export function listEmployeeOptions(scope: number | null, branchId?: number, includeChain = false): Promise<EmployeeOption[]> {
  return query<EmployeeOption>(
    `SELECT e.employee_id AS "employeeId", e.employee_code AS "employeeCode",
       e.first_name || ' ' || e.last_name AS "fullName", e.branch_id AS "branchId", r.role_name AS "roleName"
     FROM employee e
     JOIN role r ON r.role_id = e.role_id
     WHERE e.employee_status = 'ACTIVE'
       AND ($1::int IS NULL OR e.branch_id = $1 OR ($2 AND e.branch_id IS NULL))
     ORDER BY e.branch_id NULLS FIRST, e.first_name, e.last_name`,
    [scope ?? branchId ?? null, includeChain],
  );
}

const SELECT_EMPLOYEE = `
  SELECT e.employee_id AS "employeeId", e.branch_id AS "branchId", b.branch_code AS "branchCode",
    e.role_id AS "roleId", r.role_code AS "roleCode", r.role_name AS "roleName", r.scope_level AS "scopeLevel",
    e.manager_id AS "managerId", m.first_name || ' ' || m.last_name AS "managerName",
    e.employee_code AS "employeeCode", e.first_name AS "firstName", e.last_name AS "lastName",
    e.phone, e.email, e.hire_date AS "hireDate", e.employee_status AS "employeeStatus"
  FROM employee e
  JOIN role r         ON r.role_id = e.role_id
  LEFT JOIN branch b  ON b.branch_id = e.branch_id
  LEFT JOIN employee m ON m.employee_id = e.manager_id`;

export function listEmployees(scope: number | null, filter: EmployeeFilter): Promise<Employee[]> {
  return query<Employee>(
    `${SELECT_EMPLOYEE}
     WHERE ($1::int IS NULL OR e.branch_id = $1)
       AND ($2::int IS NULL OR e.role_id = $2)
       AND ($3::varchar IS NULL OR e.employee_status = $3)
     ORDER BY b.branch_code NULLS FIRST, e.employee_code`,
    [scope ?? filter.branchId ?? null, filter.roleId ?? null, filter.status ?? null],
  );
}

export async function getEmployee(db: Db, id: number, scope: number | null): Promise<Employee | null> {
  const { rows } = await db.query<Employee>(`${SELECT_EMPLOYEE} WHERE e.employee_id = $1 AND ($2::int IS NULL OR e.branch_id = $2)`, [id, scope]);
  return rows[0] ?? null;
}

/**
 * No privilege escalation: a role can only be given by someone who already holds
 * every permission in it (the owner can give any role; a manager cannot make an owner).
 */
async function assertCanGiveRole(db: Db, session: Session, roleId: number) {
  const { rows } = await db.query<{ status: string; perms: string[] }>(
    `SELECT r.role_status AS status,
       COALESCE(array_agg(p.permission_code) FILTER (WHERE p.permission_code IS NOT NULL), '{}') AS perms
     FROM role r
     LEFT JOIN role_permission rp ON rp.role_id = r.role_id
     LEFT JOIN permission p       ON p.permission_id = rp.permission_id
     WHERE r.role_id = $1
     GROUP BY r.role_id`,
    [roleId],
  );
  if (!rows[0]) throw new HttpError(422, "INVALID_REFERENCE", "Selected role does not exist");
  if (rows[0].status !== "ACTIVE") throw new HttpError(422, "INACTIVE_ROLE", "That role is inactive");
  if (rows[0].perms.some((p) => !session.permissions.includes(p as never))) {
    throw new HttpError(403, "ESCALATION", "You cannot give a role with more rights than your own");
  }
}

const values = (input: EmployeeInput, branchId: number | null) => [
  branchId,
  input.roleId,
  input.managerId,
  input.employeeCode,
  input.firstName,
  input.lastName,
  input.phone,
  input.email,
  input.hireDate,
  input.employeeStatus,
];

/** Branch-scoped users always create staff of their own branch; R2 matches role scope and branch. */
export async function createEmployee(db: Db, session: Session, scope: number | null, input: EmployeeInput): Promise<number> {
  await assertCanGiveRole(db, session, input.roleId);
  const hash = await bcrypt.hash(input.password ?? "", 10);
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO employee (branch_id, role_id, manager_id, employee_code, first_name, last_name, phone, email,
                           hire_date, employee_status, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING employee_id AS id`,
    [...values(input, scope ?? input.branchId), hash],
  );
  return rows[0].id;
}

/** R2 (role ↔ branch), R2b (manager's branch) and R20 (someone keeps ROLE_MANAGE) run on the update. */
export async function updateEmployee(db: Db, session: Session, id: number, scope: number | null, input: EmployeeInput): Promise<boolean> {
  const { rows } = await db.query<{ roleId: number }>(
    `SELECT role_id AS "roleId" FROM employee WHERE employee_id = $1 AND ($2::int IS NULL OR branch_id = $2) FOR UPDATE`,
    [id, scope],
  );
  if (!rows[0]) return false;
  // a role you may not give is also one you may not take away from someone
  if (rows[0].roleId !== input.roleId) {
    await assertCanGiveRole(db, session, rows[0].roleId);
    await assertCanGiveRole(db, session, input.roleId);
  } else {
    await assertCanGiveRole(db, session, input.roleId);
  }
  if (input.managerId === id) throw new HttpError(422, "INVALID_MANAGER", "An employee cannot be their own manager");
  const { rowCount } = await db.query(
    `UPDATE employee SET branch_id = $2, role_id = $3, manager_id = $4, employee_code = $5, first_name = $6,
       last_name = $7, phone = $8, email = $9, hire_date = $10, employee_status = $11
     WHERE employee_id = $1`,
    [id, ...values(input, scope ?? input.branchId)],
  );
  return rowCount === 1;
}

export async function setEmployeePassword(db: Db, session: Session, id: number, scope: number | null, newPassword: string) {
  const { rows } = await db.query<{ roleId: number }>(
    `SELECT role_id AS "roleId" FROM employee WHERE employee_id = $1 AND ($2::int IS NULL OR branch_id = $2)`,
    [id, scope],
  );
  if (!rows[0]) throw new HttpError(404, "NOT_FOUND", "Employee not found");
  await assertCanGiveRole(db, session, rows[0].roleId); // no resetting the password of someone above you
  await db.query(`UPDATE employee SET password_hash = $2 WHERE employee_id = $1`, [id, await bcrypt.hash(newPassword, 10)]);
}
