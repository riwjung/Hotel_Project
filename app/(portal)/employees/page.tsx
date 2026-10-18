import type { Metadata } from "next";
import EmployeePage from "@/app/components/portal/employee/EmployeePage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Employees" };

export default function Page() {
  return (
    <RequirePermission permission="EMPLOYEE_VIEW">
      <EmployeePage />
    </RequirePermission>
  );
}
