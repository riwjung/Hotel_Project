import { SessionProvider } from "@/app/lib/auth-client";
import PortalShell from "@/app/components/portal/PortalShell";

// Static on purpose: with cacheComponents a cookie read here would have to sit
// behind <Suspense>. The session is loaded client-side from /api/auth/me,
// proxy.ts already bounced signed-out visitors, and every API call re-checks.
export default function PortalLayout({ children }: LayoutProps<"/">) {
  return (
    <SessionProvider>
      <PortalShell>{children}</PortalShell>
    </SessionProvider>
  );
}
