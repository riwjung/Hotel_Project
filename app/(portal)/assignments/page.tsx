import type { Metadata } from "next";
import AssignmentPage from "@/app/components/portal/assignment/AssignmentPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Assignments" };

export default function Page() {
  return (
    <RequirePermission permission="ASSIGNMENT_MANAGE">
      <AssignmentPage />
    </RequirePermission>
  );
}
