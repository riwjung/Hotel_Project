import { branchScope } from "@/app/lib/server/auth";
import { HttpError, idParam, route } from "@/app/lib/server/http";
import { getBookingDetail } from "@/app/lib/server/repos/booking-detail.repo";

export const GET = route({ permission: "BOOKING_VIEW" }, async ({ session, params }) => {
  const booking = await getBookingDetail(idParam(params), branchScope(session));
  if (!booking) throw new HttpError(404, "NOT_FOUND", "Booking not found");
  return booking;
});
