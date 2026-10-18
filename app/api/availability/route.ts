import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import { getAvailabilityGrid, gridFilterSchema } from "@/app/lib/server/repos/availability.repo";

export const GET = route({ permission: "BOOKING_VIEW" }, async ({ req, session }) =>
  getAvailabilityGrid(branchScope(session), parseQuery(req, gridFilterSchema)),
);
