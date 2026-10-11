import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookingDetailPage from "@/app/components/portal/booking/BookingDetailPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Booking details" };

export default async function Page({ params }: PageProps<"/bookings/[id]">) {
  const { id: rawId } = await params;
  const bookingId = Number(rawId);
  if (!Number.isInteger(bookingId) || bookingId <= 0) notFound();
  return (
    <RequirePermission permission="BOOKING_VIEW">
      <BookingDetailPage bookingId={bookingId} />
    </RequirePermission>
  );
}
