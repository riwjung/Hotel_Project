import { api } from "@/app/lib/api-client";
import type {
  AvailabilityFilter,
  AvailableRoom,
  BookingCreated,
  BookingCreateInput,
  BookingDetail,
  BookingFilter,
  BookingListItem,
  BookingStatus,
  CheckInInput,
  CheckOutInput,
  PaymentInput,
} from "./types";

export function fetchBookings(filter: BookingFilter, signal?: AbortSignal) {
  return api<BookingListItem[]>("/api/bookings", { params: filter, signal });
}

export function fetchAvailableRooms(filter: AvailabilityFilter, signal?: AbortSignal) {
  return api<AvailableRoom[]>("/api/bookings/availability", { params: filter, signal });
}

export function createBooking(input: BookingCreateInput) {
  return api<BookingCreated>("/api/bookings", { method: "POST", body: input });
}

export function fetchBooking(id: number, signal?: AbortSignal) {
  return api<BookingDetail>(`/api/bookings/${id}`, { signal });
}

export function changeBookingStatus(id: number, toStatus: BookingStatus, remark?: string | null) {
  return api<{ ok: true }>(`/api/bookings/${id}/status`, {
    method: "POST",
    body: { toStatus, remark },
  });
}

export function checkInBooking(id: number, input: CheckInInput) {
  return api<{ ok: true }>(`/api/bookings/${id}/check-in`, { method: "POST", body: input });
}

export function recordBookingPayment(id: number, input: PaymentInput) {
  return api<{ ok: true }>(`/api/bookings/${id}/payments`, { method: "POST", body: input });
}

export function checkOutBooking(id: number, input: CheckOutInput) {
  return api<{ ok: true }>(`/api/bookings/${id}/check-out`, { method: "POST", body: input });
}
