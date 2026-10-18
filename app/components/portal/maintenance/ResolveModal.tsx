"use client";

import { Form, InputNumber, Modal, Typography } from "antd";
import type { MaintenanceRequest } from "./types";

type Props = {
  request: MaintenanceRequest | null; // open when set
  saving: boolean;
  onCancel: () => void;
  onSubmit: (cost: number | null) => void;
};

export default function ResolveModal({ request, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<{ cost?: number }>();
  return (
    <Modal
      open={!!request}
      title={request ? `Resolve · ${request.issueTitle}` : "Resolve"}
      okText="Mark resolved"
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        {request?.roomNumber
          ? `Room ${request.roomNumber} is released when no other repair is open — back to Cleaning if a clean is still pending, otherwise Available.`
          : "Common-area repair: no room status changes."}
      </Typography.Paragraph>
      <Form form={form} layout="vertical" preserve={false} requiredMark="optional" onFinish={(v) => onSubmit(v.cost ?? null)} disabled={saving}>
        <Form.Item label="Repair cost" name="cost">
          <InputNumber min={0} precision={2} prefix="฿" style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
