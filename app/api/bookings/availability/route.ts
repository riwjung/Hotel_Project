import { branchScope } from "@/app/lib/server/auth";
import { HttpError, route } from "@/app/lib/server/http";
import { availabilitySchema, listAvailableRooms } from "@/app/lib/server/repos/booking-create.repo";

export const GET = route({ permission: "BOOKING_MANAGE" }, async ({ req, session }) => {
  const parsed = availabilitySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw new HttpError(400, "VALIDATION", parsed.error.issues[0].message);
  return listAvailableRooms(branchScope(session), parsed.data);
});
