import "server-only";
import { z } from "zod";
import type { Amenity, AmenityInput } from "@/app/components/portal/amenity/types";
import { query, type Db } from "../db";

export const amenityInputSchema = z.object({
  amenityName: z.string().trim().min(1).max(50),
  amenityGroup: z.string().trim().min(1).max(30),
  icon: z.string().trim().max(50).regex(/^[A-Za-z]*$/, "Use an icon name such as WifiOutlined").nullish().transform((v) => v || null),
}) satisfies z.ZodType<AmenityInput>;

const SELECT_AMENITY = `
  SELECT a.amenity_id AS "amenityId", a.amenity_name AS "amenityName", a.amenity_group AS "amenityGroup", a.icon,
    (SELECT count(*) FROM room_type_amenity rta WHERE rta.amenity_id = a.amenity_id) AS "roomTypeCount"
  FROM amenity a`;

export function listAmenities(): Promise<Amenity[]> {
  return query<Amenity>(`${SELECT_AMENITY} ORDER BY a.amenity_group, a.amenity_name`);
}

export async function getAmenity(db: Db, id: number): Promise<Amenity | null> {
  const { rows } = await db.query<Amenity>(`${SELECT_AMENITY} WHERE a.amenity_id = $1`, [id]);
  return rows[0] ?? null;
}

export async function createAmenity(db: Db, input: AmenityInput): Promise<number> {
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO amenity (amenity_name, amenity_group, icon) VALUES ($1, $2, $3) RETURNING amenity_id AS id`,
    [input.amenityName, input.amenityGroup, input.icon],
  );
  return rows[0].id;
}

export async function updateAmenity(db: Db, id: number, input: AmenityInput): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE amenity SET amenity_name = $2, amenity_group = $3, icon = $4 WHERE amenity_id = $1`,
    [id, input.amenityName, input.amenityGroup, input.icon],
  );
  return rowCount === 1;
}

/** room_type_amenity rows go with it (ON DELETE CASCADE). */
export async function deleteAmenity(db: Db, id: number): Promise<boolean> {
  const { rowCount } = await db.query(`DELETE FROM amenity WHERE amenity_id = $1`, [id]);
  return rowCount === 1;
}
