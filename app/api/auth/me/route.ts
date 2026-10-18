import { route } from "@/app/lib/server/http";

// Return the signed identity, not the temporary working-branch scope.
export const GET = route({ ignoreBranchSelection: true }, async ({ session }) => session);
