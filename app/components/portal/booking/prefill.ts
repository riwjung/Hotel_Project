// What the availability grid passes to /bookings/new (?branchId=&roomId=&checkIn=&checkOut=).
// Malformed values are dropped, so a hand-edited URL just starts an empty form.
import dayjs from "dayjs";

export type BookingPrefill = { branchId?: number; roomId?: number; checkIn?: string; checkOut?: string };

type Query = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function positiveId(v: string | string[] | undefined): number | undefined {
  const n = Number(first(v));
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/** 'YYYY-MM-DD' that is a real calendar date (dayjs would roll 2026-02-31 over into March). */
function isoDate(v: string | string[] | undefined): string | undefined {
  const s = first(v);
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) && dayjs(s).format("YYYY-MM-DD") === s ? s : undefined;
}

export function parseBookingPrefill(query: Query): BookingPrefill {
  const checkIn = isoDate(query.checkIn);
  const checkOut = isoDate(query.checkOut);
  const stay = checkIn && checkOut && checkIn < checkOut ? { checkIn, checkOut } : {};
  return { branchId: positiveId(query.branchId), roomId: positiveId(query.roomId), ...stay };
}
