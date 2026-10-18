import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import { createRoom, getRoom, listRooms, roomFilterSchema, roomInputSchema } from "@/app/lib/server/repos/room.repo";
import { withTx } from "@/app/lib/server/tx";

export const GET = route({ permission: "ROOM_VIEW" }, async ({ req, session }) =>
  listRooms(branchScope(session), parseQuery(req, roomFilterSchema)),
);

export const POST = route({ permission: "ROOM_MANAGE", body: roomInputSchema }, async ({ session, body }) => {
  const scope = branchScope(session);
  const room = await withTx(session, async (db) => getRoom(db, await createRoom(db, scope, body), scope));
  return Response.json(room, { status: 201 });
});
