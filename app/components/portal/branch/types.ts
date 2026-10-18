// Branch domain types — shared by the API (repo) and the UI.

export const BRANCH_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type BranchStatus = (typeof BRANCH_STATUSES)[number];

export type Branch = {
  branchId: number;
  branchCode: string;
  branchName: string;
  province: string;
  address: string | null;
  phone: string | null;
  checkInTime: string; // HH:mm
  checkOutTime: string; // HH:mm
  branchStatus: BranchStatus;
  roomCount: number;
  employeeCount: number;
  activeBookingCount: number;
};

/** Body of POST /api/branches and PATCH /api/branches/:id */
export type BranchInput = {
  branchCode: string;
  branchName: string;
  province: string;
  address: string | null;
  phone: string | null;
  checkInTime: string;
  checkOutTime: string;
  branchStatus: BranchStatus;
};
