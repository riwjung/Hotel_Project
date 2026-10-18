import type { Metadata } from "next";
import MaintenancePage from "@/app/components/portal/maintenance/MaintenancePage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Maintenance" };

export default function Page() {
  return (
    <RequirePermission permission="MAINTENANCE_VIEW">
      <MaintenancePage />
    </RequirePermission>
  );
}
