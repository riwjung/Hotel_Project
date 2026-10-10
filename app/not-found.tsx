import Link from "next/link";
import { Button, Result } from "antd";

export default function NotFound() {
  return (
    <Result
      status="404"
      title="Page not found"
      subTitle="This page does not exist or has moved."
      extra={
        <Link href="/dashboard">
          <Button type="primary">Back to dashboard</Button>
        </Link>
      }
      style={{ paddingTop: "12vh" }}
    />
  );
}
