// service_assignment — append-only history (codes match ck_service_assignment_status).

export const ASSIGNMENT_STATUSES = ["ASSIGNED", "IN_PROGRESS", "COMPLETED", "REASSIGNED", "CANCELLED"] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export type Assignment = {
  assignmentId: number;
  bookingServiceId: number;
  bookingId: number;
  bookingCode: string;
  branchId: number;
  branchCode: string;
  serviceName: string;
  employeeId: number;
  employeeName: string;
  assignedByName: string | null;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  qualityScore: number | null;
  assignmentStatus: AssignmentStatus;
  note: string | null;
};

export type AssignmentFilter = { branchId?: number; status?: AssignmentStatus; employeeId?: number };

/** Completed work and quality per employee (the course report's quality query) */
export type QualityRow = {
  employeeId: number;
  employeeName: string;
  branchCode: string | null;
  completedCount: number;
  openCount: number;
  ratedCount: number;
  averageScore: number | null;
};
