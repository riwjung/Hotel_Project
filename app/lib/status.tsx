import type { ReactNode } from "react";
import {
  CheckCircleOutlined,
  CheckOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  MinusCircleOutlined,
  StopOutlined,
  ToolOutlined,
  UserDeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { BranchStatus } from "@/app/components/portal/branch/types";
import type { RoomStatus } from "@/app/components/portal/room/types";

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

export type BookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW";

export const BOOKING_STATUS: Record<BookingStatus, StatusMeta> = {
  PENDING:     { label: "Pending",     color: "default", icon: <ClockCircleOutlined /> },
  CONFIRMED:   { label: "Confirmed",   color: "blue",    icon: <CheckOutlined /> },
  CHECKED_IN:  { label: "Checked in",  color: "green",   icon: <LoginOutlined /> },
  CHECKED_OUT: { label: "Checked out", color: "cyan",    icon: <LogoutOutlined /> },
  CANCELLED:   { label: "Cancelled",   color: "red",     icon: <CloseCircleOutlined /> },
  NO_SHOW:     { label: "No-show",     color: "volcano", icon: <UserDeleteOutlined /> },
};

/** Options for a status filter <Select>, in workflow order. */
export function statusOptions<K extends string>(palette: Record<K, StatusMeta>) {
  return (Object.keys(palette) as K[]).map((value) => ({ value, label: palette[value].label }));
}
