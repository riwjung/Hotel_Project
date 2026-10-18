"use client";

import { Checkbox, Col, Form, Input, InputNumber, Modal, Row, Space, Typography } from "antd";
import { AMENITY_ICONS } from "../amenity/amenity-icons";
import type { Amenity } from "../amenity/types";
import type { RoomType, RoomTypeInput } from "./types";

type Props = {
  open: boolean;
  roomType: RoomType | null; // null = create
  amenities: Amenity[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: RoomTypeInput) => void;
};

export default function RoomTypeModal({ open, roomType, amenities, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<RoomTypeInput>();
  const groups = [...new Set(amenities.map((a) => a.amenityGroup))].sort();
  const initialValues: Partial<RoomTypeInput> = roomType
    ? {
        typeCode: roomType.typeCode,
        typeName: roomType.typeName,
        description: roomType.description,
        capacity: roomType.capacity,
        bedType: roomType.bedType,
        basePrice: roomType.basePrice,
        amenityIds: roomType.amenityIds,
      }
    : { capacity: 2, amenityIds: [] };

  const finish = (v: RoomTypeInput) =>
    onSubmit({
      ...v,
      typeCode: v.typeCode.trim().toUpperCase(),
      typeName: v.typeName.trim(),
      bedType: v.bedType.trim(),
      description: v.description?.trim() || null,
      amenityIds: v.amenityIds ?? [],
    });

  return (
    <Modal
      open={open}
      title={roomType ? `Edit room type ${roomType.typeCode}` : "New room type"}
      okText={roomType ? "Save changes" : "Create room type"}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
      width={720}
    >
      <Form<RoomTypeInput>
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
            <Form.Item label="Code" name="typeCode" rules={[{ required: true, message: "Enter a code" }, { pattern: /^[A-Za-z0-9_-]{2,20}$/, message: "2–20 letters or digits" }]}>
              <Input maxLength={20} style={{ textTransform: "uppercase" }} placeholder="DLX" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={16}>
            <Form.Item label="Name" name="typeName" rules={[{ required: true, message: "Enter a name" }]}>
              <Input maxLength={50} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item
              label="Sleeps"
              name="capacity"
              rules={[{ required: true, message: "Required" }]}
              extra={roomType ? "Lowering it is refused if an active stay would no longer fit" : undefined}
            >
              <InputNumber min={1} max={20} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item label="Bed" name="bedType" rules={[{ required: true, message: "Required" }]}>
              <Input maxLength={30} placeholder="King" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Base price" name="basePrice" rules={[{ required: true, message: "Required" }]} extra="Branch rates set the real price">
              <InputNumber min={0} precision={2} prefix="฿" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Description" name="description">
              <Input.TextArea maxLength={255} autoSize={{ minRows: 2, maxRows: 4 }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Amenities" name="amenityIds">
              <Checkbox.Group style={{ width: "100%" }}>
                <Row gutter={[16, 8]}>
                  {groups.map((group) => (
                    <Col xs={24} sm={12} key={group}>
                      <Typography.Text type="secondary">{group}</Typography.Text>
                      <Space orientation="vertical" size={2} style={{ display: "flex", marginTop: 4 }}>
                        {amenities
                          .filter((a) => a.amenityGroup === group)
                          .map((a) => (
                            <Checkbox key={a.amenityId} value={a.amenityId}>
                              {(a.icon && AMENITY_ICONS[a.icon]) ?? null} {a.amenityName}
                            </Checkbox>
                          ))}
                      </Space>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
