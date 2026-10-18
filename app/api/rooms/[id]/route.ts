import { branchScope } from "@/app/lib/server/auth";
import { HttpError, idParam, route } from "@/app/lib/server/http";
import { deleteRoom, getRoom, getRoomDetail, roomInputSchema, updateRoom } from "@/app/lib/server/repos/room.repo";
import { withTx } from "@/app/lib/server/tx";

const notFound = () => new HttpError(404, "NOT_FOUND", "Room not found");

export const GET = route({ permission: "ROOM_VIEW" }, async ({ session, params }) => {
  const room = await getRoomDetail(idParam(params), branchScope(session));
  if (!room) throw notFound();
  return room;
});

export const PATCH = route({ permission: "ROOM_MANAGE", body: roomInputSchema }, async ({ session, params, body }) => {
  const id = idParam(params);
  const scope = branchScope(session);
  return withTx(session, async (db) => {
    if (!(await updateRoom(db, id, scope, body))) throw notFound();
    return getRoom(db, id, scope);
  });
});

export const DELETE = route({ permission: "ROOM_MANAGE" }, async ({ session, params }) => {
  const id = idParam(params);
  await withTx(session, async (db) => {
    if (!(await deleteRoom(db, id, branchScope(session)))) throw notFound();
  });
  return { ok: true };
});
