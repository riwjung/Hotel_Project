// Room type master data (db/schema/030_c_rooms.sql) — shared by every branch.
// Amenities are the M:N room_type_amenity (1NF fix from the original ER).

export type RoomType = {
  roomTypeId: number;
  typeCode: string;
  typeName: string;
  description: string | null;
  capacity: number;
  bedType: string;
  basePrice: number;
  amenityIds: number[];
  amenityNames: string[];
  roomCount: number;
  rateCount: number;
};

/** Body of POST /api/room-types and PATCH /api/room-types/:id */
export type RoomTypeInput = {
  typeCode: string;
  typeName: string;
  description: string | null;
  capacity: number;
  bedType: string;
  basePrice: number;
  amenityIds: number[];
};
