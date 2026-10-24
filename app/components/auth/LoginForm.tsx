"use client";

import { useState } from "react";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import BrandLogo from "@/app/components/brand/BrandLogo";
import { api } from "@/app/lib/api-client";

type Values = { email: string; password: string };

/** Only same-origin relative paths are allowed as ?next= targets. */
function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export default function LoginForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: Values) => {
    setSubmitting(true);
    setError(null);
    try {
      await api("/api/auth/login", { method: "POST", body: values });
      // Full navigation so the portal starts with a fresh session context.
      window.location.assign(safeNext());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setSubmitting(false);
    }
  };

  return (
    <Card
      variant="outlined"
      style={{
        width: "100%",
        maxWidth: 400,
        background: "var(--ivory)",
        borderColor: "var(--hairline)",
        boxShadow: "0 12px 40px rgba(138, 108, 55, 0.12)",
      }}
      styles={{ body: { padding: "36px 32px 32px" } }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <BrandLogo layout="stacked" />
      </div>
      <Typography.Paragraph type="secondary" style={{ textAlign: "center", marginBottom: 24 }}>
        Staff portal — sign in with your staff account.
      </Typography.Paragraph>

      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}

      <Form<Values> layout="vertical" requiredMark={false} onFinish={onFinish} disabled={submitting}>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Enter your email" },
            { type: "email", message: "Enter a valid email" },
          ]}
        >
          <Input prefix={<MailOutlined />} autoComplete="username" placeholder="you@hotel.local" autoFocus />
        </Form.Item>
        <Form.Item label="Password" name="password" rules={[{ required: true, message: "Enter your password" }]}>
          <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={submitting}>
          Sign in
        </Button>
      </Form>
    </Card>
  );
}
