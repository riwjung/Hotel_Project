import type { Metadata } from "next";
import RatePage from "@/app/components/portal/rate/RatePage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Room rates" };

export default function Page() {
  return (
    <RequirePermission permission="RATE_MANAGE">
      <RatePage />
    </RequirePermission>
  );
}
