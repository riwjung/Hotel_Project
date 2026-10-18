import { api } from "@/app/lib/api-client";
import type { EmployeeOption } from "./types";

export function fetchEmployeeOptions(branchId: number | undefined, signal?: AbortSignal) {
  return api<EmployeeOption[]>("/api/employees/options", { params: { branchId }, signal });
}

/** Select options "EMP-0103 · Darin Thongdee". */
export const employeeSelectOptions = (employees: EmployeeOption[]) =>
  employees.map((e) => ({ value: e.employeeId, label: `${e.employeeCode} · ${e.fullName}` }));
