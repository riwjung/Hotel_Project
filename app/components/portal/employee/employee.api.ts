import { api } from "@/app/lib/api-client";
import type { RoleOption } from "../role/types";
import type { Employee, EmployeeFilter, EmployeeInput, EmployeeOption } from "./types";

/** @param includeChain also list chain-level staff (e.g. the owner as a manager) */
export function fetchEmployeeOptions(branchId: number | undefined, signal?: AbortSignal, includeChain = false) {
  return api<EmployeeOption[]>("/api/employees/options", {
    params: { branchId, includeChain: includeChain ? "true" : undefined },
    signal,
  });
}

/** Select options "EMP-0103 · Darin Thongdee". */
export const employeeSelectOptions = (employees: EmployeeOption[]) =>
  employees.map((e) => ({ value: e.employeeId, label: `${e.employeeCode} · ${e.fullName}` }));

export function fetchEmployees(filter: EmployeeFilter, signal?: AbortSignal) {
  return api<Employee[]>("/api/employees", { params: filter, signal });
}

export function createEmployee(input: EmployeeInput) {
  return api<Employee>("/api/employees", { method: "POST", body: input });
}

export function updateEmployee(id: number, input: EmployeeInput) {
  return api<Employee>(`/api/employees/${id}`, { method: "PATCH", body: input });
}

export function resetEmployeePassword(id: number, password: string) {
  return api<{ ok: true }>(`/api/employees/${id}/password`, { method: "POST", body: { password } });
}

/** Roles the signed-in user may give (never more rights than their own). */
export function fetchRoleOptions(signal?: AbortSignal) {
  return api<RoleOption[]>("/api/roles/options", { signal });
}
