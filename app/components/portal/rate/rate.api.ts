import { api } from "@/app/lib/api-client";
import type { RateFilter, RateInput, RoomRate } from "./types";

export function fetchRates(filter: RateFilter, signal?: AbortSignal) {
  return api<RoomRate[]>("/api/room-rates", { params: filter, signal });
}

export function createRate(input: RateInput) {
  return api<RoomRate>("/api/room-rates", { method: "POST", body: input });
}

export function updateRate(id: number, input: RateInput) {
  return api<RoomRate>(`/api/room-rates/${id}`, { method: "PATCH", body: input });
}

export function deleteRate(id: number) {
  return api<{ ok: true }>(`/api/room-rates/${id}`, { method: "DELETE" });
}
