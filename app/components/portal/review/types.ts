// Review types — codes match the CHECKs in db/schema/075_g_transactions.sql
// review has no reply text column: "handled by" (reply_by_emp_id) records who moderated it.

export const REVIEW_STATUSES = ["PENDING", "PUBLISHED", "HIDDEN"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export type Review = {
  reviewId: number;
  bookingId: number;
  bookingCode: string;
  branchId: number;
  branchCode: string;
  customerName: string;
  roomRating: number;
  serviceRating: number;
  staffRating: number;
  averageRating: number;
  comment: string | null;
  reviewDate: string;
  reviewStatus: ReviewStatus;
  handledByName: string | null;
};

export type ReviewFilter = { branchId?: number; status?: ReviewStatus };

/** Published averages per branch */
export type ReviewSummaryRow = {
  branchId: number;
  branchCode: string;
  branchName: string;
  publishedCount: number;
  pendingCount: number;
  roomAvg: number | null;
  serviceAvg: number | null;
  staffAvg: number | null;
  overallAvg: number | null;
};

/** A checked-out booking with no review yet (R10 + one review per booking) */
export type ReviewableBooking = {
  bookingId: number;
  bookingCode: string;
  customerName: string;
  checkOutDate: string;
};

/** Body of POST /api/reviews — a guest comment card typed in by staff */
export type ReviewInput = {
  bookingId: number;
  roomRating: number;
  serviceRating: number;
  staffRating: number;
  comment: string | null;
};

export type ReviewStatusInput = { toStatus: "PUBLISHED" | "HIDDEN" };
