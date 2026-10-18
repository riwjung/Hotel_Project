import { branchScope } from "@/app/lib/server/auth";
import { route } from "@/app/lib/server/http";
import { reviewSummary } from "@/app/lib/server/repos/review.repo";

export const GET = route({ permission: "REVIEW_VIEW" }, async ({ session }) => reviewSummary(branchScope(session)));
