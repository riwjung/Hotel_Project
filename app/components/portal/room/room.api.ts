import { api } from "@/app/lib/api-client";
import type { ManualRoomStatus, Room, RoomDetail, RoomFilter, RoomInput, RoomStatus } from "./types";

export function fetchRooms(filter: RoomFilter, signal?: AbortSignal) {
  return api<Room[]>("/api/rooms", { params: filter, signal });
}

export function fetchRoom(id: number, signal?: AbortSignal) {
  return api<RoomDetail>(`/api/rooms/${id}`, { signal });
}

export function createRoom(input: RoomInput) {
  return api<Room>("/api/rooms", { method: "POST", body: input });
}

export function updateRoom(id: number, input: RoomInput) {
  return api<Room>(`/api/rooms/${id}`, { method: "PATCH", body: input });
}

export function deleteRoom(id: number) {
  return api<{ ok: true }>(`/api/rooms/${id}`, { method: "DELETE" });
}

/** Resolves to the status the database kept (a room under repair stays MAINTENANCE). */
export function setRoomStatus(id: number, roomStatus: ManualRoomStatus) {
  return api<{ roomStatus: RoomStatus }>(`/api/rooms/${id}/status`, { method: "POST", body: { roomStatus } });
}
