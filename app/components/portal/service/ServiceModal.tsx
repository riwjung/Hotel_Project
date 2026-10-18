"use client";

import { Col, Form, Input, InputNumber, Modal, Row, Select, Switch } from "antd";
import { ACTIVE_STATUS, statusOptions } from "@/app/lib/status";
import type { Service, ServiceCategory, ServiceInput } from "./types";

type Props = {
  open: boolean;
  service: Service | null;
  categories: ServiceCategory[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: ServiceInput) => void;
};

type FormValues = Omit<ServiceInput, "estMinutes"> & { estMinutes?: number | null };

export default function ServiceModal({ open, service, categories, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>();
  const initialValues: Partial<FormValues> = service
    ? {
        categoryId: service.categoryId,
        serviceCode: service.serviceCode,
        serviceName: service.serviceName,
        description: service.description,
        defaultPrice: service.defaultPrice,
        unit: service.unit,
        isChargeable: service.isChargeable,
        needAssignment: service.needAssignment,
        estMinutes: service.estMinutes,
        serviceStatus: service.serviceStatus,
      }
    : { isChargeable: true, needAssignment: false, serviceStatus: "ACTIVE", defaultPrice: 0 };

  const finish = (v: FormValues) =>
    onSubmit({
      ...v,
      serviceCode: v.serviceCode.trim().toUpperCase(),
      serviceName: v.serviceName.trim(),
      unit: v.unit.trim(),
      description: v.description?.trim() || null,
      estMinutes: v.estMinutes ?? null,
    });

  return (
    <Modal
      open={open}
      title={service ? `Edit ${service.serviceName}` : "New service"}
      okText={service ? "Save changes" : "Create service"}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
      width={680}
    >
      <Form<FormValues>
        form={form}
        layout="vertical"
        preserve={false}
        requiredMark="optional"
        initialValues={initialValues}
        onFinish={finish}
        disabled={saving}
      >
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item label="Code" name="serviceCode" rules={[{ required: true, message: "Required" }, { pattern: /^[A-Za-z0-9_-]{2,20}$/, message: "2–20 letters or digits" }]}>
              <Input maxLength={20} style={{ textTransform: "uppercase" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={16}>
            <Form.Item label="Name" name="serviceName" rules={[{ required: true, message: "Enter a name" }]}>
              <Input maxLength={100} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Category" name="categoryId" rules={[{ required: true, message: "Select a category" }]}>
              <Select options={categories.map((c) => ({ value: c.categoryId, label: c.categoryName }))} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Default price" name="defaultPrice" rules={[{ required: true, message: "Required" }]}>
              <InputNumber min={0} precision={2} prefix="฿" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Per" name="unit" rules={[{ required: true, message: "Required" }]}>
              <Input maxLength={20} placeholder="session" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Chargeable" name="isChargeable" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Needs staff" name="needAssignment" valuePropName="checked" tooltip="Orders must be assigned to a skilled employee before they start">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Takes (min)" name="estMinutes">
              <InputNumber min={1} max={1440} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Status" name="serviceStatus" rules={[{ required: true }]}>
              <Select options={statusOptions(ACTIVE_STATUS)} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Description" name="description">
              <Input.TextArea maxLength={255} autoSize={{ minRows: 2, maxRows: 4 }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
