import { api } from "@/app/lib/api-client";
import type { Room, RoomFilter } from "./types";

export function fetchRooms(filter: RoomFilter, signal?: AbortSignal) {
  return api<Room[]>("/api/rooms", { params: filter, signal });
}
