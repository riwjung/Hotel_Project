import type { Metadata } from "next";
import BookingCreatePage from "@/app/components/portal/booking/BookingCreatePage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "New booking" };

export default function Page() {
  return (
    <RequirePermission permission="BOOKING_MANAGE">
      <BookingCreatePage />
    </RequirePermission>
  );
}
