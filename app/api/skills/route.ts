import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import { getSkillMatrix, setSkill, skillFilterSchema, skillInputSchema } from "@/app/lib/server/repos/skill.repo";
import { withTx } from "@/app/lib/server/tx";

export const GET = route({ permission: "ASSIGNMENT_MANAGE" }, async ({ req, session }) =>
  getSkillMatrix(branchScope(session), parseQuery(req, skillFilterSchema).branchId),
);

export const PUT = route({ permission: "ASSIGNMENT_MANAGE", body: skillInputSchema }, async ({ session, body }) => {
  await withTx(session, (db) => setSkill(db, branchScope(session), body));
  return { ok: true };
});
