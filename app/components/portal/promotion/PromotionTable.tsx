"use client";

import { Button, Space, Table, Tooltip, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { formatDate, formatMoney } from "@/app/lib/format";
import { PROMOTION_STATUS } from "@/app/lib/status";
import { sortByOrder, sortDate, sortNumber, sortText } from "@/app/lib/table-sort";
import StatusTag from "../StatusTag";
import { discountLabel } from "./promotion.api";
import { PROMOTION_STATUSES, type Promotion } from "./types";

type Props = {
  promotions: Promotion[];
  loading: boolean;
  onEdit: (promotion: Promotion) => void;
  onDelete: (promotion: Promotion) => void;
};

export default function PromotionTable({ promotions, loading, onEdit, onDelete }: Props) {
  const columns: TableColumnsType<Promotion> = [
    {
      title: "Code",
      dataIndex: "promotionCode",
      sorter: sortText<Promotion>((r) => r.promotionCode),
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    { title: "Name", dataIndex: "promotionName", sorter: sortText<Promotion>((r) => r.promotionName) },
    {
      title: "Discount",
      key: "discount",
      align: "right",
      sorter: sortText<Promotion>((r) => `${r.discountType}${String(r.discountValue).padStart(10, "0")}`),
      render: (_, r) => discountLabel(r, formatMoney),
    },
    {
      title: "Minimum spend",
      dataIndex: "minimumAmount",
      align: "right",
      sorter: sortNumber<Promotion>((r) => r.minimumAmount),
      render: formatMoney,
    },
    { title: "From", dataIndex: "startDate", sorter: sortDate<Promotion>((r) => r.startDate), render: formatDate },
    { title: "To", dataIndex: "endDate", sorter: sortDate<Promotion>((r) => r.endDate), render: formatDate },
    {
      title: "Used",
      key: "used",
      align: "right",
      sorter: sortNumber<Promotion>((r) => r.usedCount),
      render: (_, r) => (r.usageLimit === null ? `${r.usedCount} / ∞` : `${r.usedCount} / ${r.usageLimit}`),
    },
    {
      title: "Status",
      dataIndex: "promotionStatus",
      sorter: sortByOrder<Promotion>((r) => r.promotionStatus, PROMOTION_STATUSES),
      render: (value: Promotion["promotionStatus"]) => <StatusTag value={value} palette={PROMOTION_STATUS} />,
    },
    {
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
              aria-label={`Edit ${r.promotionCode}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(r);
              }}
            />
          </Tooltip>
          <Tooltip title={r.inUse ? "Used by bookings — set it Inactive instead" : "Delete"}>
            <Button
              type="text"
              danger
              disabled={r.inUse}
              icon={<DeleteOutlined />}
              aria-label={`Delete ${r.promotionCode}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(r);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table<Promotion>
      rowKey="promotionId"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={promotions}
      scroll={{ x: "max-content" }}
      pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
      onRow={(r) => ({ onClick: () => onEdit(r), style: { cursor: "pointer" } })}
    />
  );
}
