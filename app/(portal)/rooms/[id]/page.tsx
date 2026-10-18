import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RequirePermission from "@/app/components/portal/RequirePermission";
import RoomDetailPage from "@/app/components/portal/room/RoomDetailPage";

export const metadata: Metadata = { title: "Room details" };

export default async function Page({ params }: PageProps<"/rooms/[id]">) {
  const { id: rawId } = await params;
  const roomId = Number(rawId);
  if (!Number.isInteger(roomId) || roomId <= 0) notFound();
  return <RequirePermission permission="ROOM_VIEW"><RoomDetailPage roomId={roomId} /></RequirePermission>;
}
