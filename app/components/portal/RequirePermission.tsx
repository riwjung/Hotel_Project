"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button, Card, Result } from "antd";
import { useSession } from "@/app/lib/auth-client";
import type { PermissionCode } from "@/app/lib/permissions";

// UI gate only — the API enforces the same permission on every request.
export default function RequirePermission({
  permission,
  children,
}: {
  permission: PermissionCode;
  children: ReactNode;
}) {
  const { user, loading, can } = useSession();

  if (loading) return <Card variant="outlined" loading />;

  if (!user || !can(permission)) {
    return (
      <Result
        status="403"
        title="No access"
        subTitle="Your role does not include this page. Ask a manager if you need access."
        extra={
          <Link href="/dashboard">
            <Button type="primary">Back to dashboard</Button>
          </Link>
        }
      />
    );
  }

  return children;
}
