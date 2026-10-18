import type { Metadata } from "next";
import BranchServicePage from "@/app/components/portal/branch-service/BranchServicePage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Branch services" };

export default function Page() {
  return (
    <RequirePermission permission="SERVICE_VIEW">
      <BranchServicePage />
    </RequirePermission>
  );
}
