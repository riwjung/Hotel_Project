import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import { monthFilterSchema, monthlyReport } from "@/app/lib/server/repos/attendance.repo";

export const GET = route({ permission: "ATTENDANCE_VIEW" }, async ({ req, session }) => {
  const { branchId, month } = parseQuery(req, monthFilterSchema);
  return monthlyReport(branchScope(session), branchId, month);
});
