import type { Metadata } from "next";
import BookingListPage from "@/app/components/portal/booking/BookingListPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Bookings" };

export default function Page() {
  return (
    <RequirePermission permission="BOOKING_VIEW">
      <BookingListPage />
    </RequirePermission>
  );
}
