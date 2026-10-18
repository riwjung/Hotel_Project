import { route } from "@/app/lib/server/http";
import { listBranches } from "@/app/lib/server/repos/branch.repo";

/** Header switcher choices must stay visible while a working branch is active. */
export const GET = route(
  { permission: "BRANCH_VIEW", ignoreBranchSelection: true },
  async () => listBranches(null),
);
