import { api } from "@/app/lib/api-client";
import type { Promotion, PromotionInput } from "./types";

export function fetchPromotions(signal?: AbortSignal) {
  return api<Promotion[]>("/api/promotions", { signal });
}

export function createPromotion(input: PromotionInput) {
  return api<Promotion>("/api/promotions", { method: "POST", body: input });
}

export function updatePromotion(id: number, input: PromotionInput) {
  return api<Promotion>(`/api/promotions/${id}`, { method: "PATCH", body: input });
}

export function deletePromotion(id: number) {
  return api<{ ok: true }>(`/api/promotions/${id}`, { method: "DELETE" });
}

/** "10%" or "฿500.00" */
export function discountLabel(p: Pick<Promotion, "discountType" | "discountValue">, money: (n: number) => string) {
  return p.discountType === "PERCENT" ? `${p.discountValue}%` : money(p.discountValue);
}
