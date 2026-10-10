import type { Metadata } from "next";
import DashboardPage from "@/app/components/portal/dashboard/DashboardPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Dashboard" };

export default function Page() {
  return (
    <RequirePermission permission="DASHBOARD_VIEW">
      <DashboardPage />
    </RequirePermission>
  );
}
