import "server-only";
import type { Room, RoomFilter } from "@/app/components/portal/room/types";
import { query } from "../db";

/** @param scope null = all branches; a branch-scoped user can never widen it via filter */
export function listRooms(scope: number | null, filter: RoomFilter): Promise<Room[]> {
  const branchId = scope ?? filter.branchId ?? null;
  return query<Room>(
    `SELECT
       r.room_id        AS "roomId",
       r.branch_id      AS "branchId",
       b.branch_code    AS "branchCode",
       r.room_number    AS "roomNumber",
       r.room_name      AS "roomName",
       r.floor,
       r.location_zone  AS "locationZone",
       r.room_status    AS "roomStatus",
       t.room_type_id   AS "roomTypeId",
       t.type_code      AS "typeCode",
       t.type_name      AS "typeName",
       t.capacity,
       t.bed_type       AS "bedType"
     FROM room r
     JOIN branch b    ON b.branch_id = r.branch_id
     JOIN room_type t ON t.room_type_id = r.room_type_id
     WHERE ($1::int IS NULL OR r.branch_id = $1)
       AND ($2::text IS NULL OR r.room_status = $2)
     ORDER BY b.branch_code, r.room_number`,
    [branchId, filter.status ?? null],
  );
}
