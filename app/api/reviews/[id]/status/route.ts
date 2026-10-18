import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { moderateReview, reviewStatusSchema } from "@/app/lib/server/repos/review.repo";
import { withTx } from "@/app/lib/server/tx";

export const POST = route(
  { permission: "REVIEW_REPLY", body: reviewStatusSchema },
  async ({ session, params, body }) => {
    await withTx(session, (db) =>
      moderateReview(db, idParam(params), branchScope(session), session.employeeId, body.toStatus),
    );
    return { ok: true };
  },
);
