"use client";

import { Table, Tooltip, Typography, type TableColumnsType } from "antd";
import { formatMoney } from "@/app/lib/format";
import { ROOM_STATUS } from "@/app/lib/status";
import { sortByOrder, sortNumber, sortText } from "@/app/lib/table-sort";
import { ROOM_STATUSES } from "../room/types";
import StatusTag from "../StatusTag";
import type { AvailableRoom } from "./types";

type Props = {
  rooms: AvailableRoom[];
  loading: boolean;
  nights: number;
  selected: number[];
  onChange: (roomIds: number[]) => void;
};

export default function AvailableRoomTable({ rooms, loading, nights, selected, onChange }: Props) {
  const tooShort = (room: AvailableRoom) => nights > 0 && nights < room.minNights;
  const columns: TableColumnsType<AvailableRoom> = [
    {
      title: "Room",
      dataIndex: "roomNumber",
      sorter: sortText<AvailableRoom>((r) => r.roomNumber),
      defaultSortOrder: "ascend",
      render: (value: string, room) => (
        <>
          <Typography.Text strong>{value}</Typography.Text>
          {room.roomName && <Typography.Text type="secondary"> · {room.roomName}</Typography.Text>}
        </>
      ),
    },
    { title: "Type", dataIndex: "typeName", sorter: sortText<AvailableRoom>((r) => r.typeName) },
    { title: "Sleeps", dataIndex: "capacity", align: "right", sorter: sortNumber<AvailableRoom>((r) => r.capacity) },
    { title: "Bed", dataIndex: "bedType", sorter: sortText<AvailableRoom>((r) => r.bedType) },
    { title: "Rate", dataIndex: "rateName", sorter: sortText<AvailableRoom>((r) => r.rateName) },
    {
      title: "Nightly",
      dataIndex: "pricePerNight",
      align: "right",
      sorter: sortNumber<AvailableRoom>((r) => r.pricePerNight),
      render: formatMoney,
    },
    {
      title: "Min nights",
      dataIndex: "minNights",
      align: "right",
      sorter: sortNumber<AvailableRoom>((r) => r.minNights),
      render: (value: number, room) =>
        tooShort(room) ? (
          <Tooltip title={`This rate needs at least ${value} nights`}>
            <Typography.Text type="danger">{value}</Typography.Text>
          </Tooltip>
        ) : (
          value
        ),
    },
    {
      title: "Room subtotal",
      key: "subtotal",
      align: "right",
      sorter: sortNumber<AvailableRoom>((r) => r.pricePerNight * nights),
      render: (_, room) => formatMoney(room.pricePerNight * nights),
    },
    {
      title: "Status now",
      dataIndex: "roomStatus",
      sorter: sortByOrder<AvailableRoom>((r) => r.roomStatus, ROOM_STATUSES),
      render: (value: AvailableRoom["roomStatus"]) => <StatusTag value={value} palette={ROOM_STATUS} />,
    },
  ];

  return (
    <Table<AvailableRoom>
      rowKey="roomId"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={rooms}
      scroll={{ x: "max-content" }}
      pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
      rowSelection={{
        type: "checkbox",
        selectedRowKeys: selected,
        onChange: (keys) => onChange(keys as number[]),
        getCheckboxProps: (room) => ({ disabled: tooShort(room), "aria-label": `Select room ${room.roomNumber}` }),
      }}
      onRow={(room) => ({
        onClick: (event) => {
          // the checkbox cell already toggles through rowSelection
          if (tooShort(room) || (event.target as HTMLElement).closest(".ant-table-selection-column")) return;
          onChange(selected.includes(room.roomId) ? selected.filter((id) => id !== room.roomId) : [...selected, room.roomId]);
        },
        style: { cursor: tooShort(room) ? "not-allowed" : "pointer" },
      })}
    />
  );
}
