import type { Metadata } from "next";
import RolePage from "@/app/components/portal/role/RolePage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Roles & permissions" };

export default function Page() {
  return (
    <RequirePermission permission="ROLE_MANAGE">
      <RolePage />
    </RequirePermission>
  );
}
