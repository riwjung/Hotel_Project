import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import { createReview, listReviews, reviewFilterSchema, reviewInputSchema } from "@/app/lib/server/repos/review.repo";
import { withTx } from "@/app/lib/server/tx";

export const GET = route({ permission: "REVIEW_VIEW" }, async ({ req, session }) =>
  listReviews(branchScope(session), parseQuery(req, reviewFilterSchema)),
);

export const POST = route(
  { permission: "REVIEW_REPLY", body: reviewInputSchema },
  async ({ session, body }) => {
    const reviewId = await withTx(session, (db) => createReview(db, branchScope(session), body));
    return Response.json({ reviewId }, { status: 201 });
  },
);
