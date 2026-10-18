"use client";

import { Col, Form, Input, Modal, Row, Select } from "antd";
import { ACTIVE_STATUS, statusOptions } from "@/app/lib/status";
import type { ServiceCategory, ServiceCategoryInput } from "./types";

type Props = {
  open: boolean;
  category: ServiceCategory | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: ServiceCategoryInput) => void;
};

export default function CategoryModal({ open, category, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<ServiceCategoryInput>();
  const initialValues: Partial<ServiceCategoryInput> = category
    ? { categoryCode: category.categoryCode, categoryName: category.categoryName, categoryStatus: category.categoryStatus }
    : { categoryStatus: "ACTIVE" };
  return (
    <Modal
      open={open}
      title={category ? `Edit category ${category.categoryCode}` : "New category"}
      okText={category ? "Save changes" : "Create category"}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<ServiceCategoryInput>
        form={form}
        layout="vertical"
        preserve={false}
        requiredMark="optional"
        initialValues={initialValues}
        onFinish={(v) => onSubmit({ ...v, categoryCode: v.categoryCode.trim().toUpperCase(), categoryName: v.categoryName.trim() })}
        disabled={saving}
      >
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item label="Code" name="categoryCode" rules={[{ required: true, message: "Required" }, { pattern: /^[A-Za-z0-9_-]{2,20}$/, message: "2–20 letters or digits" }]}>
              <Input maxLength={20} style={{ textTransform: "uppercase" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={16}>
            <Form.Item label="Name" name="categoryName" rules={[{ required: true, message: "Enter a name" }]}>
              <Input maxLength={50} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Status" name="categoryStatus" rules={[{ required: true }]}>
              <Select options={statusOptions(ACTIVE_STATUS)} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
