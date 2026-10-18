// Room rate types — codes match ck_room_rate_status in db/schema/030_c_rooms.sql.
// Active rates of one (branch, room type) may not overlap (R1, EXCLUDE constraint).

export const RATE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type RateStatus = (typeof RATE_STATUSES)[number];

export type RoomRate = {
  rateId: number;
  branchId: number;
  branchCode: string;
  roomTypeId: number;
  typeName: string;
  rateName: string;
  startDate: string;
  endDate: string;
  pricePerNight: number;
  minNights: number;
  rateStatus: RateStatus;
  /** booked room lines priced from this rate (prices there are snapshots) */
  bookingCount: number;
  /** ACTIVE and covers today */
  isCurrent: boolean;
};

export type RateFilter = { branchId?: number; roomTypeId?: number; status?: RateStatus };

/** Body of POST /api/room-rates and PATCH /api/room-rates/:id (branchId only on create) */
export type RateInput = {
  branchId?: number | null;
  roomTypeId: number;
  rateName: string;
  startDate: string;
  endDate: string;
  pricePerNight: number;
  minNights: number;
  rateStatus: RateStatus;
};
