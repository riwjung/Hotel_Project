import type { Metadata } from "next";
import RoomTypePage from "@/app/components/portal/room-type/RoomTypePage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Room types" };

export default function Page() {
  return (
    <RequirePermission permission="ROOM_VIEW">
      <RoomTypePage />
    </RequirePermission>
  );
}
