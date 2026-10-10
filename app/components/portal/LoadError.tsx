"use client";

import { Alert, Button } from "antd";

/** A failed load stays on screen (not just a toast) with a way to retry. */
export default function LoadError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <Alert
      type="error"
      showIcon
      title="Could not load data"
      description={error}
      action={onRetry && <Button size="small" onClick={onRetry}>Retry</Button>}
      style={{ marginBottom: 16 }}
    />
  );
}
