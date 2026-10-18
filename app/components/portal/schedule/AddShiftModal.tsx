"use client";

import { Form, Modal, Select, Typography } from "antd";
import { formatDate } from "@/app/lib/format";
import type { WeekSchedule } from "./types";

export type AddTarget = { employeeId: number; fullName: string; workDate: string };

type Props = {
  target: AddTarget | null; // open when set
  shifts: WeekSchedule["shifts"];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (shiftId: number) => void;
};

export default function AddShiftModal({ target, shifts, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<{ shiftId: number }>();
  return (
    <Modal
      open={!!target}
      title={target ? `Add a shift · ${target.fullName}, ${formatDate(target.workDate)}` : "Add a shift"}
      okText="Add shift"
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        A shift that overlaps one the employee already has is refused.
      </Typography.Paragraph>
      <Form form={form} layout="vertical" preserve={false} onFinish={(v) => onSubmit(v.shiftId)} disabled={saving}>
        <Form.Item label="Shift" name="shiftId" rules={[{ required: true, message: "Pick a shift" }]}>
          <Select
            options={shifts.map((s) => ({
              value: s.shiftId,
              label: `${s.shiftName} · ${s.startTime}–${s.endTime}${s.isOvernight ? " (next day)" : ""}`,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
