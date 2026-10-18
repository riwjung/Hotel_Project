import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BranchDetailPage from "@/app/components/portal/branch/BranchDetailPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Branch details" };

export default async function Page({ params }: PageProps<"/branches/[id]">) {
  const { id: rawId } = await params;
  const branchId = Number(rawId);
  if (!Number.isInteger(branchId) || branchId <= 0) notFound();
  return <RequirePermission permission="BRANCH_VIEW"><BranchDetailPage branchId={branchId} /></RequirePermission>;
}
