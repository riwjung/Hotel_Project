"use client";

import { Col, Form, Input, InputNumber, Modal, Row, Select } from "antd";
import { ROOM_STATUS } from "@/app/lib/status";
import { useBranchOptions } from "../branch/useBranchOptions";
import type { RoomType } from "../room-type/types";
import type { Room, RoomInput } from "./types";

type Props = {
  open: boolean;
  room: Room | null; // null = create
  roomTypes: RoomType[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: RoomInput) => void;
};

// A new room starts free, under repair, or out of service; later changes use the status menu.
const START_STATUSES = ["AVAILABLE", "MAINTENANCE", "OUT_OF_SERVICE"] as const;

export default function RoomModal({ open, room, roomTypes, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<RoomInput>();
  const { chainWide, options: branchOptions } = useBranchOptions({ activeOnly: true });
  const initialValues: Partial<RoomInput> = room
    ? {
        roomTypeId: room.roomTypeId,
        roomNumber: room.roomNumber,
        roomName: room.roomName,
        floor: room.floor,
        locationZone: room.locationZone,
        description: room.description,
      }
    : { floor: 1, roomStatus: "AVAILABLE" };

  const finish = (v: RoomInput) =>
    onSubmit({
      branchId: chainWide && !room ? v.branchId : null,
      roomTypeId: v.roomTypeId,
      roomNumber: v.roomNumber.trim(),
      roomName: v.roomName?.trim() || null,
      floor: v.floor,
      locationZone: v.locationZone?.trim() || null,
      description: v.description?.trim() || null,
      roomStatus: room ? undefined : v.roomStatus,
    });

  return (
    <Modal
      open={open}
      title={room ? `Edit room ${room.roomNumber}` : "New room"}
      okText={room ? "Save changes" : "Create room"}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
      width={640}
    >
      <Form<RoomInput>
        form={form}
        layout="vertical"
        preserve={false}
        requiredMark="optional"
        initialValues={initialValues}
        onFinish={finish}
        disabled={saving}
      >
        <Row gutter={16}>
          {chainWide && !room && (
            <Col span={24}>
              <Form.Item label="Branch" name="branchId" rules={[{ required: true, message: "Select a branch" }]}>
                <Select options={branchOptions} placeholder="Select a branch" />
              </Form.Item>
            </Col>
          )}
          <Col xs={12} sm={8}>
            <Form.Item label="Room number" name="roomNumber" rules={[{ required: true, message: "Required" }]}>
              <Input maxLength={10} placeholder="204" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item label="Floor" name="floor" rules={[{ required: true, message: "Required" }]}>
              <InputNumber min={-5} max={200} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              label="Room type"
              name="roomTypeId"
              rules={[{ required: true, message: "Select a type" }]}
              extra={room ? "Cannot change while the room has an active booking" : undefined}
            >
              <Select options={roomTypes.map((t) => ({ value: t.roomTypeId, label: `${t.typeName} · sleeps ${t.capacity}` }))} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Name" name="roomName">
              <Input maxLength={100} placeholder="Optional, e.g. Chao Phraya Suite" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Zone" name="locationZone">
              <Input maxLength={50} placeholder="e.g. River wing" />
            </Form.Item>
          </Col>
          {!room && (
            <Col xs={24} sm={12}>
              <Form.Item label="Starts as" name="roomStatus" rules={[{ required: true }]}>
                <Select options={START_STATUSES.map((s) => ({ value: s, label: ROOM_STATUS[s].label }))} />
              </Form.Item>
            </Col>
          )}
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
