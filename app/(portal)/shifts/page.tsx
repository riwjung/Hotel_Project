import type { Metadata } from "next";
import ShiftPage from "@/app/components/portal/shift/ShiftPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Shifts" };

export default function Page() {
  return (
    <RequirePermission permission="SCHEDULE_VIEW">
      <ShiftPage />
    </RequirePermission>
  );
}
