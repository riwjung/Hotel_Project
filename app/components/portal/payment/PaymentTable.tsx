"use client";

import Link from "next/link";
import { Button, Space, Table, Typography, type TableColumnsType } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { codeLabel, formatDateTime, formatMoney } from "@/app/lib/format";
import { PAYMENT_STATUS } from "@/app/lib/status";
import { sortByOrder, sortDate, sortNumber, sortText } from "@/app/lib/table-sort";
import StatusTag from "../StatusTag";
import { PAYMENT_STATUSES, type PaymentRow } from "./types";

type Props = {
  payments: PaymentRow[];
  loading: boolean;
  showBranch: boolean;
  canManage: boolean;
  actingId: number | null;
  onConfirm: (payment: PaymentRow) => void;
  onFail: (payment: PaymentRow) => void;
};

/** Refunds count as money out. */
export const signedAmount = (p: PaymentRow) => (p.paymentType === "REFUND" ? -p.amount : p.amount);

export default function PaymentTable({ payments, loading, showBranch, canManage, actingId, onConfirm, onFail }: Props) {
  const columns: TableColumnsType<PaymentRow> = [
    { title: "Date", dataIndex: "paymentDate", sorter: sortDate<PaymentRow>((r) => r.paymentDate), render: formatDateTime },
    {
      title: "Booking",
      dataIndex: "bookingCode",
      sorter: sortText<PaymentRow>((r) => r.bookingCode),
      render: (value: string, r) => <Link href={`/bookings/${r.bookingId}`}>{value}</Link>,
    },
    ...(showBranch ? [{ title: "Branch", dataIndex: "branchCode", sorter: sortText<PaymentRow>((r) => r.branchCode) }] : []),
    { title: "Customer", dataIndex: "customerName", sorter: sortText<PaymentRow>((r) => r.customerName) },
    { title: "Type", dataIndex: "paymentType", sorter: sortText<PaymentRow>((r) => r.paymentType), render: codeLabel },
    { title: "Method", dataIndex: "paymentMethod", sorter: sortText<PaymentRow>((r) => r.paymentMethod), render: codeLabel },
    {
      title: "Amount",
      key: "amount",
      align: "right",
      sorter: sortNumber<PaymentRow>(signedAmount),
      render: (_, r) =>
        r.paymentType === "REFUND" ? (
          <Typography.Text type="danger">−{formatMoney(r.amount)}</Typography.Text>
        ) : (
          formatMoney(r.amount)
        ),
    },
    {
      title: "Reference",
      dataIndex: "transactionRef",
      sorter: sortText<PaymentRow>((r) => r.transactionRef),
      render: (value: string | null) => value ?? <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: "Received by",
      dataIndex: "receivedByName",
      sorter: sortText<PaymentRow>((r) => r.receivedByName),
      render: (value: string | null) => value ?? <Typography.Text type="secondary">Online</Typography.Text>,
    },
    {
      title: "Status",
      dataIndex: "paymentStatus",
      sorter: sortByOrder<PaymentRow>((r) => r.paymentStatus, PAYMENT_STATUSES),
      render: (value: PaymentRow["paymentStatus"]) => <StatusTag value={value} palette={PAYMENT_STATUS} />,
    },
  ];

  if (canManage) {
    columns.push({
      title: "Action",
      key: "action",
      fixed: "right",
      render: (_, r) =>
        r.paymentStatus === "PENDING" ? (
          <Space size={4}>
            <Button size="small" type="primary" icon={<CheckOutlined />} loading={actingId === r.paymentId} onClick={() => onConfirm(r)}>
              Confirm
            </Button>
            <Button size="small" danger icon={<CloseOutlined />} onClick={() => onFail(r)}>
              Failed
            </Button>
          </Space>
        ) : null,
    });
  }

  return (
    <Table<PaymentRow>
      rowKey="paymentId"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={payments}
      scroll={{ x: "max-content" }}
      pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
    />
  );
}
