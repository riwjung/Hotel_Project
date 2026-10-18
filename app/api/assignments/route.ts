import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import { assignmentFilterSchema, listAssignments } from "@/app/lib/server/repos/assignment.repo";

export const GET = route({ permission: "ASSIGNMENT_MANAGE" }, async ({ req, session }) =>
  listAssignments(branchScope(session), parseQuery(req, assignmentFilterSchema)),
);
