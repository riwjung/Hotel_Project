import type { Metadata } from "next";
import AvailabilityPage from "@/app/components/portal/availability/AvailabilityPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Availability" };

export default function Page() {
  return (
    <RequirePermission permission="BOOKING_VIEW">
      <AvailabilityPage />
    </RequirePermission>
  );
}
