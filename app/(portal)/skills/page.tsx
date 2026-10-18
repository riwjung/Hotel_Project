import type { Metadata } from "next";
import SkillMatrixPage from "@/app/components/portal/skill/SkillMatrixPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Staff skills" };

export default function Page() {
  return (
    <RequirePermission permission="ASSIGNMENT_MANAGE">
      <SkillMatrixPage />
    </RequirePermission>
  );
}
