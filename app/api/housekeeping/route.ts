import { z } from "zod";
import { HOUSEKEEPING_STATUSES } from "@/app/components/portal/housekeeping/types";
import { branchScope } from "@/app/lib/server/auth";
import { HttpError, route } from "@/app/lib/server/http";
import { listHousekeeping } from "@/app/lib/server/repos/housekeeping.repo";

const filterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(HOUSEKEEPING_STATUSES).optional(),
});

export const GET = route({ permission: "HOUSEKEEPING_VIEW" }, async ({ req, session }) => {
  const parsed = filterSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw new HttpError(400, "VALIDATION", "Invalid housekeeping filter");
  return listHousekeeping(branchScope(session), parsed.data);
});
