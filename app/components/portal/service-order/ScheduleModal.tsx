"use client";

import dayjs, { type Dayjs } from "dayjs";
import { DatePicker, Form, Modal } from "antd";
import type { ServiceOrder } from "./types";

type Props = {
  order: ServiceOrder | null; // open when set
  saving: boolean;
  onCancel: () => void;
  onSubmit: (scheduledAt: string) => void;
};

export default function ScheduleModal({ order, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<{ scheduledAt: Dayjs }>();
  return (
    <Modal
      open={!!order}
      title={order ? `Schedule ${order.serviceName} · ${order.bookingCode}` : "Schedule"}
      okText="Save time"
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{ scheduledAt: order?.scheduledAt ? dayjs(order.scheduledAt) : undefined }}
        onFinish={(v) => onSubmit(v.scheduledAt.toISOString())}
        disabled={saving}
      >
        <Form.Item label="Scheduled for" name="scheduledAt" rules={[{ required: true, message: "Pick a time" }]}>
          <DatePicker showTime={{ format: "HH:mm", minuteStep: 15 }} format="D MMM YYYY HH:mm" style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
