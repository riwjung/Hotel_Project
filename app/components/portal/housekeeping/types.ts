export const HOUSEKEEPING_STATUSES = ["PENDING", "IN_PROGRESS", "DONE", "VERIFIED", "CANCELLED"] as const;
export type HousekeepingStatus = (typeof HOUSEKEEPING_STATUSES)[number];

export const HOUSEKEEPING_TASK_TYPES = ["CHECKOUT_CLEAN", "STAYOVER_CLEAN", "DEEP_CLEAN", "INSPECTION"] as const;
export type HousekeepingTaskType = (typeof HOUSEKEEPING_TASK_TYPES)[number];

export type HousekeepingFilter = {
  branchId?: number;
  date?: string;
  status?: HousekeepingStatus;
};

export type HousekeepingTask = {
  taskId: number;
  branchId: number;
  branchCode: string;
  roomId: number;
  roomNumber: string;
  assignedEmpId: number;
  assignedEmployee: string;
  verifiedByName: string | null;
  taskType: HousekeepingTaskType;
  taskDate: string;
  startedAt: string | null;
  completedAt: string | null;
  taskStatus: HousekeepingStatus;
  remark: string | null;
};
