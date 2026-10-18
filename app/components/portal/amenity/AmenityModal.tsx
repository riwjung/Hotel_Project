"use client";

import { AutoComplete, Col, Form, Input, Modal, Row, Select } from "antd";
import { amenityIconOptions } from "./amenity-icons";
import type { Amenity, AmenityInput } from "./types";

type Props = {
  open: boolean;
  amenity: Amenity | null; // null = create
  groups: string[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: AmenityInput) => void;
};

export default function AmenityModal({ open, amenity, groups, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<AmenityInput>();
  const initialValues: Partial<AmenityInput> = amenity
    ? { amenityName: amenity.amenityName, amenityGroup: amenity.amenityGroup, icon: amenity.icon ?? undefined }
    : {};

  return (
    <Modal
      open={open}
      title={amenity ? `Edit ${amenity.amenityName}` : "New amenity"}
      okText={amenity ? "Save changes" : "Create amenity"}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<AmenityInput>
        form={form}
        layout="vertical"
        preserve={false}
        requiredMark="optional"
        initialValues={initialValues}
        onFinish={(v) => onSubmit({ amenityName: v.amenityName.trim(), amenityGroup: v.amenityGroup.trim(), icon: v.icon ?? null })}
        disabled={saving}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Name" name="amenityName" rules={[{ required: true, message: "Enter a name" }]}>
              <Input maxLength={50} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Group" name="amenityGroup" rules={[{ required: true, message: "Enter a group" }, { max: 30, message: "30 characters at most" }]}>
              <AutoComplete
                options={groups.map((g) => ({ value: g }))}
                filterOption={(input, option) => (option?.value ?? "").toLowerCase().includes(input.toLowerCase())}
                placeholder="e.g. Comfort"
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Icon" name="icon">
              <Select allowClear placeholder="No icon" options={amenityIconOptions} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
