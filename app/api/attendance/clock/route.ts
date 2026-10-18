import { branchScope } from "@/app/lib/server/auth";
import { route } from "@/app/lib/server/http";
import { clock, clockSchema } from "@/app/lib/server/repos/attendance.repo";
import { withTx } from "@/app/lib/server/tx";

// Own shifts for everyone; other people's shifts need ATTENDANCE_MANAGE (checked in the repo).
export const POST = route({ body: clockSchema }, async ({ session, body }) => {
  await withTx(session, (db) => clock(db, session, branchScope(session), body));
  return { ok: true };
});
