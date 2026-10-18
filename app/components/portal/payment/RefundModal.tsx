"use client";

import { Form, Input, InputNumber, Modal, Select, Typography } from "antd";
import { codeLabel, formatMoney } from "@/app/lib/format";
import { useApiData } from "@/app/lib/use-api-data";
import { fetchBookings } from "../booking/booking.api";
import { PAYMENT_METHODS, type PaymentMethod } from "../booking/types";
import type { RefundInput } from "./types";

export type RefundTarget = { bookingId: number; bookingCode: string; paidTotal: number };

type Props = {
  open: boolean;
  /** fixed booking (from the booking page); null = pick one in the form */
  booking: RefundTarget | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (bookingId: number, input: RefundInput) => void;
};

type FormValues = { bookingId?: number; amount: number; paymentMethod: PaymentMethod; transactionRef?: string };

export default function RefundModal({ open, booking, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>();
  const bookings = useApiData(
    (signal) => (open && !booking ? fetchBookings({}, signal) : Promise.resolve([])),
    `refund-bookings:${open}:${booking?.bookingId}`,
  );
  const refundable = (bookings.data ?? []).filter((b) => b.paidTotal > 0);
  const pickedId = Form.useWatch("bookingId", form);
  const target: RefundTarget | undefined =
    booking ?? refundable.find((b) => b.bookingId === pickedId);

  const finish = (v: FormValues) => {
    if (!target) return;
    onSubmit(target.bookingId, {
      amount: v.amount,
      paymentMethod: v.paymentMethod,
      transactionRef: v.transactionRef?.trim() || null,
    });
  };

  return (
    <Modal
      open={open}
      title={booking ? `Refund · ${booking.bookingCode}` : "Record a refund"}
      okText="Record refund"
      okButtonProps={{ danger: true }}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        The refund is recorded as money paid back on the booking. It cannot be more than what was paid
        {target ? ` (${formatMoney(target.paidTotal)})` : ""}, and it cannot be undone.
      </Typography.Paragraph>
      <Form<FormValues>
        form={form}
        layout="vertical"
        preserve={false}
        requiredMark="optional"
        initialValues={{ paymentMethod: "TRANSFER" }}
        onFinish={finish}
        disabled={saving}
      >
        {!booking && (
          <Form.Item label="Booking" name="bookingId" rules={[{ required: true, message: "Select a booking" }]}>
            <Select
              showSearch
              optionFilterProp="label"
              loading={bookings.loading}
              placeholder="Bookings with money paid"
              options={refundable.map((b) => ({
                value: b.bookingId,
                label: `${b.bookingCode} · ${b.customerName} · paid ${formatMoney(b.paidTotal)}`,
              }))}
            />
          </Form.Item>
        )}
        <Form.Item label="Amount" name="amount" rules={[{ required: true, message: "Enter the amount" }]}>
          <InputNumber min={0.01} max={target?.paidTotal} precision={2} prefix="฿" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Refund method" name="paymentMethod" rules={[{ required: true }]}>
          <Select options={PAYMENT_METHODS.map((value) => ({ value, label: codeLabel(value) }))} />
        </Form.Item>
        <Form.Item label="Transaction reference" name="transactionRef">
          <Input maxLength={100} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
