import type { Metadata } from "next";
import SchedulePage from "@/app/components/portal/schedule/SchedulePage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Work schedules" };

export default function Page() {
  return (
    <RequirePermission permission="SCHEDULE_VIEW">
      <SchedulePage />
    </RequirePermission>
  );
}
