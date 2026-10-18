// Payment list types — codes match the CHECKs in db/schema/075_g_transactions.sql
import type { PaymentMethod, PaymentStatus } from "../booking/types";

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const satisfies readonly PaymentStatus[];
export const PAYMENT_KINDS = ["DEPOSIT", "FULL", "BALANCE", "REFUND"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export type PaymentRow = {
  paymentId: number;
  bookingId: number;
  bookingCode: string;
  branchId: number;
  branchCode: string;
  customerName: string;
  amount: number;
  paymentType: PaymentKind;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionRef: string | null;
  paymentStatus: PaymentStatus;
  /** null = paid online */
  receivedByName: string | null;
};

export type PaymentFilter = {
  branchId?: number;
  status?: PaymentStatus;
  type?: PaymentKind;
  from?: string;
  to?: string;
  q?: string;
};

/** Body of POST /api/payments/:id/status — only a pending payment moves (R17) */
export type PaymentStatusInput = { toStatus: "PAID" | "FAILED" };

/** Body of POST /api/bookings/:id/refunds — refunds are booking-level and capped by R17 */
export type RefundInput = {
  amount: number;
  paymentMethod: PaymentMethod;
  transactionRef?: string | null;
};
