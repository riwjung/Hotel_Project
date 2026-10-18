import { branchScope } from "@/app/lib/server/auth";
import { route } from "@/app/lib/server/http";
import { listRoleOptions } from "@/app/lib/server/repos/role.repo";

// For the employee form: only roles the caller is allowed to give.
export const GET = route({ permission: "EMPLOYEE_VIEW" }, async ({ session }) => listRoleOptions(session, branchScope(session)));
