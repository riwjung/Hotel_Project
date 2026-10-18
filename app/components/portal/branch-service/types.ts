// What a branch sells (branch_service): its own price, availability and hours.

export type BranchService = {
  branchServiceId: number;
  branchId: number;
  branchCode: string;
  serviceId: number;
  serviceCode: string;
  serviceName: string;
  categoryName: string;
  unit: string;
  defaultPrice: number;
  branchPrice: number;
  isAvailable: boolean;
  /** HH:mm, both null = no fixed hours */
  openTime: string | null;
  closeTime: string | null;
  needAssignment: boolean;
  orderCount: number;
};

export type BranchServiceFilter = { branchId?: number; available?: boolean };

/** Body of POST /api/branch-services and PATCH /api/branch-services/:id (branchId/serviceId only on create) */
export type BranchServiceInput = {
  branchId?: number | null;
  serviceId: number;
  branchPrice: number;
  isAvailable: boolean;
  openTime: string | null;
  closeTime: string | null;
};
