import { z } from "zod";
import { BOOKING_STATUSES } from "@/app/components/portal/booking/types";
import { branchScope } from "@/app/lib/server/auth";
import { HttpError, route } from "@/app/lib/server/http";
import { bookingCreateSchema, createBooking } from "@/app/lib/server/repos/booking-create.repo";
import { listBookings } from "@/app/lib/server/repos/booking-list.repo";
import { withTx } from "@/app/lib/server/tx";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const filterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  status: z.enum(BOOKING_STATUSES).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  q: z.string().trim().max(100).optional(),
}).refine((filter) => !filter.from || !filter.to || filter.from <= filter.to, {
  message: "The from date must not be after the to date",
});

export const GET = route({ permission: "BOOKING_VIEW" }, async ({ req, session }) => {
  const parsed = filterSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw new HttpError(400, "VALIDATION", parsed.error.issues[0].message);
  return listBookings(branchScope(session), parsed.data);
});

export const POST = route(
  { permission: "BOOKING_MANAGE", body: bookingCreateSchema },
  async ({ session, body }) => {
    const created = await withTx(session, (db) =>
      createBooking(db, branchScope(session), session.employeeId, body),
    );
    return Response.json(created, { status: 201 });
  },
);
