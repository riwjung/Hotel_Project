import "server-only";
import { z } from "zod";
import {
  MANUAL_ROOM_STATUSES,
  ROOM_STATUSES,
  type ManualRoomStatus,
  type Room,
  type RoomFilter,
  type RoomInput,
  type RoomStatus,
} from "@/app/components/portal/room/types";
import { HttpError } from "../http";
import { query, type Db } from "../db";

export const roomFilterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  status: z.enum(ROOM_STATUSES).optional(),
});

export const roomInputSchema = z.object({
  branchId: z.number().int().positive().nullish(),
  roomTypeId: z.number().int().positive(),
  roomNumber: z.string().trim().min(1).max(10),
  roomName: z.string().trim().max(100).nullish().transform((v) => v || null),
  floor: z.number().int().min(-5).max(200),
  locationZone: z.string().trim().max(50).nullish().transform((v) => v || null),
  description: z.string().trim().max(255).nullish().transform((v) => v || null),
  roomStatus: z.enum(MANUAL_ROOM_STATUSES).optional(),
}) satisfies z.ZodType<RoomInput>;

export const roomStatusSchema = z.object({ roomStatus: z.enum(MANUAL_ROOM_STATUSES) });

const SELECT_ROOM = `
  SELECT
    r.room_id        AS "roomId",
    r.branch_id      AS "branchId",
    b.branch_code    AS "branchCode",
    r.room_number    AS "roomNumber",
    r.room_name      AS "roomName",
    r.floor,
    r.location_zone  AS "locationZone",
    r.room_status    AS "roomStatus",
    r.description,
    t.room_type_id   AS "roomTypeId",
    t.type_code      AS "typeCode",
    t.type_name      AS "typeName",
    t.capacity,
    t.bed_type       AS "bedType"
  FROM room r
  JOIN branch b    ON b.branch_id = r.branch_id
  JOIN room_type t ON t.room_type_id = r.room_type_id`;

/** @param scope null = all branches; a branch-scoped user can never widen it via filter */
export function listRooms(scope: number | null, filter: RoomFilter): Promise<Room[]> {
  const branchId = scope ?? filter.branchId ?? null;
  return query<Room>(
    `${SELECT_ROOM}
     WHERE ($1::int IS NULL OR r.branch_id = $1)
       AND ($2::text IS NULL OR r.room_status = $2)
     ORDER BY b.branch_code, r.room_number`,
    [branchId, filter.status ?? null],
  );
}

export async function getRoom(db: Db, id: number, scope: number | null): Promise<Room | null> {
  const { rows } = await db.query<Room>(`${SELECT_ROOM} WHERE r.room_id = $1 AND ($2::int IS NULL OR r.branch_id = $2)`, [id, scope]);
  return rows[0] ?? null;
}

export async function createRoom(db: Db, scope: number | null, input: RoomInput): Promise<number> {
  const branchId = scope ?? input.branchId;
  if (!branchId) throw new HttpError(400, "VALIDATION", "Select a branch");
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO room (branch_id, room_type_id, room_number, room_name, floor, location_zone, description, room_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING room_id AS id`,
    [branchId, input.roomTypeId, input.roomNumber, input.roomName, input.floor, input.locationZone, input.description, input.roomStatus ?? "AVAILABLE"],
  );
  return rows[0].id;
}

/** A new type while the room has active bookings is rejected by R3d. Status is changed separately. */
export async function updateRoom(db: Db, id: number, scope: number | null, input: RoomInput): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE room SET room_type_id = $3, room_number = $4, room_name = $5, floor = $6, location_zone = $7, description = $8
     WHERE room_id = $1 AND ($2::int IS NULL OR branch_id = $2)`,
    [id, scope, input.roomTypeId, input.roomNumber, input.roomName, input.floor, input.locationZone, input.description],
  );
  return rowCount === 1;
}

/**
 * Hand-set status. OCCUPIED is never set or cleared by hand (check-in / check-out own it).
 * Returns the status the database kept — R15 holds a room with an open repair in MAINTENANCE.
 */
export async function setRoomStatus(db: Db, id: number, scope: number | null, status: ManualRoomStatus): Promise<RoomStatus> {
  const { rows } = await db.query<{ current: RoomStatus; roomNumber: string }>(
    `SELECT room_status AS current, room_number AS "roomNumber" FROM room
     WHERE room_id = $1 AND ($2::int IS NULL OR branch_id = $2) FOR UPDATE`,
    [id, scope],
  );
  if (!rows[0]) throw new HttpError(404, "NOT_FOUND", "Room not found");
  if (rows[0].current === "OCCUPIED") {
    throw new HttpError(422, "OCCUPIED", `Room ${rows[0].roomNumber} has a guest in house — check the booking out first`);
  }
  const { rows: updated } = await db.query<{ status: RoomStatus }>(
    `UPDATE room SET room_status = $2 WHERE room_id = $1 RETURNING room_status AS status`,
    [id, status],
  );
  return updated[0].status;
}

/** Rooms with bookings, tasks or repairs are still referenced → 409 IN_USE. */
export async function deleteRoom(db: Db, id: number, scope: number | null): Promise<boolean> {
  const { rowCount } = await db.query(`DELETE FROM room WHERE room_id = $1 AND ($2::int IS NULL OR branch_id = $2)`, [id, scope]);
  return rowCount === 1;
}
