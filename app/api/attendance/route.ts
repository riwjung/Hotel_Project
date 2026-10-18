import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import { dayFilterSchema, listDay } from "@/app/lib/server/repos/attendance.repo";

export const GET = route({ permission: "ATTENDANCE_VIEW" }, async ({ req, session }) => {
  const { branchId, date } = parseQuery(req, dayFilterSchema);
  return listDay(branchScope(session), branchId, date);
});
