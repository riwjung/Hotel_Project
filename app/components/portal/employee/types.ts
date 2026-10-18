// Employee domain types — shared by the API (repo) and the UI.

/** A pickable employee for assignment dropdowns (GET /api/employees/options). */
export type EmployeeOption = {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  branchId: number | null;
  roleName: string;
};
