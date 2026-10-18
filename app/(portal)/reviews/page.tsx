import type { Metadata } from "next";
import ReviewPage from "@/app/components/portal/review/ReviewPage";
import RequirePermission from "@/app/components/portal/RequirePermission";

export const metadata: Metadata = { title: "Reviews" };

export default function Page() {
  return (
    <RequirePermission permission="REVIEW_VIEW">
      <ReviewPage />
    </RequirePermission>
  );
}
