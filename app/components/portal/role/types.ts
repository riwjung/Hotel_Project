// Roles × permissions (role, permission, role_permission). R20 keeps someone able to manage roles.
import type { ScopeLevel } from "@/app/lib/permissions";

export const SCOPE_LEVELS = ["CHAIN", "BRANCH"] as const;
export const ROLE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type RoleStatus = (typeof ROLE_STATUSES)[number];

export type RoleRow = {
  roleId: number;
  roleCode: string;
  roleName: string;
  scopeLevel: ScopeLevel;
  roleStatus: RoleStatus;
  employeeCount: number;
};

export type PermissionRow = {
  permissionId: number;
  permissionCode: string;
  moduleName: string;
  description: string | null;
};

export type RoleMatrix = {
  roles: RoleRow[];
  permissions: PermissionRow[];
  grants: Array<{ roleId: number; permissionId: number }>;
};

/** A role the caller may give to an employee (its rights ⊆ the caller's rights). */
export type RoleOption = { roleId: number; roleCode: string; roleName: string; scopeLevel: ScopeLevel };

export type RoleInput = { roleCode: string; roleName: string; scopeLevel: ScopeLevel; roleStatus: RoleStatus };

export type GrantInput = { permissionId: number; granted: boolean };
