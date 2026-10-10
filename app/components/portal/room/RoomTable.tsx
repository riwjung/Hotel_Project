"use client";

import { Space, Table, Typography, type TableColumnsType } from "antd";
import { ROOM_STATUS } from "@/app/lib/status";
import { sortByOrder, sortNumber, sortText } from "@/app/lib/table-sort";
import StatusTag from "../StatusTag";
import { ROOM_STATUSES, type Room } from "./types";

type Props = {
  rooms: Room[];
  loading: boolean;
  showBranch: boolean;
};

export default function RoomTable({ rooms, loading, showBranch }: Props) {
  const columns: TableColumnsType<Room> = [
    ...(showBranch
      ? [{ title: "Branch", dataIndex: "branchCode", sorter: sortText<Room>((r) => r.branchCode) }]
      : []),
    {
      title: "Room",
      key: "room",
      sorter: sortText<Room>((r) => r.roomNumber),
      render: (_, r) => (
        <>
          <Typography.Text strong>{r.roomNumber}</Typography.Text>
          {r.roomName && <Typography.Text type="secondary"> · {r.roomName}</Typography.Text>}
        </>
      ),
    },
    {
      title: "Type",
      key: "type",
      sorter: sortText<Room>((r) => r.typeName),
      render: (_, r) => (
        <>
          {r.typeName} <Typography.Text type="secondary">({r.bedType})</Typography.Text>
        </>
      ),
    },
    { title: "Guests", dataIndex: "capacity", align: "right", sorter: sortNumber<Room>((r) => r.capacity) },
    { title: "Floor", dataIndex: "floor", align: "right", sorter: sortNumber<Room>((r) => r.floor) },
    {
      title: "Zone",
      dataIndex: "locationZone",
      sorter: sortText<Room>((r) => r.locationZone),
      render: (v: string | null) => v ?? <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: "Status",
      dataIndex: "roomStatus",
      sorter: sortByOrder<Room>((r) => r.roomStatus, ROOM_STATUSES),
      render: (v: Room["roomStatus"]) => <StatusTag value={v} palette={ROOM_STATUS} />,
    },
  ];

  // Legend doubles as a status summary for the current filter
  const counts = ROOM_STATUSES.map((s) => [s, rooms.filter((r) => r.roomStatus === s).length] as const);

  return (
    <Table<Room>
      rowKey="roomId"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={rooms}
      scroll={{ x: "max-content" }}
      pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
      title={() => (
        <Space wrap size={[8, 8]}>
          {counts.map(([status, n]) => (
            <span key={status}>
              <StatusTag value={status} palette={ROOM_STATUS} />
              <Typography.Text type="secondary">{n}</Typography.Text>
            </span>
          ))}
        </Space>
      )}
    />
  );
}
