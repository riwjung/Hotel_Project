import { branchScope } from "@/app/lib/server/auth";
import { route } from "@/app/lib/server/http";
import { qualitySummary } from "@/app/lib/server/repos/assignment.repo";

export const GET = route({ permission: "ASSIGNMENT_MANAGE" }, async ({ session }) => qualitySummary(branchScope(session)));
