import type { Metadata } from "next";
import CustomerPage from "@/app/components/portal/customer/CustomerPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Customers" };

export default function Page() {
  return (
    <RequirePermission permission="CUSTOMER_VIEW">
      <CustomerPage />
    </RequirePermission>
  );
}
