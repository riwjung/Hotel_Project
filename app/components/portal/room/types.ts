// Room domain types — shared by the API (repo) and the UI.

// Must match ck_room_status in db/schema/030_c_rooms.sql
export const ROOM_STATUSES = ["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE", "OUT_OF_SERVICE"] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

/**
 * Statuses staff may set by hand. OCCUPIED only comes from check-in and leaves
 * with check-out; a room with an open repair stays MAINTENANCE (R15).
 */
export const MANUAL_ROOM_STATUSES = ["AVAILABLE", "CLEANING", "MAINTENANCE", "OUT_OF_SERVICE"] as const;
export type ManualRoomStatus = (typeof MANUAL_ROOM_STATUSES)[number];

export type Room = {
  roomId: number;
  branchId: number;
  branchCode: string;
  roomNumber: string;
  roomName: string | null;
  floor: number;
  locationZone: string | null;
  roomStatus: RoomStatus;
  description: string | null;
  roomTypeId: number;
  typeCode: string;
  typeName: string;
  capacity: number;
  bedType: string;
};

export type RoomFilter = {
  branchId?: number;
  status?: RoomStatus;
};

/** Body of POST /api/rooms and PATCH /api/rooms/:id (branchId and status only on create) */
export type RoomInput = {
  branchId?: number | null;
  roomTypeId: number;
  roomNumber: string;
  roomName: string | null;
  floor: number;
  locationZone: string | null;
  description: string | null;
  roomStatus?: ManualRoomStatus;
};
