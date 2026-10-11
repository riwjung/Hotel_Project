"use client";

import { Form, Input, Modal, Select } from "antd";
import type { CheckOutInput, EmployeeOption } from "./types";

type Props = {
  open: boolean;
  assignees: EmployeeOption[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: CheckOutInput) => void;
};

export default function CheckOutModal({ open, assignees, saving, onCancel, onSubmit }: Props) {
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
