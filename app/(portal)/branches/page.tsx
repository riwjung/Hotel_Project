import type { Metadata } from "next";
import BranchPage from "@/app/components/portal/branch/BranchPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Branches" };

export default function Page() {
  return (
    <RequirePermission permission="BRANCH_VIEW">
      <BranchPage />
    </RequirePermission>
  );
}
