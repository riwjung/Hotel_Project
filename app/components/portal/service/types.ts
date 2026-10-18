// Service catalog (db/schema/060_e_services.sql) — chain-level master data.
// SERVICE is the single master; branches sell it through branch_service.
import type { RateStatus } from "../rate/types";

export type ActiveStatus = RateStatus; // ACTIVE | INACTIVE
export const ACTIVE_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export type ServiceCategory = {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  categoryStatus: ActiveStatus;
  serviceCount: number;
};

export type ServiceCategoryInput = {
  categoryCode: string;
  categoryName: string;
  categoryStatus: ActiveStatus;
};

export type Service = {
  serviceId: number;
  categoryId: number;
  categoryName: string;
  serviceCode: string;
  serviceName: string;
  description: string | null;
  defaultPrice: number;
  unit: string;
  isChargeable: boolean;
  needAssignment: boolean;
  estMinutes: number | null;
  serviceStatus: ActiveStatus;
  branchCount: number;
};

export type ServiceInput = {
  categoryId: number;
  serviceCode: string;
  serviceName: string;
  description: string | null;
  defaultPrice: number;
  unit: string;
  isChargeable: boolean;
  needAssignment: boolean;
  estMinutes: number | null;
  serviceStatus: ActiveStatus;
};
