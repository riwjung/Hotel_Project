// Room domain types — shared by the API (repo) and the UI.

// Must match ck_room_status in db/schema/030_c_rooms.sql
export const ROOM_STATUSES = ["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE", "OUT_OF_SERVICE"] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export type Room = {
  roomId: number;
  branchId: number;
  branchCode: string;
  roomNumber: string;
  roomName: string | null;
  floor: number;
  locationZone: string | null;
  roomStatus: RoomStatus;
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
