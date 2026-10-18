import { requireChainScope, route } from "@/app/lib/server/http";
import { createRoomType, getRoomType, listRoomTypes, roomTypeInputSchema } from "@/app/lib/server/repos/room-type.repo";
import { withTx } from "@/app/lib/server/tx";

export const GET = route({ permission: "ROOM_VIEW" }, async () => listRoomTypes());

export const POST = route({ permission: "ROOM_MANAGE", body: roomTypeInputSchema }, async ({ session, body }) => {
  requireChainScope(session, "Room types");
  const type = await withTx(session, async (db) => getRoomType(db, await createRoomType(db, body)));
  return Response.json(type, { status: 201 });
});
