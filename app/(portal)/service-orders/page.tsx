import type { Metadata } from "next";
import ServiceOrderPage from "@/app/components/portal/service-order/ServiceOrderPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Service orders" };

export default function Page() {
  return (
    <RequirePermission permission="SERVICE_VIEW">
      <ServiceOrderPage />
    </RequirePermission>
  );
}
