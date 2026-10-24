import { branchScope } from "@/app/lib/server/auth";
import { route } from "@/app/lib/server/http";
import { listRoomImageLibrary } from "@/app/lib/server/repos/room.repo";

/** Photos already in room galleries — the room form picks a gallery from these. */
export const GET = route({ permission: "ROOM_MANAGE" }, async ({ session }) =>
  listRoomImageLibrary(branchScope(session)),
);
