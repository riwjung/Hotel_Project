"use client";

import { Button, Space, Table, Tooltip, Typography, type TableColumnsType } from "antd";
import { CheckOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { formatDate } from "@/app/lib/format";
import { sortDate, sortNumber, sortText } from "@/app/lib/table-sort";
import type { Customer } from "./types";

type Props = {
  customers: Customer[];
  loading: boolean;
  canManage: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
};

const dash = <Typography.Text type="secondary">—</Typography.Text>;

export default function CustomerTable({ customers, loading, canManage, onEdit, onDelete }: Props) {
  const columns: TableColumnsType<Customer> = [
    {
      title: "Customer",
      key: "name",
      sorter: sortText<Customer>((r) => `${r.firstName} ${r.lastName}`),
      defaultSortOrder: "ascend",
      render: (_, r) => <Typography.Text strong>{r.firstName} {r.lastName}</Typography.Text>,
    },
    {
      title: "Tier",
      dataIndex: "tierName",
      // the tier follows the points (R13), so points give the tier order
      sorter: sortNumber<Customer>((r) => r.memberPoint),
      render: (value: string, r) => (
        <>
          {value}
          {r.discountRate > 0 && <Typography.Text type="secondary"> · {r.discountRate}% off</Typography.Text>}
        </>
      ),
    },
    {
      title: "Points",
      dataIndex: "memberPoint",
      align: "right",
      sorter: sortNumber<Customer>((r) => r.memberPoint),
      render: (v: number) => v.toLocaleString("en-US"),
    },
    { title: "Email", dataIndex: "email", sorter: sortText<Customer>((r) => r.email) },
    { title: "Phone", dataIndex: "phone", sorter: sortText<Customer>((r) => r.phone), render: (v: string | null) => v ?? dash },
    { title: "ID / passport", dataIndex: "idCardNo", sorter: sortText<Customer>((r) => r.idCardNo), render: (v: string | null) => v ?? dash },
    { title: "Bookings", dataIndex: "bookingCount", align: "right", sorter: sortNumber<Customer>((r) => r.bookingCount) },
    { title: "Last stay", dataIndex: "lastStayDate", sorter: sortDate<Customer>((r) => r.lastStayDate), render: formatDate },
    { title: "Member since", dataIndex: "createdAt", sorter: sortDate<Customer>((r) => r.createdAt), render: formatDate },
    {
      title: "Online account",
      dataIndex: "hasOnlineAccount",
      align: "center",
      sorter: sortNumber<Customer>((r) => (r.hasOnlineAccount ? 1 : 0)),
      render: (v: boolean) => (v ? <CheckOutlined aria-label="Yes" /> : dash),
    },
  ];

  if (canManage) {
    columns.push({
      title: "",
      key: "actions",
      fixed: "right",
      width: 96,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label={`Edit ${r.firstName} ${r.lastName}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(r);
              }}
            />
          </Tooltip>
          <Tooltip title={r.bookingCount ? "Customers with bookings cannot be deleted" : "Delete"}>
            <Button
              type="text"
              danger
              disabled={r.bookingCount > 0}
              icon={<DeleteOutlined />}
              aria-label={`Delete ${r.firstName} ${r.lastName}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(r);
              }}
            />
          </Tooltip>
        </Space>
      ),
    });
  }

  return (
    <Table<Customer>
      rowKey="customerId"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={customers}
      scroll={{ x: "max-content" }}
      pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
      onRow={(r) => (canManage ? { onClick: () => onEdit(r), style: { cursor: "pointer" } } : {})}
    />
  );
}
