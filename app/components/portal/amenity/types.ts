// Amenity master data (db/schema/030_c_rooms.sql) — shared by every branch.

export type Amenity = {
  amenityId: number;
  amenityName: string;
  amenityGroup: string;
  /** an @ant-design/icons component name, e.g. "WifiOutlined" (see amenity-icons.tsx) */
  icon: string | null;
  roomTypeCount: number;
};

/** Body of POST /api/amenities and PATCH /api/amenities/:id */
export type AmenityInput = {
  amenityName: string;
  amenityGroup: string;
  icon: string | null;
};
