"use client";

import { Button, Space, Table, Tooltip, Typography, type TableColumnsType } from "antd";
import { CheckOutlined, CloseOutlined, EditOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { formatDateTime, formatMoney } from "@/app/lib/format";
import { MAINTENANCE_PRIORITY, MAINTENANCE_STATUS, ROOM_STATUS } from "@/app/lib/status";
import { sortByOrder, sortDate, sortNumber, sortText } from "@/app/lib/table-sort";
import StatusTag from "../StatusTag";
import { MAINTENANCE_PRIORITIES, MAINTENANCE_STATUSES, type MaintenanceRequest } from "./types";

type Props = {
  requests: MaintenanceRequest[];
  loading: boolean;
  showBranch: boolean;
  canManage: boolean;
  actingId: number | null;
  onEdit: (request: MaintenanceRequest) => void;
  onStart: (request: MaintenanceRequest) => void;
  onResolve: (request: MaintenanceRequest) => void;
  onCancelRequest: (request: MaintenanceRequest) => void;
};

const dash = <Typography.Text type="secondary">—</Typography.Text>;
const isOpen = (r: MaintenanceRequest) => r.maintenanceStatus === "OPEN" || r.maintenanceStatus === "IN_PROGRESS";

export default function MaintenanceTable({
  requests, loading, showBranch, canManage, actingId, onEdit, onStart, onResolve, onCancelRequest,
}: Props) {
  const columns: TableColumnsType<MaintenanceRequest> = [
    ...(showBranch
      ? [{ title: "Branch", dataIndex: "branchCode", sorter: sortText<MaintenanceRequest>((r) => r.branchCode) }]
      : []),
    {
      title: "Issue",
      dataIndex: "issueTitle",
      sorter: sortText<MaintenanceRequest>((r) => r.issueTitle),
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: "Room",
      key: "room",
      sorter: sortText<MaintenanceRequest>((r) => r.roomNumber),
      render: (_, r) =>
        r.roomNumber ? (
          <Space size={6}>
            {r.roomNumber}
            {r.roomStatus && <StatusTag value={r.roomStatus} palette={ROOM_STATUS} />}
          </Space>
        ) : (
          <Typography.Text type="secondary">Common area</Typography.Text>
        ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      // urgency order: urgent first when ascending
      sorter: sortByOrder<MaintenanceRequest>((r) => r.priority, [...MAINTENANCE_PRIORITIES].reverse()),
      render: (value: MaintenanceRequest["priority"]) => <StatusTag value={value} palette={MAINTENANCE_PRIORITY} />,
    },
    {
      title: "Status",
      dataIndex: "maintenanceStatus",
      sorter: sortByOrder<MaintenanceRequest>((r) => r.maintenanceStatus, MAINTENANCE_STATUSES),
      render: (value: MaintenanceRequest["maintenanceStatus"]) => <StatusTag value={value} palette={MAINTENANCE_STATUS} />,
    },
    {
      title: "Assigned to",
      dataIndex: "assignedToName",
      sorter: sortText<MaintenanceRequest>((r) => r.assignedToName),
      render: (value: string | null) => value ?? dash,
    },
    { title: "Reported by", dataIndex: "reportedByName", sorter: sortText<MaintenanceRequest>((r) => r.reportedByName) },
    { title: "Reported", dataIndex: "reportDate", sorter: sortDate<MaintenanceRequest>((r) => r.reportDate), render: formatDateTime },
    { title: "Done", dataIndex: "doneDate", sorter: sortDate<MaintenanceRequest>((r) => r.doneDate), render: formatDateTime },
    {
      title: "Cost",
      dataIndex: "cost",
      align: "right",
      sorter: sortNumber<MaintenanceRequest>((r) => r.cost),
      render: (value: number | null) => (value === null ? dash : formatMoney(value)),
    },
  ];

  if (canManage) {
    columns.push({
      title: "Action",
      key: "action",
      fixed: "right",
      render: (_, r) =>
        isOpen(r) ? (
          <Space size={4}>
            {r.maintenanceStatus === "OPEN" && (
              <Button size="small" type="primary" icon={<PlayCircleOutlined />} loading={actingId === r.maintenanceId} onClick={() => onStart(r)}>
                Start
              </Button>
            )}
            <Button size="small" icon={<CheckOutlined />} onClick={() => onResolve(r)}>
              Resolve
            </Button>
            <Tooltip title="Edit">
              <Button size="small" type="text" icon={<EditOutlined />} aria-label={`Edit ${r.issueTitle}`} onClick={() => onEdit(r)} />
            </Tooltip>
            <Tooltip title="Cancel request">
              <Button size="small" type="text" danger icon={<CloseOutlined />} aria-label={`Cancel ${r.issueTitle}`} onClick={() => onCancelRequest(r)} />
            </Tooltip>
          </Space>
        ) : null,
    });
  }

  return (
    <Table<MaintenanceRequest>
      rowKey="maintenanceId"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={requests}
      scroll={{ x: "max-content" }}
      pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
    />
  );
}
