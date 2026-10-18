"use client";

import Link from "next/link";
import { Button, Rate, Space, Table, Typography, type TableColumnsType } from "antd";
import { EyeInvisibleOutlined, GlobalOutlined } from "@ant-design/icons";
import { formatDateTime } from "@/app/lib/format";
import { REVIEW_STATUS } from "@/app/lib/status";
import { sortByOrder, sortDate, sortNumber, sortText } from "@/app/lib/table-sort";
import StatusTag from "../StatusTag";
import { REVIEW_STATUSES, type Review } from "./types";

type Props = {
  reviews: Review[];
  loading: boolean;
  showBranch: boolean;
  canModerate: boolean;
  actingId: number | null;
  onModerate: (review: Review, toStatus: "PUBLISHED" | "HIDDEN") => void;
};

export default function ReviewTable({ reviews, loading, showBranch, canModerate, actingId, onModerate }: Props) {
  const columns: TableColumnsType<Review> = [
    { title: "Date", dataIndex: "reviewDate", sorter: sortDate<Review>((r) => r.reviewDate), render: formatDateTime },
    {
      title: "Booking",
      dataIndex: "bookingCode",
      sorter: sortText<Review>((r) => r.bookingCode),
      render: (value: string, r) => <Link href={`/bookings/${r.bookingId}`}>{value}</Link>,
    },
    ...(showBranch ? [{ title: "Branch", dataIndex: "branchCode", sorter: sortText<Review>((r) => r.branchCode) }] : []),
    { title: "Guest", dataIndex: "customerName", sorter: sortText<Review>((r) => r.customerName) },
    {
      title: "Overall",
      dataIndex: "averageRating",
      sorter: sortNumber<Review>((r) => r.averageRating),
      render: (value: number) => (
        <Space size={4}>
          <Rate disabled allowHalf value={Math.round(value * 2) / 2} style={{ fontSize: 14 }} />
          <Typography.Text type="secondary">{value.toFixed(1)}</Typography.Text>
        </Space>
      ),
    },
    { title: "Room", dataIndex: "roomRating", align: "right", sorter: sortNumber<Review>((r) => r.roomRating) },
    { title: "Service", dataIndex: "serviceRating", align: "right", sorter: sortNumber<Review>((r) => r.serviceRating) },
    { title: "Staff", dataIndex: "staffRating", align: "right", sorter: sortNumber<Review>((r) => r.staffRating) },
    {
      title: "Comment",
      dataIndex: "comment",
      sorter: sortText<Review>((r) => r.comment),
      render: (value: string | null) =>
        value ? (
          <Typography.Paragraph ellipsis={{ rows: 2, tooltip: value }} style={{ margin: 0, maxWidth: 320 }}>
            {value}
          </Typography.Paragraph>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: "Status",
      dataIndex: "reviewStatus",
      sorter: sortByOrder<Review>((r) => r.reviewStatus, REVIEW_STATUSES),
      render: (value: Review["reviewStatus"]) => <StatusTag value={value} palette={REVIEW_STATUS} />,
    },
    {
      title: "Handled by",
      dataIndex: "handledByName",
      sorter: sortText<Review>((r) => r.handledByName),
      render: (value: string | null) => value ?? <Typography.Text type="secondary">—</Typography.Text>,
    },
  ];

  if (canModerate) {
    columns.push({
      title: "Action",
      key: "action",
      fixed: "right",
      render: (_, r) => (
        <Space size={4}>
          {r.reviewStatus !== "PUBLISHED" && (
            <Button size="small" type="primary" icon={<GlobalOutlined />} loading={actingId === r.reviewId} onClick={() => onModerate(r, "PUBLISHED")}>
              Publish
            </Button>
          )}
          {r.reviewStatus !== "HIDDEN" && (
            <Button size="small" icon={<EyeInvisibleOutlined />} onClick={() => onModerate(r, "HIDDEN")}>
              Hide
            </Button>
          )}
        </Space>
      ),
    });
  }

  return (
    <Table<Review>
      rowKey="reviewId"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={reviews}
      scroll={{ x: "max-content" }}
      pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
    />
  );
}
