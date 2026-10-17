"use client";

import { Alert, Form, Input, Modal, Select } from "antd";
import { formatMoney } from "@/app/lib/format";
import type { CheckOutInput, EmployeeOption } from "./types";

type Props = {
  open: boolean;
  assignees: EmployeeOption[];
  balance: number;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: CheckOutInput) => void;
};

export default function CheckOutModal({ open, assignees, balance, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<CheckOutInput>();
  return (
    <Modal
      open={open}
      title="Check out and create cleaning tasks"
      okText="Check out"
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      {balance > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          title={`Outstanding balance ${formatMoney(balance)}`}
          description="Record the payment first unless the guest settles later."
        />
      )}
      <Form<CheckOutInput>
        form={form}
        layout="vertical"
        preserve={false}
        onFinish={onSubmit}
        disabled={saving}
      >
        <Form.Item
          label="Assign cleaning to"
          name="assignedEmpId"
          rules={[{ required: true, message: "Select an employee" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={assignees.map((employee) => ({
              value: employee.employeeId,
              label: `${employee.employeeCode} · ${employee.fullName}`,
            }))}
          />
        </Form.Item>
        <Form.Item label="Cleaning note" name="remark">
          <Input.TextArea maxLength={255} autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
