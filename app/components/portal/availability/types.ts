// Availability grid (rooms × nights) — shared by the API (repo) and the UI.
import type { BranchStatus } from "../branch/types";
import type { BookingStatus } from "../booking/types";
import type { RoomStatus } from "../room/types";

/** Window lengths the grid offers; the API accepts 1–31 nights. */
export const GRID_DAYS = [7, 14, 30] as const;
export type GridDays = (typeof GRID_DAYS)[number];

/**
 * A booking that holds the room on at least one night of the window.
 * Cancelled and no-show bookings never appear — R3 ignores them too.
 */
export type GridStay = {
  bookingId: number;
  bookingCode: string;
  customerName: string;
  guestCount: number;
  /** 'YYYY-MM-DD' — first night */
  checkInDate: string;
  /** 'YYYY-MM-DD' — the room is free again from this night */
  checkOutDate: string;
  bookingStatus: Exclude<BookingStatus, "CANCELLED" | "NO_SHOW">;
};

/** One grid row: a room and the stays overlapping the window, oldest first. */
export type GridRoom = {
  roomId: number;
  branchId: number;
  branchCode: string;
  branchStatus: BranchStatus;
  roomNumber: string;
  roomName: string | null;
  floor: number;
  roomStatus: RoomStatus;
  typeName: string;
  capacity: number;
  stays: GridStay[];
};

/** Query of GET /api/availability (branchId is ignored for branch-scoped users). */
export type GridFilter = {
  branchId?: number;
  /** 'YYYY-MM-DD' — first night shown */
  from: string;
  days: number;
};
