import { z } from "zod";
import { ROOM_STATUSES } from "@/app/components/portal/room/types";
import { branchScope } from "@/app/lib/server/auth";
import { HttpError, route } from "@/app/lib/server/http";
import { listRooms } from "@/app/lib/server/repos/room.repo";

const filterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  status: z.enum(ROOM_STATUSES).optional(),
});

export const GET = route({ permission: "ROOM_VIEW" }, async ({ req, session }) => {
  const parsed = filterSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw new HttpError(400, "VALIDATION", "Invalid room filter");
  return listRooms(branchScope(session), parsed.data);
});
