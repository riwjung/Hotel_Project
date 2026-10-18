"use client";

import { Form, Input, Modal, Typography } from "antd";
import type { Employee } from "./types";

type Props = {
  employee: Employee | null; // open when set
  saving: boolean;
  onCancel: () => void;
  onSubmit: (password: string) => void;
};

export default function PasswordModal({ employee, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<{ password: string; confirm: string }>();
  return (
    <Modal
      open={!!employee}
      title={employee ? `Reset password · ${employee.firstName} ${employee.lastName}` : "Reset password"}
      okText="Set password"
      okButtonProps={{ danger: true }}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        The old password stops working straight away. Give the new one to {employee?.firstName} in person.
      </Typography.Paragraph>
      <Form form={form} layout="vertical" preserve={false} onFinish={(v) => onSubmit(v.password)} disabled={saving}>
        <Form.Item label="New password" name="password" rules={[{ required: true, message: "Required" }, { min: 8, message: "At least 8 characters" }]}>
          <Input.Password autoComplete="new-password" maxLength={72} />
        </Form.Item>
        <Form.Item
          label="Confirm password"
          name="confirm"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Required" },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || value === getFieldValue("password") ? Promise.resolve() : Promise.reject(new Error("Passwords do not match")),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" maxLength={72} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
