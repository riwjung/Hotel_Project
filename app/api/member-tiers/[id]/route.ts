import { HttpError, idParam, route } from "@/app/lib/server/http";
import { withTx } from "@/app/lib/server/tx";
import {
  deleteMemberTier,
  getMemberTier,
  memberTierInputSchema,
  updateMemberTier,
} from "@/app/lib/server/repos/member-tier.repo";

const notFound = () => new HttpError(404, "NOT_FOUND", "Member tier not found");

export const PATCH = route(
  { permission: "PROMOTION_MANAGE", body: memberTierInputSchema },
  async ({ session, params, body }) => {
    const id = idParam(params);
    return withTx(session, async (db) => {
      if (!(await updateMemberTier(db, id, body))) throw notFound();
      return getMemberTier(db, id);
    });
  },
);

export const DELETE = route({ permission: "PROMOTION_MANAGE" }, async ({ session, params }) => {
  const id = idParam(params);
  await withTx(session, async (db) => {
    if (!(await deleteMemberTier(db, id))) throw notFound();
  });
  return { ok: true };
});
