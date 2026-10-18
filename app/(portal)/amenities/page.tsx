import type { Metadata } from "next";
import AmenityPage from "@/app/components/portal/amenity/AmenityPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Amenities" };

export default function Page() {
  return (
    <RequirePermission permission="ROOM_VIEW">
      <AmenityPage />
    </RequirePermission>
  );
}
