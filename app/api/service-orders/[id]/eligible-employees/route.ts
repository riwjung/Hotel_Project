import { branchScope } from "@/app/lib/server/auth";
import { idParam, route } from "@/app/lib/server/http";
import { listEligibleEmployees } from "@/app/lib/server/repos/service-order.repo";

export const GET = route({ permission: "ASSIGNMENT_MANAGE" }, async ({ session, params }) =>
  listEligibleEmployees(idParam(params), branchScope(session)),
);
