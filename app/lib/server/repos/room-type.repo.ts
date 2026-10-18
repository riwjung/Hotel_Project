import "server-only";
import { z } from "zod";
import type { RoomType, RoomTypeInput } from "@/app/components/portal/room-type/types";
import { query, type Db } from "../db";

export const roomTypeInputSchema = z.object({
  typeCode: z.string().trim().toUpperCase().min(2).max(20).regex(/^[A-Z0-9_-]+$/, "Use letters, digits, - or _"),
  typeName: z.string().trim().min(1).max(50),
  description: z.string().trim().max(255).nullish().transform((v) => v || null),
  capacity: z.number().int().min(1).max(20),
  bedType: z.string().trim().min(1).max(30),
  basePrice: z.number().min(0).multipleOf(0.01),
  amenityIds: z.array(z.number().int().positive()).max(50),
}) satisfies z.ZodType<RoomTypeInput>;

const SELECT_TYPE = `
  SELECT t.room_type_id AS "roomTypeId", t.type_code AS "typeCode", t.type_name AS "typeName", t.description,
    t.capacity, t.bed_type AS "bedType", t.base_price AS "basePrice",
    COALESCE(array_agg(a.amenity_id ORDER BY a.amenity_name) FILTER (WHERE a.amenity_id IS NOT NULL), '{}') AS "amenityIds",
    COALESCE(array_agg(a.amenity_name ORDER BY a.amenity_name) FILTER (WHERE a.amenity_id IS NOT NULL), '{}') AS "amenityNames",
    (SELECT count(*) FROM room r WHERE r.room_type_id = t.room_type_id) AS "roomCount",
    (SELECT count(*) FROM room_rate rr WHERE rr.room_type_id = t.room_type_id) AS "rateCount"
  FROM room_type t
  LEFT JOIN room_type_amenity rta ON rta.room_type_id = t.room_type_id
  LEFT JOIN amenity a ON a.amenity_id = rta.amenity_id`;

export function listRoomTypes(): Promise<RoomType[]> {
  return query<RoomType>(`${SELECT_TYPE} GROUP BY t.room_type_id ORDER BY t.base_price, t.type_code`);
}

export async function getRoomType(db: Db, id: number): Promise<RoomType | null> {
  const { rows } = await db.query<RoomType>(`${SELECT_TYPE} WHERE t.room_type_id = $1 GROUP BY t.room_type_id`, [id]);
  return rows[0] ?? null;
}

/** Replace the amenity set; rows that stay keep their note. */
async function setAmenities(db: Db, roomTypeId: number, amenityIds: number[]) {
  await db.query(
    `DELETE FROM room_type_amenity WHERE room_type_id = $1 AND NOT (amenity_id = ANY($2::int[]))`,
    [roomTypeId, amenityIds],
  );
  await db.query(
    `INSERT INTO room_type_amenity (room_type_id, amenity_id)
     SELECT $1, unnest($2::int[])
     ON CONFLICT (room_type_id, amenity_id) DO NOTHING`,
    [roomTypeId, amenityIds],
  );
}

export async function createRoomType(db: Db, input: RoomTypeInput): Promise<number> {
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO room_type (type_code, type_name, description, capacity, bed_type, base_price)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING room_type_id AS id`,
    [input.typeCode, input.typeName, input.description, input.capacity, input.bedType, input.basePrice],
  );
  await setAmenities(db, rows[0].id, input.amenityIds);
  return rows[0].id;
}

/** Shrinking capacity below an active stay is rejected by R11c. */
export async function updateRoomType(db: Db, id: number, input: RoomTypeInput): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE room_type SET type_code = $2, type_name = $3, description = $4, capacity = $5, bed_type = $6, base_price = $7
     WHERE room_type_id = $1`,
    [id, input.typeCode, input.typeName, input.description, input.capacity, input.bedType, input.basePrice],
  );
  if (rowCount !== 1) return false;
  await setAmenities(db, id, input.amenityIds);
  return true;
}

/** Types with rooms or rates are still referenced → 409 IN_USE. */
export async function deleteRoomType(db: Db, id: number): Promise<boolean> {
  const { rowCount } = await db.query(`DELETE FROM room_type WHERE room_type_id = $1`, [id]);
  return rowCount === 1;
}
