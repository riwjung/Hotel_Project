"use client";

import dayjs, { type Dayjs } from "dayjs";
import { Alert, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select } from "antd";
import { ACTIVE_STATUS, statusOptions } from "@/app/lib/status";
import { useBranchOptions } from "../branch/useBranchOptions";
import type { RoomType } from "../room-type/types";
import type { RateInput, RoomRate } from "./types";

type Props = {
  open: boolean;
  rate: RoomRate | null; // null = create
  roomTypes: RoomType[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: RateInput) => void;
};

type FormValues = Omit<RateInput, "startDate" | "endDate"> & { period: [Dayjs, Dayjs] };

export default function RateModal({ open, rate, roomTypes, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { chainWide, options: branchOptions } = useBranchOptions({ activeOnly: true });
  const initialValues: Partial<FormValues> = rate
    ? {
        roomTypeId: rate.roomTypeId,
        rateName: rate.rateName,
        period: [dayjs(rate.startDate), dayjs(rate.endDate)],
        pricePerNight: rate.pricePerNight,
        minNights: rate.minNights,
        rateStatus: rate.rateStatus,
      }
    : { minNights: 1, rateStatus: "ACTIVE" };

  const finish = (v: FormValues) =>
    onSubmit({
      branchId: chainWide && !rate ? v.branchId : null,
      roomTypeId: v.roomTypeId,
      rateName: v.rateName.trim(),
      startDate: v.period[0].format("YYYY-MM-DD"),
      endDate: v.period[1].format("YYYY-MM-DD"),
      pricePerNight: v.pricePerNight,
      minNights: v.minNights,
      rateStatus: v.rateStatus,
    });

  return (
    <Modal
      open={open}
      title={rate ? `Edit rate · ${rate.typeName} ${rate.rateName}` : "New room rate"}
      okText={rate ? "Save changes" : "Create rate"}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
      width={640}
    >
      {rate && rate.bookingCount > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title={`${rate.bookingCount} booked room(s) use this rate`}
          description="They keep the nightly price they were booked at; a new price only applies to new bookings."
        />
      )}
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
          {chainWide && !rate && (
            <Col xs={24} sm={12}>
              <Form.Item label="Branch" name="branchId" rules={[{ required: true, message: "Select a branch" }]}>
                <Select options={branchOptions} placeholder="Select a branch" />
              </Form.Item>
            </Col>
          )}
          <Col xs={24} sm={chainWide && !rate ? 12 : 24}>
            <Form.Item label="Room type" name="roomTypeId" rules={[{ required: true, message: "Select a room type" }]}>
              <Select options={roomTypes.map((t) => ({ value: t.roomTypeId, label: `${t.typeName} (${t.typeCode})` }))} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Rate name" name="rateName" rules={[{ required: true, message: "Enter a name" }]}>
              <Input maxLength={50} placeholder="e.g. High season" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Valid for stays"
              name="period"
              rules={[{ required: true, message: "Choose the period" }]}
              extra="Active periods of one room type may not overlap"
            >
              <DatePicker.RangePicker format="D MMM YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item label="Per night" name="pricePerNight" rules={[{ required: true, message: "Required" }]}>
              <InputNumber min={0} precision={2} prefix="฿" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item label="Min nights" name="minNights" rules={[{ required: true, message: "Required" }]}>
              <InputNumber min={1} max={60} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Status" name="rateStatus" rules={[{ required: true }]}>
              <Select options={statusOptions(ACTIVE_STATUS)} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
