"use client";

import { Button, Card, Checkbox, Col, Form, Input, Modal, Row, Space, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { BookingDetail, CheckInInput } from "./types";

type Props = {
  open: boolean;
  booking: BookingDetail;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: CheckInInput) => void;
};

export default function CheckInModal({ open, booking, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<CheckInInput>();
  const initialValues: CheckInInput = {
    rooms: booking.rooms.map((room, roomIndex) => {
      const roomGuestCount = roomIndex === 0
        ? Math.max(1, booking.guestCount - (booking.rooms.length - 1))
        : 1;
      return {
        bookingRoomId: room.bookingRoomId,
        keyCardNo: room.keyCardNo ?? "",
        guests: Array.from({ length: roomGuestCount }, (_, guestIndex) => ({
          fullName: "",
          idCardNo: null,
          nationality: null,
          isPrimary: guestIndex === 0,
        })),
      };
    }),
  };

  return (
    <Modal
      open={open}
      title={`Check in ${booking.bookingCode}`}
      okText="Check in"
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
      width={820}
    >
      <Typography.Paragraph type="secondary">
        Enter exactly {booking.guestCount} guest(s). Each room must keep one primary guest.
      </Typography.Paragraph>
      <Form<CheckInInput>
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={initialValues}
        onFinish={onSubmit}
        disabled={saving}
      >
        <Form.List name="rooms">
          {(roomFields) => roomFields.map((roomField, roomIndex) => {
            const room = booking.rooms[roomIndex];
            return (
              <Card key={roomField.key} size="small" variant="outlined" title={`Room ${room.roomNumber}`} style={{ marginBottom: 12 }}>
                <Form.Item name={[roomField.name, "bookingRoomId"]} hidden><Input /></Form.Item>
                <Form.Item
                  name={[roomField.name, "keyCardNo"]}
                  label="Key card number"
                  rules={[{ required: true, message: "Enter the key card number" }]}
                >
                  <Input maxLength={20} />
                </Form.Item>
                <Form.List name={[roomField.name, "guests"]}>
                  {(guestFields, { add, remove }) => (
                    <Space orientation="vertical" style={{ width: "100%" }}>
                      {guestFields.map((guestField, guestIndex) => (
                        <Row key={guestField.key} gutter={12} align="middle">
                          <Col xs={24} sm={8}>
                            <Form.Item
                              name={[guestField.name, "fullName"]}
                              label={guestIndex === 0 ? "Primary guest" : `Guest ${guestIndex + 1}`}
                              rules={[{ required: true, message: "Enter the guest name" }]}
                            >
                              <Input maxLength={100} />
                            </Form.Item>
                          </Col>
                          <Col xs={12} sm={6}>
                            <Form.Item name={[guestField.name, "idCardNo"]} label="ID / passport">
                              <Input maxLength={30} />
                            </Form.Item>
                          </Col>
                          <Col xs={10} sm={6}>
                            <Form.Item name={[guestField.name, "nationality"]} label="Nationality">
                              <Input maxLength={50} />
                            </Form.Item>
                          </Col>
                          <Col xs={2} sm={2}>
                            <Form.Item name={[guestField.name, "isPrimary"]} valuePropName="checked" hidden>
                              <Checkbox />
                            </Form.Item>
                            {guestIndex > 0 && (
                              <Button danger type="text" aria-label="Remove guest" icon={<DeleteOutlined />} onClick={() => remove(guestField.name)} />
                            )}
                          </Col>
                        </Row>
                      ))}
                      <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ isPrimary: false })}>
                        Add guest to this room
                      </Button>
                    </Space>
                  )}
                </Form.List>
              </Card>
            );
          })}
        </Form.List>
      </Form>
    </Modal>
  );
}
