import { branchScope } from "@/app/lib/server/auth";
import { route } from "@/app/lib/server/http";
import { getDashboard } from "@/app/lib/server/repos/dashboard.repo";

export const GET = route({ permission: "DASHBOARD_VIEW" }, async ({ session }) =>
  getDashboard(branchScope(session)),
);
