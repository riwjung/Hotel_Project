import type { Metadata } from "next";
import AttendancePage from "@/app/components/portal/attendance/AttendancePage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Attendance" };

export default function Page() {
  return (
    <RequirePermission permission="ATTENDANCE_VIEW">
      <AttendancePage />
    </RequirePermission>
  );
}
