import type { Metadata } from "next";
import BookingCreatePage from "@/app/components/portal/booking/BookingCreatePage";
import { parseBookingPrefill } from "@/app/components/portal/booking/prefill";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "New booking" };

/** ?branchId=&roomId=&checkIn=&checkOut= (from the availability grid) pre-fills the form. */
export default async function Page({ searchParams }: PageProps<"/bookings/new">) {
  const prefill = parseBookingPrefill(await searchParams);
  return (
    <RequirePermission permission="BOOKING_MANAGE">
      <BookingCreatePage prefill={prefill} />
    </RequirePermission>
  );
}
