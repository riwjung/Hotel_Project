import type { Metadata } from "next";
import MemberTierPage from "@/app/components/portal/tier/MemberTierPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Member tiers" };

export default function Page() {
  return (
    <RequirePermission permission="PROMOTION_MANAGE">
      <MemberTierPage />
    </RequirePermission>
  );
}
