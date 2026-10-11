import type { Metadata } from "next";
import HousekeepingPage from "@/app/components/portal/housekeeping/HousekeepingPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Housekeeping" };

export default function Page() {
  return (
    <RequirePermission permission="HOUSEKEEPING_VIEW">
      <HousekeepingPage />
    </RequirePermission>
  );
}
