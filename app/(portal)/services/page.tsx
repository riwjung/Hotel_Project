import type { Metadata } from "next";
import ServiceCatalogPage from "@/app/components/portal/service/ServiceCatalogPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Service catalog" };

export default function Page() {
  return (
    <RequirePermission permission="SERVICE_VIEW">
      <ServiceCatalogPage />
    </RequirePermission>
  );
}
