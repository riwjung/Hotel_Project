import { api } from "@/app/lib/api-client";
import type {
  Review,
  ReviewableBooking,
  ReviewFilter,
  ReviewInput,
  ReviewStatusInput,
  ReviewSummaryRow,
} from "./types";

export function fetchReviews(filter: ReviewFilter, signal?: AbortSignal) {
  return api<Review[]>("/api/reviews", { params: filter, signal });
}

export function fetchReviewSummary(signal?: AbortSignal) {
  return api<ReviewSummaryRow[]>("/api/reviews/summary", { signal });
}

export function fetchReviewableBookings(signal?: AbortSignal) {
  return api<ReviewableBooking[]>("/api/reviews/reviewable-bookings", { signal });
}

export function createReview(input: ReviewInput) {
  return api<{ reviewId: number }>("/api/reviews", { method: "POST", body: input });
}

export function moderateReview(id: number, toStatus: ReviewStatusInput["toStatus"]) {
  return api<{ ok: true }>(`/api/reviews/${id}/status`, { method: "POST", body: { toStatus } });
}
