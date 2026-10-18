import { HttpError, idParam, requireChainScope, route } from "@/app/lib/server/http";
import { deleteRoomType, getRoomType, roomTypeInputSchema, updateRoomType } from "@/app/lib/server/repos/room-type.repo";
import { withTx } from "@/app/lib/server/tx";

const notFound = () => new HttpError(404, "NOT_FOUND", "Room type not found");

export const PATCH = route({ permission: "ROOM_MANAGE", body: roomTypeInputSchema }, async ({ session, params, body }) => {
  requireChainScope(session, "Room types");
  const id = idParam(params);
  return withTx(session, async (db) => {
    if (!(await updateRoomType(db, id, body))) throw notFound();
    return getRoomType(db, id);
  });
});

export const DELETE = route({ permission: "ROOM_MANAGE" }, async ({ session, params }) => {
  requireChainScope(session, "Room types");
  const id = idParam(params);
  await withTx(session, async (db) => {
    if (!(await deleteRoomType(db, id))) throw notFound();
  });
  return { ok: true };
});
