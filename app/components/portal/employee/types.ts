// Employee domain types — shared by the API (repo) and the UI.
// Codes match ck_employee_status / ck_role_scope in db/schema/010_a_org_access.sql
import type { ScopeLevel } from "@/app/lib/permissions";

export const EMPLOYEE_STATUSES = ["ACTIVE", "ON_LEAVE", "RESIGNED"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

/** A pickable employee for assignment dropdowns (GET /api/employees/options). */
export type EmployeeOption = {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  branchId: number | null;
  roleName: string;
};

export type Employee = {
  employeeId: number;
  branchId: number | null;
  branchCode: string | null;
  roleId: number;
  roleCode: string;
  roleName: string;
  scopeLevel: ScopeLevel;
  managerId: number | null;
  managerName: string | null;
  employeeCode: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string;
  hireDate: string;
  employeeStatus: EmployeeStatus;
};

export type EmployeeFilter = { branchId?: number; roleId?: number; status?: EmployeeStatus };

/** Body of POST /api/employees (password required) and PATCH /api/employees/:id (no password) */
export type EmployeeInput = {
  branchId: number | null;
  roleId: number;
  managerId: number | null;
  employeeCode: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string;
  hireDate: string;
  employeeStatus: EmployeeStatus;
  password?: string;
};
