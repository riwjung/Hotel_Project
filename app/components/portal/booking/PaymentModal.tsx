"use client";

import { Form, Input, InputNumber, Modal, Select } from "antd";
import { formatMoney } from "@/app/lib/format";
import { PAYMENT_METHODS, PAYMENT_TYPES, type PaymentInput } from "./types";

type Props = {
  open: boolean;
  balance: number;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: PaymentInput) => void;
};

const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

export default function PaymentModal({ open, balance, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<PaymentInput>();
  return (
    <Modal
      open={open}
      title={`Record payment · Balance ${formatMoney(balance)}`}
      okText="Record payment"
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<PaymentInput>
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{ amount: balance, paymentType: "BALANCE", paymentMethod: "CASH" }}
        onFinish={onSubmit}
        disabled={saving}
      >
        <Form.Item label="Amount" name="amount" rules={[{ required: true, message: "Enter an amount" }]}> 
          <InputNumber min={0.01} max={balance} precision={2} prefix="฿" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Payment type" name="paymentType" rules={[{ required: true }]}>
          <Select options={PAYMENT_TYPES.map((value) => ({ value, label: label(value) }))} />
        </Form.Item>
        <Form.Item label="Payment method" name="paymentMethod" rules={[{ required: true }]}>
          <Select options={PAYMENT_METHODS.map((value) => ({ value, label: label(value) }))} />
        </Form.Item>
        <Form.Item label="Transaction reference" name="transactionRef">
          <Input maxLength={100} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
