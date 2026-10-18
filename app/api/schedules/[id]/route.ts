import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { scheduleStatusSchema, setScheduleStatus } from "@/app/lib/server/repos/schedule.repo";
import { withTx } from "@/app/lib/server/tx";

export const PATCH = route({ permission: "SCHEDULE_MANAGE", body: scheduleStatusSchema }, async ({ session, params, body }) => {
  await withTx(session, (db) => setScheduleStatus(db, idParam(params), branchScope(session), body));
  return { ok: true };
});
