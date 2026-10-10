import type { Metadata } from "next";
import RoomPage from "@/app/components/portal/room/RoomPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Rooms" };

export default function Page() {
  return (
    <RequirePermission permission="ROOM_VIEW">
      <RoomPage />
    </RequirePermission>
  );
}
