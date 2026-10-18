import { api } from "@/app/lib/api-client";
import type { Amenity, AmenityInput } from "./types";

export function fetchAmenities(signal?: AbortSignal) {
  return api<Amenity[]>("/api/amenities", { signal });
}

export function createAmenity(input: AmenityInput) {
  return api<Amenity>("/api/amenities", { method: "POST", body: input });
}

export function updateAmenity(id: number, input: AmenityInput) {
  return api<Amenity>(`/api/amenities/${id}`, { method: "PATCH", body: input });
}

export function deleteAmenity(id: number) {
  return api<{ ok: true }>(`/api/amenities/${id}`, { method: "DELETE" });
}
