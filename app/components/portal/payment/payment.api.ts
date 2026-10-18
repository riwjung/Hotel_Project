import { api } from "@/app/lib/api-client";
import type { PaymentFilter, PaymentRow, PaymentStatusInput, RefundInput } from "./types";

export function fetchPayments(filter: PaymentFilter, signal?: AbortSignal) {
  return api<PaymentRow[]>("/api/payments", { params: filter, signal });
}

export function changePaymentStatus(id: number, toStatus: PaymentStatusInput["toStatus"]) {
  return api<{ ok: true }>(`/api/payments/${id}/status`, { method: "POST", body: { toStatus } });
}

export function createRefund(bookingId: number, input: RefundInput) {
  return api<{ ok: true }>(`/api/bookings/${bookingId}/refunds`, { method: "POST", body: input });
}
