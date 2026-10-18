import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { attendanceInputSchema, recordAttendance } from "@/app/lib/server/repos/attendance.repo";
import { withTx } from "@/app/lib/server/tx";

// A manager's correction; R22 derives the status from the times.
export const PUT = route({ permission: "ATTENDANCE_MANAGE", body: attendanceInputSchema }, async ({ session, params, body }) => {
  await withTx(session, (db) => recordAttendance(db, branchScope(session), idParam(params, "scheduleId"), body));
  return { ok: true };
});
