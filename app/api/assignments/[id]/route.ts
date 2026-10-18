import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { qualitySchema, rateAssignment } from "@/app/lib/server/repos/assignment.repo";
import { withTx } from "@/app/lib/server/tx";

export const PATCH = route({ permission: "ASSIGNMENT_MANAGE", body: qualitySchema }, async ({ session, params, body }) => {
  await withTx(session, (db) => rateAssignment(db, idParam(params), branchScope(session), body.qualityScore));
  return { ok: true };
});
