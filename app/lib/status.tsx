import type { ReactNode } from "react";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  LoginOutlined,
  LogoutOutlined,
  MinusCircleOutlined,
  MinusOutlined,
  StopOutlined,
  ToolOutlined,
  UserDeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { BranchStatus } from "@/app/components/portal/branch/types";
import type { RoomStatus } from "@/app/components/portal/room/types";
import type { BookingStatus, PaymentStatus } from "@/app/components/portal/booking/types";
import type { HousekeepingStatus } from "@/app/components/portal/housekeeping/types";
import type { MaintenancePriority, MaintenanceStatus } from "@/app/components/portal/maintenance/types";

// Status palettes: DB stores the code, the UI shows label + color + icon.
// Color is never the only signal (icon + label too). Key order = workflow order,
// which is also the sort order used by table-sort.ts › sortByOrder.
// Codes must match the CHECK constraints in db/schema — see docs/01-design/physical-design.md

export type StatusMeta = { label: string; color: string; icon: ReactNode };

export const BRANCH_STATUS: Record<BranchStatus, StatusMeta> = {
  ACTIVE:   { label: "Active",   color: "green",   icon: <CheckCircleOutlined /> },
  INACTIVE: { label: "Inactive", color: "default", icon: <MinusCircleOutlined /> },
};

export const ROOM_STATUS: Record<RoomStatus, StatusMeta> = {
  AVAILABLE:      { label: "Available",      color: "green",   icon: <CheckCircleOutlined /> },
  OCCUPIED:       { label: "Occupied",       color: "blue",    icon: <UserOutlined /> },
  CLEANING:       { label: "Cleaning",       color: "gold",    icon: <ClearOutlined /> },
  MAINTENANCE:    { label: "Maintenance",    color: "red",     icon: <ToolOutlined /> },
  OUT_OF_SERVICE: { label: "Out of service", color: "default", icon: <StopOutlined /> },
};

export const BOOKING_STATUS: Record<BookingStatus, StatusMeta> = {
  PENDING:     { label: "Pending",     color: "default", icon: <ClockCircleOutlined /> },
  CONFIRMED:   { label: "Confirmed",   color: "blue",    icon: <CheckOutlined /> },
  CHECKED_IN:  { label: "Checked in",  color: "green",   icon: <LoginOutlined /> },
  CHECKED_OUT: { label: "Checked out", color: "cyan",    icon: <LogoutOutlined /> },
  CANCELLED:   { label: "Cancelled",   color: "red",     icon: <CloseCircleOutlined /> },
  NO_SHOW:     { label: "No-show",     color: "volcano", icon: <UserDeleteOutlined /> },
};

export const PAYMENT_STATUS: Record<PaymentStatus, StatusMeta> = {
  PENDING:  { label: "Pending",  color: "gold",    icon: <ClockCircleOutlined /> },
  PAID:     { label: "Paid",     color: "green",   icon: <CheckCircleOutlined /> },
  FAILED:   { label: "Failed",   color: "red",     icon: <CloseCircleOutlined /> },
  REFUNDED: { label: "Refunded", color: "default", icon: <LogoutOutlined /> },
};

export const HOUSEKEEPING_STATUS: Record<HousekeepingStatus, StatusMeta> = {
  PENDING:     { label: "Pending",     color: "default", icon: <ClockCircleOutlined /> },
  IN_PROGRESS: { label: "In progress", color: "blue",    icon: <ClearOutlined /> },
  DONE:        { label: "Done",        color: "gold",    icon: <CheckOutlined /> },
  VERIFIED:    { label: "Verified",    color: "green",   icon: <CheckCircleOutlined /> },
  CANCELLED:   { label: "Cancelled",   color: "red",     icon: <CloseCircleOutlined /> },
};

export const MAINTENANCE_STATUS: Record<MaintenanceStatus, StatusMeta> = {
  OPEN:        { label: "Open",        color: "gold",    icon: <ExclamationCircleOutlined /> },
  IN_PROGRESS: { label: "In progress", color: "blue",    icon: <ToolOutlined /> },
  RESOLVED:    { label: "Resolved",    color: "green",   icon: <CheckCircleOutlined /> },
  CANCELLED:   { label: "Cancelled",   color: "default", icon: <CloseCircleOutlined /> },
};

// Priority is not a workflow status, but it is a coded value rendered the same way (key order = urgency).
export const MAINTENANCE_PRIORITY: Record<MaintenancePriority, StatusMeta> = {
  LOW:    { label: "Low",    color: "default", icon: <ArrowDownOutlined /> },
  MEDIUM: { label: "Medium", color: "blue",    icon: <MinusOutlined /> },
  HIGH:   { label: "High",   color: "orange",  icon: <ArrowUpOutlined /> },
  URGENT: { label: "Urgent", color: "red",     icon: <FireOutlined /> },
};

/** Options for a status filter <Select>, in workflow order. */
export function statusOptions<K extends string>(palette: Record<K, StatusMeta>) {
  return (Object.keys(palette) as K[]).map((value) => ({ value, label: palette[value].label }));
}
