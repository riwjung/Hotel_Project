import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { roomStatusSchema, setRoomStatus } from "@/app/lib/server/repos/room.repo";
import { withTx } from "@/app/lib/server/tx";

// Returns the status the database kept: R15 holds a room with an open repair in MAINTENANCE.
export const POST = route({ permission: "ROOM_MANAGE", body: roomStatusSchema }, async ({ session, params, body }) => {
  const roomStatus = await withTx(session, (db) => setRoomStatus(db, idParam(params), branchScope(session), body.roomStatus));
  return { roomStatus };
});
