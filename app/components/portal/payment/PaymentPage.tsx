"use client";

import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { App, Button, Card, DatePicker, Empty, Input, Select, Space, Typography } from "antd";
import { RollbackOutlined, SearchOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { codeLabel, formatMoney } from "@/app/lib/format";
import { PAYMENT_STATUS, statusOptions } from "@/app/lib/status";
import { useApiData } from "@/app/lib/use-api-data";
import BranchFilter from "../BranchFilter";
import LoadError from "../LoadError";
import { changePaymentStatus, createRefund, fetchPayments } from "./payment.api";
import PaymentTable from "./PaymentTable";
import RefundModal from "./RefundModal";
import { PAYMENT_KINDS, type PaymentFilter, type PaymentRow, type RefundInput } from "./types";

export default function PaymentPage() {
  const { message, modal } = App.useApp();
  const { user, can } = useSession();
  const canManage = can("PAYMENT_MANAGE");
  const [filter, setFilter] = useState<PaymentFilter>({});
  const [actingId, setActingId] = useState<number | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const payments = useApiData((signal) => fetchPayments(filter, signal), JSON.stringify(filter));
  const data = payments.data ?? [];
  const range: [Dayjs, Dayjs] | null = filter.from && filter.to ? [dayjs(filter.from), dayjs(filter.to)] : null;

  const collected = data.filter((p) => p.paymentStatus === "PAID" && p.paymentType !== "REFUND").reduce((s, p) => s + p.amount, 0);
  const refunded = data.filter((p) => p.paymentType === "REFUND").reduce((s, p) => s + p.amount, 0);
  const pending = data.filter((p) => p.paymentStatus === "PENDING").reduce((s, p) => s + p.amount, 0);

  const setStatus = async (p: PaymentRow, toStatus: "PAID" | "FAILED") => {
    setActingId(p.paymentId);
    try {
      await changePaymentStatus(p.paymentId, toStatus);
      message.success(toStatus === "PAID" ? `Payment for ${p.bookingCode} confirmed` : `Payment for ${p.bookingCode} marked failed`);
      payments.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update the payment");
    } finally {
      setActingId(null);
    }
  };

  const markFailed = (p: PaymentRow) =>
    modal.confirm({
      title: `Mark the ${formatMoney(p.amount)} payment for ${p.bookingCode} as failed?`,
      content: "A failed payment is final; the guest has to pay again with a new payment.",
      okText: "Mark failed",
      okButtonProps: { danger: true },
      onOk: () => setStatus(p, "FAILED"),
    });

  const refund = async (bookingId: number, input: RefundInput) => {
    setSaving(true);
    try {
      await createRefund(bookingId, input);
      message.success(`Refund of ${formatMoney(input.amount)} recorded`);
      setRefundOpen(false);
      payments.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not record the refund");
    } finally {
      setSaving(false);
    }
  };

  const filtered = Object.values(filter).some(Boolean);

  return (
    <>
      {payments.error && <LoadError error={payments.error} onRetry={payments.reload} />}
      <Card
        variant="outlined"
        title="Payments"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Booking or customer"
              value={filter.q}
              onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value || undefined }))}
              style={{ width: 200 }}
            />
            <BranchFilter value={filter.branchId} onChange={(branchId) => setFilter((f) => ({ ...f, branchId }))} />
            <Select
              allowClear
              placeholder="All types"
              style={{ width: 130 }}
              value={filter.type}
              onChange={(type) => setFilter((f) => ({ ...f, type }))}
              options={PAYMENT_KINDS.map((value) => ({ value, label: codeLabel(value) }))}
            />
            <Select
              allowClear
              placeholder="All statuses"
              style={{ width: 140 }}
              value={filter.status}
              onChange={(status) => setFilter((f) => ({ ...f, status }))}
              options={statusOptions(PAYMENT_STATUS)}
            />
            <DatePicker.RangePicker
              value={range}
              onChange={(r) => setFilter((f) => ({ ...f, from: r?.[0]?.format("YYYY-MM-DD"), to: r?.[1]?.format("YYYY-MM-DD") }))}
            />
            {canManage && (
              <Button danger icon={<RollbackOutlined />} onClick={() => setRefundOpen(true)}>
                Refund
              </Button>
            )}
          </Space>
        }
      >
        {!payments.loading && !payments.error && data.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={filtered ? "No payments match these filters. Clear a filter to see more." : "No payments recorded yet."}
            style={{ padding: 32 }}
          />
        ) : (
          <>
            <div style={{ padding: "12px 16px" }}>
              <Space wrap size="large">
                <Typography.Text>Collected <Typography.Text strong>{formatMoney(collected)}</Typography.Text></Typography.Text>
                <Typography.Text>Refunded <Typography.Text strong type="danger">{formatMoney(refunded)}</Typography.Text></Typography.Text>
                <Typography.Text>Pending <Typography.Text strong>{formatMoney(pending)}</Typography.Text></Typography.Text>
              </Space>
            </div>
            <PaymentTable
              payments={data}
              loading={payments.loading}
              showBranch={user?.scopeLevel === "CHAIN"}
              canManage={canManage}
              actingId={actingId}
              onConfirm={(p) => setStatus(p, "PAID")}
              onFail={markFailed}
            />
          </>
        )}
      </Card>
      <RefundModal open={refundOpen} booking={null} saving={saving} onCancel={() => setRefundOpen(false)} onSubmit={refund} />
    </>
  );
}
