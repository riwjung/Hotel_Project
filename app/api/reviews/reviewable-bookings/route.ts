import { branchScope } from "@/app/lib/server/auth";
import { route } from "@/app/lib/server/http";
import { listReviewableBookings } from "@/app/lib/server/repos/review.repo";

export const GET = route({ permission: "REVIEW_REPLY" }, async ({ session }) =>
  listReviewableBookings(branchScope(session)),
);
