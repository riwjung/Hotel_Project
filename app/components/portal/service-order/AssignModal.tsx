"use client";

import { Form, Input, Modal, Select, Typography } from "antd";
import { SKILL_LEVEL } from "@/app/lib/status";
import { useApiData } from "@/app/lib/use-api-data";
import { fetchEligibleEmployees } from "./service-order.api";
import type { AssignInput, ServiceOrder } from "./types";

type Props = {
  order: ServiceOrder | null; // open when set
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: AssignInput) => void;
};

/** Only skilled, active staff of the booking's branch are offered (the DB re-checks R5 / R16). */
export default function AssignModal({ order, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<{ employeeId: number; note?: string }>();
  const eligible = useApiData(
    (signal) => (order ? fetchEligibleEmployees(order.bookingServiceId, signal) : Promise.resolve([])),
    `eligible:${order?.bookingServiceId}`,
  );
  const reassign = Boolean(order?.assignmentId);

  return (
    <Modal
      open={!!order}
      title={order ? `${reassign ? "Reassign" : "Assign"} ${order.serviceName} · ${order.bookingCode}` : "Assign"}
      okText={reassign ? "Reassign" : "Assign"}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      {reassign && (
        <Typography.Paragraph type="secondary">
          {order?.assigneeName} keeps the job in the history as Reassigned; the new person takes it from here.
        </Typography.Paragraph>
      )}
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        requiredMark="optional"
        onFinish={(v) => onSubmit({ employeeId: v.employeeId, note: v.note?.trim() || null })}
        disabled={saving}
      >
        <Form.Item label="Employee" name="employeeId" rules={[{ required: true, message: "Pick someone" }]}>
          <Select
            loading={eligible.loading}
            placeholder="Skilled staff of this branch"
            notFoundContent="Nobody at this branch has this skill — add it under Staff skills"
            options={(eligible.data ?? []).map((e) => ({
              value: e.employeeId,
              disabled: e.fullName === order?.assigneeName,
              label: `${e.fullName} · ${SKILL_LEVEL[e.skillLevel].label} · ${e.openAssignments} open job(s)`,
            }))}
          />
        </Form.Item>
        <Form.Item label="Note" name="note">
          <Input maxLength={255} placeholder={reassign ? "Why the change, e.g. shift clash" : "Optional"} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
