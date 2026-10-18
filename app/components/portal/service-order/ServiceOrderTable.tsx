"use client";

import Link from "next/link";
import { Button, Space, Table, Tooltip, Typography, type TableColumnsType } from "antd";
import { CalendarOutlined, CheckOutlined, CloseOutlined, PlayCircleOutlined, TeamOutlined, UserSwitchOutlined } from "@ant-design/icons";
import { formatDateTime, formatMoney } from "@/app/lib/format";
import { ORDER_STATUS } from "@/app/lib/status";
import { sortByOrder, sortDate, sortNumber, sortText } from "@/app/lib/table-sort";
import StatusTag from "../StatusTag";
import { ORDER_STATUSES, type ServiceOrder } from "./types";

type Props = {
  orders: ServiceOrder[];
  loading: boolean;
  showBranch: boolean;
  canProgress: boolean;
  canAssign: boolean;
  actingId: number | null;
  onSchedule: (o: ServiceOrder) => void;
  onStart: (o: ServiceOrder) => void;
  onComplete: (o: ServiceOrder) => void;
  onCancelOrder: (o: ServiceOrder) => void;
  onAssign: (o: ServiceOrder) => void;
};

const isOpen = (o: ServiceOrder) => o.orderStatus === "REQUESTED" || o.orderStatus === "SCHEDULED" || o.orderStatus === "IN_PROGRESS";

export default function ServiceOrderTable({
  orders, loading, showBranch, canProgress, canAssign, actingId, onSchedule, onStart, onComplete, onCancelOrder, onAssign,
}: Props) {
  const columns: TableColumnsType<ServiceOrder> = [
    {
      title: "Booking",
      dataIndex: "bookingCode",
      sorter: sortText<ServiceOrder>((o) => o.bookingCode),
      render: (v: string, o) => (
        <>
          <Link href={`/bookings/${o.bookingId}`}>{v}</Link>
          {o.roomNumbers && <Typography.Text type="secondary"> · room {o.roomNumbers}</Typography.Text>}
        </>
      ),
    },
    ...(showBranch ? [{ title: "Branch", dataIndex: "branchCode", sorter: sortText<ServiceOrder>((o) => o.branchCode) }] : []),
    { title: "Guest", dataIndex: "customerName", sorter: sortText<ServiceOrder>((o) => o.customerName) },
    {
      title: "Service",
      dataIndex: "serviceName",
      sorter: sortText<ServiceOrder>((o) => o.serviceName),
      render: (v: string, o) => (
        <Space size={6}>
          <Typography.Text strong>{v}</Typography.Text>
          {o.needAssignment && (
            <Tooltip title="Needs a skilled employee">
              <TeamOutlined aria-label="needs staff" />
            </Tooltip>
          )}
        </Space>
      ),
    },
    { title: "Qty", dataIndex: "quantity", align: "right", sorter: sortNumber<ServiceOrder>((o) => o.quantity) },
    { title: "Subtotal", dataIndex: "subtotal", align: "right", sorter: sortNumber<ServiceOrder>((o) => o.subtotal), render: formatMoney },
    { title: "Requested", dataIndex: "requestedAt", sorter: sortDate<ServiceOrder>((o) => o.requestedAt), render: formatDateTime },
    { title: "Scheduled", dataIndex: "scheduledAt", sorter: sortDate<ServiceOrder>((o) => o.scheduledAt), render: formatDateTime },
    {
      title: "Assigned to",
      dataIndex: "assigneeName",
      sorter: sortText<ServiceOrder>((o) => o.assigneeName),
      render: (v: string | null, o) =>
        v ?? (o.needAssignment && isOpen(o) ? <Typography.Text type="warning">Not assigned</Typography.Text> : <Typography.Text type="secondary">—</Typography.Text>),
    },
    {
      title: "Status",
      dataIndex: "orderStatus",
      sorter: sortByOrder<ServiceOrder>((o) => o.orderStatus, ORDER_STATUSES),
      render: (v: ServiceOrder["orderStatus"]) => <StatusTag value={v} palette={ORDER_STATUS} />,
    },
    {
      title: "Note",
      dataIndex: "remark",
      sorter: sortText<ServiceOrder>((o) => o.remark),
      render: (v: string | null) =>
        v ? (
          <Typography.Text ellipsis={{ tooltip: v }} style={{ maxWidth: 200 }}>
            {v}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
  ];

  if (canProgress || canAssign) {
    columns.push({
      title: "Action",
      key: "action",
      fixed: "right",
      render: (_, o) => {
        if (!isOpen(o)) return null;
        const waitingForStaff = o.needAssignment && !o.assignmentId;
        return (
          <Space size={4}>
            {canAssign && o.needAssignment && (
              <Button size="small" icon={<UserSwitchOutlined />} onClick={() => onAssign(o)}>
                {o.assignmentId ? "Reassign" : "Assign"}
              </Button>
            )}
            {canProgress && o.orderStatus !== "IN_PROGRESS" && (
              <Button size="small" icon={<CalendarOutlined />} onClick={() => onSchedule(o)}>
                {o.orderStatus === "SCHEDULED" ? "Reschedule" : "Schedule"}
              </Button>
            )}
            {canProgress && o.orderStatus !== "IN_PROGRESS" && (
              <Tooltip title={waitingForStaff ? "Assign someone first" : undefined}>
                <Button size="small" type="primary" icon={<PlayCircleOutlined />} disabled={waitingForStaff} loading={actingId === o.bookingServiceId} onClick={() => onStart(o)}>
                  Start
                </Button>
              </Tooltip>
            )}
            {canProgress && (o.orderStatus === "IN_PROGRESS" || !o.needAssignment) && (
              <Button size="small" type={o.orderStatus === "IN_PROGRESS" ? "primary" : "default"} icon={<CheckOutlined />} loading={actingId === o.bookingServiceId} onClick={() => onComplete(o)}>
                Complete
              </Button>
            )}
            {canProgress && (
              <Tooltip title="Cancel order">
                <Button size="small" type="text" danger icon={<CloseOutlined />} aria-label={`Cancel ${o.serviceName}`} onClick={() => onCancelOrder(o)} />
              </Tooltip>
            )}
          </Space>
        );
      },
    });
  }

  return (
    <Table<ServiceOrder>
      rowKey="bookingServiceId"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={orders}
      scroll={{ x: "max-content" }}
      pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
    />
  );
}
