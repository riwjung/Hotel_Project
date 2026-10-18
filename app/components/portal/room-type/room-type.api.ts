import { api } from "@/app/lib/api-client";
import type { RoomType, RoomTypeInput } from "./types";

export function fetchRoomTypes(signal?: AbortSignal) {
  return api<RoomType[]>("/api/room-types", { signal });
}

export function createRoomType(input: RoomTypeInput) {
  return api<RoomType>("/api/room-types", { method: "POST", body: input });
}

export function updateRoomType(id: number, input: RoomTypeInput) {
  return api<RoomType>(`/api/room-types/${id}`, { method: "PATCH", body: input });
}

export function deleteRoomType(id: number) {
  return api<{ ok: true }>(`/api/room-types/${id}`, { method: "DELETE" });
}
