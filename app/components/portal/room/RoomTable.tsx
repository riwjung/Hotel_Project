"use client";

import { Button, Dropdown, Space, Table, Tooltip, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, DownOutlined, EditOutlined } from "@ant-design/icons";
import { ROOM_STATUS } from "@/app/lib/status";
import { sortByOrder, sortNumber, sortText } from "@/app/lib/table-sort";
import StatusTag from "../StatusTag";
import { MANUAL_ROOM_STATUSES, ROOM_STATUSES, type ManualRoomStatus, type Room } from "./types";

type Props = {
  rooms: Room[];
  loading: boolean;
  showBranch: boolean;
  canManage?: boolean;
  onEdit?: (room: Room) => void;
  onDelete?: (room: Room) => void;
  onSetStatus?: (room: Room, status: ManualRoomStatus) => void;
};

export default function RoomTable({ rooms, loading, showBranch, canManage = false, onEdit, onDelete, onSetStatus }: Props) {
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

  if (canManage) {
    columns.push({
      title: "",
      key: "actions",
      fixed: "right",
      render: (_, r) => (
        <Space size={4}>
          {r.roomStatus === "OCCUPIED" ? (
            <Tooltip title="A guest is in house — check-out changes the status">
              <Button size="small" disabled>Status <DownOutlined /></Button>
            </Tooltip>
          ) : (
            <Dropdown
              trigger={["click"]}
              menu={{
                items: MANUAL_ROOM_STATUSES.filter((s) => s !== r.roomStatus).map((s) => ({
                  key: s,
                  icon: ROOM_STATUS[s].icon,
                  label: ROOM_STATUS[s].label,
                })),
                onClick: ({ key, domEvent }) => {
                  domEvent.stopPropagation();
                  onSetStatus?.(r, key as ManualRoomStatus);
                },
              }}
            >
              <Button size="small" aria-label={`Change status of room ${r.roomNumber}`} onClick={(e) => e.stopPropagation()}>
                Status <DownOutlined />
              </Button>
            </Dropdown>
          )}
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} aria-label={`Edit room ${r.roomNumber}`} onClick={(e) => { e.stopPropagation(); onEdit?.(r); }} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label={`Delete room ${r.roomNumber}`} onClick={(e) => { e.stopPropagation(); onDelete?.(r); }} />
          </Tooltip>
        </Space>
      ),
    });
  }

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
      onRow={(r) => (canManage && onEdit ? { onClick: () => onEdit(r), style: { cursor: "pointer" } } : {})}
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
