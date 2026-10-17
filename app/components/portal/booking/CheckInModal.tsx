"use client";

import { Button, Card, Col, Form, Input, Modal, Row, Space, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { BookingDetail, BookingRoomDetail, CheckInInput } from "./types";

type Props = {
  open: boolean;
  booking: BookingDetail;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: CheckInInput) => void;
};

// Room ids and the primary flag are not form fields: nested Form.List items with
// preserve={false} lose their values on StrictMode's dev remount, so a hidden
// bookingRoomId field arrives empty. They are rebuilt from booking.rooms on submit.
type GuestValues = Omit<CheckInInput["rooms"][number]["guests"][number], "isPrimary">;
type FormValues = { rooms: Array<{ keyCardNo: string; guests?: GuestValues[] }> };

/** One primary guest per room, then fill the rest room by room up to each room's capacity. */
function initialGuestCounts(rooms: BookingRoomDetail[], guestCount: number): number[] {
  let remaining = guestCount - rooms.length;
  return rooms.map((room) => {
    const extra = Math.max(0, Math.min(room.capacity - 1, remaining));
    remaining -= extra;
    return 1 + extra;
  });
}

export default function CheckInModal({ open, booking, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>();
  const watchedRooms = Form.useWatch("rooms", form);
  const entered = (watchedRooms ?? []).reduce((sum, room) => sum + (room?.guests?.length ?? 0), 0);
  const counts = initialGuestCounts(booking.rooms, booking.guestCount);
  const initialValues: FormValues = {
    rooms: booking.rooms.map((room, roomIndex) => ({
      keyCardNo: room.keyCardNo ?? "",
      guests: Array.from({ length: counts[roomIndex] }, () => ({ fullName: "", idCardNo: null, nationality: null })),
    })),
  };
  const finish = (values: FormValues) =>
    onSubmit({
      rooms: booking.rooms.map((room, roomIndex) => ({
        bookingRoomId: room.bookingRoomId,
        keyCardNo: values.rooms[roomIndex].keyCardNo,
        guests: (values.rooms[roomIndex].guests ?? []).map((guest, guestIndex) => ({
          ...guest,
          isPrimary: guestIndex === 0,
        })),
      })),
    });

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
        Enter exactly {booking.guestCount} guest(s) — {entered} entered. Each room keeps one primary guest and
        cannot take more guests than it sleeps.
      </Typography.Paragraph>
      <Form<FormValues>
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={initialValues}
        onFinish={finish}
        disabled={saving}
      >
        <Form.List name="rooms">
          {(roomFields) => roomFields.map((roomField, roomIndex) => {
            const room = booking.rooms[roomIndex];
            return (
              <Card
                key={roomField.key}
                size="small"
                variant="outlined"
                title={`Room ${room.roomNumber} · ${room.typeName}`}
                extra={<Typography.Text type="secondary">Sleeps {room.capacity}</Typography.Text>}
                style={{ marginBottom: 12 }}
              >
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
                            {guestIndex > 0 && (
                              <Button danger type="text" aria-label="Remove guest" icon={<DeleteOutlined />} onClick={() => remove(guestField.name)} />
                            )}
                          </Col>
                        </Row>
                      ))}
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        disabled={guestFields.length >= room.capacity}
                        onClick={() => add({ fullName: "", idCardNo: null, nationality: null })}
                      >
                        {guestFields.length >= room.capacity ? `Room is full (${room.capacity})` : "Add guest to this room"}
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
