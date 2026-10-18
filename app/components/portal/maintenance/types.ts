// Maintenance domain types — must match the CHECKs in db/schema/070_f_operations.sql
import type { RoomStatus } from "../room/types";

export const MAINTENANCE_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const MAINTENANCE_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number];

export type MaintenanceRequest = {
  maintenanceId: number;
  branchId: number;
  branchCode: string;
  /** null = common area (lobby, pool …) */
  roomId: number | null;
  roomNumber: string | null;
  roomStatus: RoomStatus | null;
  reportedByEmpId: number;
  reportedByName: string;
  assignedToEmpId: number | null;
  assignedToName: string | null;
  issueTitle: string;
  priority: MaintenancePriority;
  reportDate: string;
  doneDate: string | null;
  cost: number | null;
  maintenanceStatus: MaintenanceStatus;
};

export type MaintenanceFilter = {
  branchId?: number;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
};

/** Body of POST /api/maintenance and PATCH /api/maintenance/:id (branchId only on create) */
export type MaintenanceInput = {
  branchId?: number | null;
  roomId: number | null;
  issueTitle: string;
  priority: MaintenancePriority;
  assignedToEmpId: number | null;
};

/** Body of POST /api/maintenance/:id/status — the DB checks the workflow (R15) */
export type MaintenanceStatusInput = {
  toStatus: Exclude<MaintenanceStatus, "OPEN">;
  cost?: number | null;
};
