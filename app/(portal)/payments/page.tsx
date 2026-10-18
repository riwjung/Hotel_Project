import type { Metadata } from "next";
import PaymentPage from "@/app/components/portal/payment/PaymentPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Payments" };

export default function Page() {
  return (
    <RequirePermission permission="PAYMENT_VIEW">
      <PaymentPage />
    </RequirePermission>
  );
}
