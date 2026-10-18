import type { Metadata } from "next";
import PromotionPage from "@/app/components/portal/promotion/PromotionPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Promotions" };

export default function Page() {
  return (
    <RequirePermission permission="PROMOTION_MANAGE">
      <PromotionPage />
    </RequirePermission>
  );
}
