"use client";

import { Col, Form, Input, Modal, Row, Select } from "antd";
import { ACTIVE_STATUS, SCOPE_LEVEL, statusOptions } from "@/app/lib/status";
import type { RoleInput, RoleRow } from "./types";

type Props = {
  open: boolean;
  role: RoleRow | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: RoleInput) => void;
};

export default function RoleModal({ open, role, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<RoleInput>();
  const initialValues: Partial<RoleInput> = role
    ? { roleCode: role.roleCode, roleName: role.roleName, scopeLevel: role.scopeLevel, roleStatus: role.roleStatus }
    : { scopeLevel: "BRANCH", roleStatus: "ACTIVE" };
  const scopeLocked = !!role && role.employeeCount > 0;

  return (
    <Modal
      open={open}
      title={role ? `Edit role ${role.roleCode}` : "New role"}
      okText={role ? "Save changes" : "Create role"}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<RoleInput>
        form={form}
        layout="vertical"
        preserve={false}
        requiredMark="optional"
        initialValues={initialValues}
        onFinish={(v) => onSubmit({ ...v, roleCode: v.roleCode.trim().toUpperCase(), roleName: v.roleName.trim() })}
        disabled={saving}
      >
        <Row gutter={16}>
          <Col xs={24} sm={10}>
            <Form.Item label="Code" name="roleCode" rules={[{ required: true, message: "Required" }, { pattern: /^[A-Za-z0-9_]{2,30}$/, message: "2–30 letters, digits or _" }]}>
              <Input maxLength={30} style={{ textTransform: "uppercase" }} placeholder="FRONT_DESK" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={14}>
            <Form.Item label="Name" name="roleName" rules={[{ required: true, message: "Required" }]}>
              <Input maxLength={50} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Works across"
              name="scopeLevel"
              rules={[{ required: true }]}
              extra={scopeLocked ? "Fixed: employees hold this role" : undefined}
            >
              <Select disabled={scopeLocked} options={statusOptions(SCOPE_LEVEL)} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Status" name="roleStatus" rules={[{ required: true }]} extra="Inactive roles cannot sign in">
              <Select options={statusOptions(ACTIVE_STATUS)} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
