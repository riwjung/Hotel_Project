// Shift definitions per branch (db/schema/020_b_workforce.sql). Times are HH:mm.

export type Shift = {
  shiftId: number;
  branchId: number;
  branchCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  /** ends the next day (e.g. 23:00–07:00) */
  isOvernight: boolean;
  scheduleCount: number;
};

/** Body of POST /api/shifts and PATCH /api/shifts/:id (branchId only on create) */
export type ShiftInput = {
  branchId?: number | null;
  shiftName: string;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
};
