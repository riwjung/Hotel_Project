"use client";

import { type Dayjs } from "dayjs";
import { Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select, Typography } from "antd";
import { formatMoney } from "@/app/lib/format";
import { useApiData } from "@/app/lib/use-api-data";
import { fetchBookings } from "../booking/booking.api";
import { fetchBranchServices } from "../branch-service/branch-service.api";
import type { ServiceOrderInput } from "./types";

export type OrderBooking = { bookingId: number; bookingCode: string; branchId: number };

type Props = {
  open: boolean;
  /** fixed booking (from the booking page); null = pick an active booking */
  booking: OrderBooking | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: ServiceOrderInput) => void;
};

type FormValues = { bookingId?: number; branchServiceId: number; quantity: number; scheduledAt?: Dayjs | null; remark?: string };

export default function OrderModal({ open, booking, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>();
  const bookings = useApiData(
    (signal) => (open && !booking ? fetchBookings({}, signal) : Promise.resolve([])),
    `order-bookings:${open}:${booking?.bookingId}`,
  );
  const active = (bookings.data ?? []).filter((b) => b.bookingStatus === "CONFIRMED" || b.bookingStatus === "CHECKED_IN");
  const pickedId = Form.useWatch("bookingId", form);
  const target = booking ?? active.find((b) => b.bookingId === pickedId);
  const branchServices = useApiData(
    (signal) => (open && target ? fetchBranchServices({ branchId: target.branchId, available: true }, signal) : Promise.resolve([])),
    `order-services:${open}:${target?.branchId}`,
  );
  const serviceId = Form.useWatch("branchServiceId", form);
  const quantity = Form.useWatch("quantity", form) ?? 1;
  const picked = (branchServices.data ?? []).find((s) => s.branchServiceId === serviceId);

  const finish = (v: FormValues) => {
    if (!target) return;
    onSubmit({
      bookingId: target.bookingId,
      branchServiceId: v.branchServiceId,
      quantity: v.quantity,
      scheduledAt: v.scheduledAt ? v.scheduledAt.toISOString() : null,
      remark: v.remark?.trim() || null,
    });
  };

  return (
    <Modal
      open={open}
      title={booking ? `Order a service · ${booking.bookingCode}` : "New service order"}
      okText="Place order"
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<FormValues>
        form={form}
        layout="vertical"
        preserve={false}
        requiredMark="optional"
        initialValues={{ quantity: 1 }}
        onFinish={finish}
        disabled={saving}
      >
        {!booking && (
          <Form.Item label="Booking" name="bookingId" rules={[{ required: true, message: "Select a booking" }]}>
            <Select
              showSearch
              optionFilterProp="label"
              loading={bookings.loading}
              placeholder="Confirmed or in-house bookings"
              options={active.map((b) => ({ value: b.bookingId, label: `${b.bookingCode} · ${b.customerName} · ${b.branchCode}` }))}
              onChange={() => form.setFieldValue("branchServiceId", undefined)}
            />
          </Form.Item>
        )}
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.Item label="Service" name="branchServiceId" rules={[{ required: true, message: "Select a service" }]}>
              <Select
                showSearch
                optionFilterProp="label"
                disabled={!target}
                loading={branchServices.loading}
                placeholder={target ? "Available at this branch" : "Pick the booking first"}
                options={(branchServices.data ?? []).map((s) => ({
                  value: s.branchServiceId,
                  label: `${s.serviceName} · ${formatMoney(s.branchPrice)} / ${s.unit}`,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Quantity" name="quantity" rules={[{ required: true, message: "Required" }]}>
              <InputNumber min={1} max={100} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label="Scheduled for"
          name="scheduledAt"
          extra={picked?.openTime ? `Open ${picked.openTime} – ${picked.closeTime}` : "Leave empty to keep it as a request"}
        >
          <DatePicker showTime={{ format: "HH:mm", minuteStep: 15 }} format="D MMM YYYY HH:mm" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Note" name="remark">
          <Input.TextArea maxLength={255} autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
        {picked && (
          <Typography.Text type="secondary">
            Adds {formatMoney(picked.branchPrice * quantity)} to the booking total
            {picked.needAssignment ? " · needs a skilled employee assigned before it starts" : ""}.
          </Typography.Text>
        )}
      </Form>
    </Modal>
  );
}
