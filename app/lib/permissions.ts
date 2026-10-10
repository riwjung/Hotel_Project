// Permission codes — must match permission.permission_code in db/seed/100_master.sql.
export const PERMISSIONS = [
  "DASHBOARD_VIEW",
  "BRANCH_VIEW",
  "BRANCH_MANAGE",
  "EMPLOYEE_VIEW",
  "EMPLOYEE_MANAGE",
  "ROLE_MANAGE",
  "SCHEDULE_VIEW",
  "SCHEDULE_MANAGE",
  "ATTENDANCE_VIEW",
  "ATTENDANCE_MANAGE",
  "ROOM_VIEW",
  "ROOM_MANAGE",
  "RATE_MANAGE",
  "BOOKING_VIEW",
  "BOOKING_MANAGE",
  "CUSTOMER_VIEW",
  "CUSTOMER_MANAGE",
  "SERVICE_VIEW",
  "SERVICE_MANAGE",
  "SERVICE_ORDER_MANAGE",
  "ASSIGNMENT_MANAGE",
  "HOUSEKEEPING_VIEW",
  "HOUSEKEEPING_MANAGE",
  "MAINTENANCE_VIEW",
  "MAINTENANCE_MANAGE",
  "PAYMENT_VIEW",
  "PAYMENT_MANAGE",
  "PROMOTION_MANAGE",
  "REVIEW_VIEW",
  "REVIEW_REPLY",
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number];

export type ScopeLevel = "CHAIN" | "BRANCH";

/** What the browser knows about the signed-in employee (also the JWT payload). */
export type SessionUser = {
  employeeId: number;
  employeeCode: string;
  name: string;
  email: string;
  roleCode: string;
  roleName: string;
  scopeLevel: ScopeLevel;
  branchId: number | null;
  branchCode: string | null;
  branchName: string | null;
  permissions: PermissionCode[];
};

export function hasPermission(user: SessionUser | null | undefined, code: PermissionCode): boolean {
  return !!user && user.permissions.includes(code);
}
