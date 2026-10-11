"use client";

import { Button, Space, Table, Typography, type TableColumnsType } from "antd";
import { CheckOutlined, PlayCircleOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { formatDate, formatDateTime } from "@/app/lib/format";
import { HOUSEKEEPING_STATUS } from "@/app/lib/status";
import { sortByOrder, sortDate, sortText } from "@/app/lib/table-sort";
import StatusTag from "../StatusTag";
import { HOUSEKEEPING_STATUSES, type HousekeepingStatus, type HousekeepingTask } from "./types";

type NextStatus = Extract<HousekeepingStatus, "IN_PROGRESS" | "DONE" | "VERIFIED">;
type Props = {
  tasks: HousekeepingTask[];
  loading: boolean;
  showBranch: boolean;
  canManage: boolean;
  actingId: number | null;
  onAdvance: (task: HousekeepingTask, status: NextStatus) => void;
};

const codeLabel = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

export default function HousekeepingTable({ tasks, loading, showBranch, canManage, actingId, onAdvance }: Props) {
  const columns: TableColumnsType<HousekeepingTask> = [
    ...(showBranch
      ? [{ title: "Branch", dataIndex: "branchCode", sorter: sortText<HousekeepingTask>((row) => row.branchCode) }]
      : []),
    { title: "Room", dataIndex: "roomNumber", sorter: sortText<HousekeepingTask>((row) => row.roomNumber), render: (value: string) => <Typography.Text strong>{value}</Typography.Text> },
    { title: "Date", dataIndex: "taskDate", sorter: sortDate<HousekeepingTask>((row) => row.taskDate), render: formatDate },
    { title: "Task", dataIndex: "taskType", sorter: sortText<HousekeepingTask>((row) => row.taskType), render: codeLabel },
    { title: "Assigned to", dataIndex: "assignedEmployee", sorter: sortText<HousekeepingTask>((row) => row.assignedEmployee) },
    { title: "Started", dataIndex: "startedAt", sorter: sortDate<HousekeepingTask>((row) => row.startedAt), render: formatDateTime },
    { title: "Completed", dataIndex: "completedAt", sorter: sortDate<HousekeepingTask>((row) => row.completedAt), render: formatDateTime },
    { title: "Verified by", dataIndex: "verifiedByName", sorter: sortText<HousekeepingTask>((row) => row.verifiedByName), render: (value) => value || "—" },
    { title: "Remark", dataIndex: "remark", sorter: sortText<HousekeepingTask>((row) => row.remark), render: (value) => value || "—" },
    {
      title: "Status",
      dataIndex: "taskStatus",
      sorter: sortByOrder<HousekeepingTask>((row) => row.taskStatus, HOUSEKEEPING_STATUSES),
      render: (value: HousekeepingStatus) => <StatusTag value={value} palette={HOUSEKEEPING_STATUS} />,
    },
  ];

  if (canManage) {
    columns.push({
      title: "Action",
      key: "action",
      fixed: "right",
      render: (_, task) => (
        <Space>
          {task.taskStatus === "PENDING" && (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} loading={actingId === task.taskId} onClick={() => onAdvance(task, "IN_PROGRESS")}>Start</Button>
          )}
          {task.taskStatus === "IN_PROGRESS" && (
            <Button size="small" type="primary" icon={<CheckOutlined />} loading={actingId === task.taskId} onClick={() => onAdvance(task, "DONE")}>Mark done</Button>
          )}
          {task.taskStatus === "DONE" && (
            <Button size="small" type="primary" icon={<SafetyCertificateOutlined />} loading={actingId === task.taskId} onClick={() => onAdvance(task, "VERIFIED")}>Verify</Button>
          )}
        </Space>
      ),
    });
  }

  return (
    <Table<HousekeepingTask>
      rowKey="taskId"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={tasks}
      scroll={{ x: "max-content" }}
      pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
    />
  );
}
