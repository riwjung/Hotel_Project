"use client";

import { Button, Space, Table, Tooltip, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { BRANCH_STATUS } from "@/app/lib/status";
import { sortByOrder, sortNumber, sortText } from "@/app/lib/table-sort";
import StatusTag from "../StatusTag";
import type { Branch } from "./types";

type Props = {
  branches: Branch[];
  loading: boolean;
  canManage: boolean;
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
};

export default function BranchTable({ branches, loading, canManage, onEdit, onDelete }: Props) {
  const columns: TableColumnsType<Branch> = [
    {
      title: "Code",
      dataIndex: "branchCode",
      sorter: sortText<Branch>((r) => r.branchCode),
      defaultSortOrder: "ascend",
      render: (v: string) => <Typography.Text strong>{v}</Typography.Text>,
    },
    { title: "Name", dataIndex: "branchName", sorter: sortText<Branch>((r) => r.branchName) },
    { title: "Province", dataIndex: "province", sorter: sortText<Branch>((r) => r.province) },
    {
      title: "Phone",
      dataIndex: "phone",
      sorter: sortText<Branch>((r) => r.phone),
      render: (v: string | null) => v ?? <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: "Check-in / out",
      key: "times",
      sorter: sortText<Branch>((r) => r.checkInTime),
      render: (_, r) => `${r.checkInTime} – ${r.checkOutTime}`,
    },
    { title: "Rooms", dataIndex: "roomCount", align: "right", sorter: sortNumber<Branch>((r) => r.roomCount) },
    { title: "Staff", dataIndex: "employeeCount", align: "right", sorter: sortNumber<Branch>((r) => r.employeeCount) },
    {
      title: "Status",
      dataIndex: "branchStatus",
      sorter: sortByOrder<Branch>((r) => r.branchStatus, Object.keys(BRANCH_STATUS)),
      render: (v: Branch["branchStatus"]) => <StatusTag value={v} palette={BRANCH_STATUS} />,
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
              aria-label={`Edit ${r.branchCode}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(r);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label={`Delete ${r.branchCode}`}
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
    <Table<Branch>
      rowKey="branchId"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={branches}
      scroll={{ x: "max-content" }}
      pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
      onRow={(r) => (canManage ? { onClick: () => onEdit(r), style: { cursor: "pointer" } } : {})}
    />
  );
}
